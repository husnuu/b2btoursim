"use server";

import { getSessionState } from "@/lib/auth/session";
import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import { UUID, type TransferState } from "./state";

/**
 * Transfer kataloğunun TAMAMINI tablolara yazar: satırlar upsert edilir,
 * durumda olmayanlar silinir (araçlar silinmez, arşivlenir). Tek operatörün
 * düzenlediği bir modül için tam-durum yazımı, otuz ayrı eylemden daha az
 * kırılgan; depo her değişiklikte gecikmeli çağırır.
 *
 * Kısıt uyumu burada sağlanır: saatlik model ücretsizse rota bazlıya düşer,
 * boş rota slug'ı `taslak-…` olur, saat penceresi ya tam ya hiç.
 */
export type SyncResult = { ok: true } | { ok: false; error: string };

const isUuid = (s: string | null | undefined): s is string => !!s && UUID.test(s);

export async function syncTransferState(state: TransferState): Promise<SyncResult> {
  const session = await getSessionState();
  if (session.kind !== "ready") return { ok: false, error: "auth" };
  const { tenantId } = session.claims;
  const db = await createClient();

  let agencyId = session.claims.agencyId;
  if (!agencyId) {
    const { data: master } = await db.from("agency").select("id").eq("tenant_id", tenantId).eq("type", "master").limit(1).maybeSingle();
    agencyId = master?.id ?? null;
  }
  if (!agencyId) return { ok: false, error: "agency" };

  const errors: string[] = [];
  const check = (label: string) => (res: { error: { code?: string; message?: string } | null }) => {
    if (res.error) {
      errors.push(`${label}:${res.error.code ?? "?"}`);
      log.warn("transfer.sync.step", { tenantId, label, code: res.error.code, message: res.error.message });
    }
  };
  /** `id not in (…)` — liste boşsa kiracının tüm satırları silinir. */
  const pruneBy = async (table: "vehicle_feature" | "vehicle_extra" | "map_zone" | "transfer_point_price" | "zone_price" | "popular_route" | "time_margin_rule", column: "id", keep: string[], label: string) => {
    let q = db.from(table).delete().eq("tenant_id", tenantId);
    if (keep.length) q = q.not(column, "in", `(${keep.join(",")})`);
    check(label)(await q);
  };

  const vehicles = state.vehicles.filter((v) => isUuid(v.id));
  const vehicleIds = new Set(vehicles.map((v) => v.id));
  const features = state.features.filter((f) => isUuid(f.id));
  const extras = state.extras.filter((e) => isUuid(e.id));
  const points = state.points.filter((p) => isUuid(p.id) && p.name.trim());
  const rentalPoints = state.rentalPoints.filter((p) => isUuid(p.id) && p.name.trim());
  const zones = state.mapZones.filter((z) => isUuid(z.id) && z.name.trim());
  const pointIds = new Set(points.map((p) => p.id));
  const zoneIds = new Set(zones.map((z) => z.id));
  const featureIds = new Set(features.map((f) => f.id));
  const extraIds = new Set(extras.map((e) => e.id));

  /* 1. Kütüphaneler */
  if (features.length) check("feature")(await db.from("vehicle_feature").upsert(features.map((f) => ({ id: f.id, tenant_id: tenantId, name: f.name })), { onConflict: "id" }));
  await pruneBy("vehicle_feature", "id", [...featureIds], "feature.prune");
  if (extras.length) check("extra")(await db.from("vehicle_extra").upsert(extras.map((e) => ({ id: e.id, tenant_id: tenantId, name: e.name, price: Math.max(0, Math.round(e.price)), currency: e.currency, type: e.type })), { onConflict: "id" }));
  await pruneBy("vehicle_extra", "id", [...extraIds], "extra.prune");

  /* 2. Noktalar: transfer noktaları ve kiralama noktaları ayrı `kind`. */
  if (points.length) check("point")(await db.from("location_point").upsert(points.map((p) => ({ id: p.id, tenant_id: tenantId, kind: "transfer" as const, name: p.name, address: p.address, description: p.description })), { onConflict: "id" }));
  {
    let q = db.from("location_point").delete().eq("tenant_id", tenantId).eq("kind", "transfer");
    if (pointIds.size) q = q.not("id", "in", `(${[...pointIds].join(",")})`);
    check("point.prune")(await q);
  }
  if (rentalPoints.length) {
    check("rental.point")(await db.from("location_point").upsert(rentalPoints.map((p) => ({ id: p.id, tenant_id: tenantId, kind: "rental" as const, name: p.name })), { onConflict: "id" }));
    check("rental")(await db.from("rental_point").upsert(rentalPoints.map((p) => ({ point_id: p.id, tenant_id: tenantId, role: p.role })), { onConflict: "point_id" }));
  }
  {
    let q = db.from("location_point").delete().eq("tenant_id", tenantId).eq("kind", "rental");
    if (rentalPoints.length) q = q.not("id", "in", `(${rentalPoints.map((p) => p.id).join(",")})`);
    check("rental.prune")(await q);
  }

  /* 3. Araçlar (+ bağlar, çeviri). Durumda olmayan araç arşivlenir. */
  if (vehicles.length) {
    check("vehicle")(await db.from("vehicle").upsert(vehicles.map((v) => {
      const hourly = v.pricingModel === "saatlikKiralama" && v.hourlyRate != null && v.hourlyRate > 0;
      return {
        id: v.id, tenant_id: tenantId, agency_id: agencyId, status: v.status,
        pricing_model: hourly ? "saatlikKiralama" as const : "rotaBazli" as const,
        title: v.title.trim() || "Yeni araç", description: v.description, vehicle_type: v.vehicleType,
        seat_capacity: Math.max(1, v.seatCapacity), luggage_capacity: Math.max(0, v.luggageCapacity),
        hourly_rate: hourly ? Math.round(v.hourlyRate!) : null, hourly_currency: hourly ? state.settings.defaultCurrency : null,
        video_url: v.videoUrl, updated_at: v.updatedAt,
      };
    }), { onConflict: "id" }));
  }
  {
    let q = db.from("vehicle").update({ status: "arsivlendi" }).eq("tenant_id", tenantId);
    if (vehicleIds.size) q = q.not("id", "in", `(${[...vehicleIds].join(",")})`);
    check("vehicle.archive")(await q);
  }
  for (const v of vehicles) {
    await Promise.all([
      db.from("vehicle_feature_link").delete().eq("vehicle_id", v.id),
      db.from("vehicle_extra_link").delete().eq("vehicle_id", v.id),
      db.from("vehicle_translation").delete().eq("vehicle_id", v.id),
    ]);
    const fl = v.featureIds.filter((id) => featureIds.has(id));
    const el = v.extraLinks.filter((l) => extraIds.has(l.extraId));
    await Promise.all([
      fl.length ? db.from("vehicle_feature_link").insert(fl.map((feature_id) => ({ tenant_id: tenantId, vehicle_id: v.id, feature_id }))).then(check("vehicle.features")) : null,
      el.length ? db.from("vehicle_extra_link").insert(el.map((l) => ({ tenant_id: tenantId, vehicle_id: v.id, extra_id: l.extraId, required: l.required, sell_phase: l.sellPhase }))).then(check("vehicle.extras")) : null,
      v.translations.en ? db.from("vehicle_translation").insert({ tenant_id: tenantId, vehicle_id: v.id, locale: "en", title: v.translations.en.title, description: v.translations.en.description, auto: v.translations.en.auto }).then(check("vehicle.translation")) : null,
    ]);
  }

  /* 4. Bölgeler, fiyat matrisleri, km formülü */
  if (zones.length) check("zone")(await db.from("map_zone").upsert(zones.map((z) => ({ id: z.id, tenant_id: tenantId, name: z.name, city_country: z.cityCountry, keywords: z.keywords })), { onConflict: "id" }));
  await pruneBy("map_zone", "id", [...zoneIds], "zone.prune");

  const prices = state.priceMatrix.filter((r) => isUuid(r.id) && pointIds.has(r.fromPointId) && pointIds.has(r.toPointId) && r.fromPointId !== r.toPointId);
  if (prices.length) check("price")(await db.from("transfer_point_price").upsert(prices.map((r) => ({ id: r.id, tenant_id: tenantId, from_point_id: r.fromPointId, to_point_id: r.toPointId, vehicle_type: r.vehicleType, price: Math.max(0, Math.round(r.price)), currency: r.currency })), { onConflict: "id" }));
  await pruneBy("transfer_point_price", "id", prices.map((r) => r.id), "price.prune");

  const zprices = state.zonePriceMatrix.filter((r) => isUuid(r.id) && zoneIds.has(r.fromZoneId) && zoneIds.has(r.toZoneId) && r.fromZoneId !== r.toZoneId);
  if (zprices.length) check("zprice")(await db.from("zone_price").upsert(zprices.map((r) => ({ id: r.id, tenant_id: tenantId, from_zone_id: r.fromZoneId, to_zone_id: r.toZoneId, vehicle_type: r.vehicleType, price: Math.max(0, Math.round(r.price)), currency: r.currency })), { onConflict: "id" }));
  await pruneBy("zone_price", "id", zprices.map((r) => r.id), "zprice.prune");

  const km = state.kmFormula;
  check("km")(await db.from("km_formula").upsert({ tenant_id: tenantId, enabled: km.enabled, base_fare: Math.max(0, Math.round(km.baseFare)), per_km: Math.max(0, Math.round(km.perKm)), private_multiplier: km.privateMultiplier > 0 ? km.privateMultiplier : 1, shuttle_multiplier: km.shuttleMultiplier > 0 ? km.shuttleMultiplier : 0.7, currency: km.currency }, { onConflict: "tenant_id" }));

  /* 5. Popüler rotalar */
  const routes = state.popularRoutes.filter((r) => isUuid(r.id));
  if (routes.length) {
    check("route")(await db.from("popular_route").upsert(routes.map((r) => {
      const ok = (id: string | null) => (r.kind === "point" ? (id && pointIds.has(id) ? id : null) : (id && zoneIds.has(id) ? id : null));
      return {
        id: r.id, tenant_id: tenantId, kind: r.kind, title: r.title, slug: r.slug.trim() || `taslak-${r.id.slice(0, 8)}`, description: r.description,
        duration_minutes: Math.max(1, r.durationMinutes), duration_unit: r.durationUnit,
        start_point_id: r.kind === "point" ? ok(r.startId) : null, end_point_id: r.kind === "point" ? ok(r.endId) : null,
        start_zone_id: r.kind === "zone" ? ok(r.startId) : null, end_zone_id: r.kind === "zone" ? ok(r.endId) : null,
        price_override: r.priceOverride == null ? null : Math.max(0, Math.round(r.priceOverride)), currency: r.currency,
        use_custom_title_in_listing: r.useCustomTitleInListing,
      };
    }), { onConflict: "id" }));
  }
  await pruneBy("popular_route", "id", routes.map((r) => r.id), "route.prune");
  for (const r of routes) {
    await db.from("popular_route_vehicle").delete().eq("route_id", r.id);
    const ids = r.vehicleIds.filter((id) => vehicleIds.has(id));
    if (ids.length) check("route.vehicles")(await db.from("popular_route_vehicle").insert(ids.map((vehicle_id) => ({ tenant_id: tenantId, route_id: r.id, vehicle_id }))));
  }

  /* 6. Saat marjları */
  const rules = state.marginRules.filter((r) => isUuid(r.id));
  if (rules.length) {
    check("rule")(await db.from("time_margin_rule").upsert(rules.map((r) => {
      const ok = (id: string | null) => (r.scope === "point" ? (id && pointIds.has(id) ? id : null) : (id && zoneIds.has(id) ? id : null));
      const window = r.startTime && r.endTime ? { start_time: r.startTime, end_time: r.endTime } : { start_time: null, end_time: null };
      return {
        id: r.id, tenant_id: tenantId, scope: r.scope,
        start_point_id: r.scope === "point" ? ok(r.startLocationId) : null, end_point_id: r.scope === "point" ? ok(r.endLocationId) : null,
        start_zone_id: r.scope === "zone" ? ok(r.startLocationId) : null, end_zone_id: r.scope === "zone" ? ok(r.endLocationId) : null,
        ...window, percent_pct: r.percentPct,
      };
    }), { onConflict: "id" }));
  }
  await pruneBy("time_margin_rule", "id", rules.map((r) => r.id), "rule.prune");
  for (const r of rules) {
    await db.from("time_margin_rule_vehicle").delete().eq("rule_id", r.id);
    const ids = r.vehicleIds.filter((id) => vehicleIds.has(id));
    if (ids.length) check("rule.vehicles")(await db.from("time_margin_rule_vehicle").insert(ids.map((vehicle_id) => ({ tenant_id: tenantId, rule_id: r.id, vehicle_id }))));
  }

  /* 7. Ayarlar (+ iptal politikası; kiracı kimliğiyle tek satır). "ozel" metin ister → yok sayılır. */
  const s = state.settings;
  let policyId: string | null = null;
  if (s.cancellationTemplate !== "ozel") {
    const res = await db.from("cancellation_policy").upsert({ id: tenantId, tenant_id: tenantId, template: s.cancellationTemplate, custom_text: "" }, { onConflict: "id" });
    check("policy")(res);
    if (!res.error) policyId = tenantId;
  }
  check("settings")(await db.from("transfer_settings").upsert({ tenant_id: tenantId, default_currency: s.defaultCurrency, show_hourly_rental_tab: s.tabVisibility.noktaIleAracKiralama, booking_approval_mode: s.bookingApprovalMode, cancellation_policy_id: policyId }, { onConflict: "tenant_id" }));

  if (errors.length) {
    log.warn("transfer.sync.failed", { tenantId, errors });
    return { ok: false, error: errors[0] };
  }
  log.info("transfer.sync", { tenantId, vehicles: vehicles.length, points: points.length });
  return { ok: true };
}
