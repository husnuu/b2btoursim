import "server-only";

import { emptyKmFormula, emptyVehicle, type Vehicle } from "@/lib/transfer";
import { createClient } from "@/lib/supabase/server";
import type { TransferState } from "./state";

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null);

/** Kiracının transfer kataloğunu tablolardan okur; yoksa boş durum. */
export async function loadTransferState(tenantId: string): Promise<TransferState> {
  const db = await createClient();
  const t = (q: PromiseLike<{ data: unknown }>) => q;
  const [vehicles, points, prices, zones, zonePrices, km, routes, rules, rental, features, extras, settings] = await Promise.all([
    t(db.from("vehicle").select("id, status, pricing_model, title, description, vehicle_type, seat_capacity, luggage_capacity, hourly_rate, video_url, created_at, updated_at, vehicle_feature_link(feature_id), vehicle_extra_link(extra_id, required, sell_phase), vehicle_translation(locale, title, description, auto)").eq("tenant_id", tenantId).neq("status", "arsivlendi").order("updated_at", { ascending: false })),
    t(db.from("location_point").select("id, name, address, description").eq("tenant_id", tenantId).eq("kind", "transfer").order("name")),
    t(db.from("transfer_point_price").select("id, from_point_id, to_point_id, vehicle_type, price, currency").eq("tenant_id", tenantId)),
    t(db.from("map_zone").select("id, name, city_country, keywords").eq("tenant_id", tenantId).order("name")),
    t(db.from("zone_price").select("id, from_zone_id, to_zone_id, vehicle_type, price, currency").eq("tenant_id", tenantId)),
    t(db.from("km_formula").select("enabled, base_fare, per_km, private_multiplier, shuttle_multiplier, currency").eq("tenant_id", tenantId).maybeSingle()),
    t(db.from("popular_route").select("id, kind, title, slug, description, duration_minutes, duration_unit, start_point_id, end_point_id, start_zone_id, end_zone_id, price_override, currency, use_custom_title_in_listing, popular_route_vehicle(vehicle_id)").eq("tenant_id", tenantId)),
    t(db.from("time_margin_rule").select("id, scope, start_point_id, end_point_id, start_zone_id, end_zone_id, start_time, end_time, percent_pct, time_margin_rule_vehicle(vehicle_id)").eq("tenant_id", tenantId)),
    t(db.from("rental_point").select("point_id, role, location_point(name)").eq("tenant_id", tenantId)),
    t(db.from("vehicle_feature").select("id, name").eq("tenant_id", tenantId).order("name")),
    t(db.from("vehicle_extra").select("id, name, price, currency, type").eq("tenant_id", tenantId).order("name")),
    t(db.from("transfer_settings").select("default_currency, show_hourly_rental_tab, booking_approval_mode, cancellation_policy(template)").eq("tenant_id", tenantId).maybeSingle()),
  ]);

  type VRow = { id: string; status: Vehicle["status"]; pricing_model: Vehicle["pricingModel"]; title: string; description: string; vehicle_type: Vehicle["vehicleType"]; seat_capacity: number; luggage_capacity: number; hourly_rate: number | null; video_url: string | null; created_at: string; updated_at: string; vehicle_feature_link: { feature_id: string }[]; vehicle_extra_link: { extra_id: string; required: boolean; sell_phase: "duringBooking" | "afterBooking" }[]; vehicle_translation: { locale: string; title: string; description: string; auto: boolean }[] };
  const one = <T,>(x: T | T[] | null): T | null => (Array.isArray(x) ? x[0] ?? null : x);

  const kmRow = km.data as { enabled: boolean; base_fare: number; per_km: number; private_multiplier: number | string; shuttle_multiplier: number | string; currency: string } | null;
  const sRow = settings.data as { default_currency: string; show_hourly_rental_tab: boolean; booking_approval_mode: "otomatik" | "manuel"; cancellation_policy: { template: "esnek" | "orta" | "kati" | "ozel" } | { template: "esnek" | "orta" | "kati" | "ozel" }[] | null } | null;

  return {
    vehicles: ((vehicles.data ?? []) as VRow[]).map((r) => {
      const en = r.vehicle_translation.find((x) => x.locale === "en");
      return {
        ...emptyVehicle(r.id, r.created_at),
        status: r.status === "aktif" ? "aktif" : "pasif",
        pricingModel: r.pricing_model,
        title: r.title,
        description: r.description,
        translations: en ? { en: { title: en.title, description: en.description, auto: en.auto } } : {},
        vehicleType: r.vehicle_type,
        seatCapacity: r.seat_capacity,
        luggageCapacity: r.luggage_capacity,
        hourlyRate: r.hourly_rate == null ? null : Number(r.hourly_rate),
        featureIds: r.vehicle_feature_link.map((l) => l.feature_id),
        extraLinks: r.vehicle_extra_link.map((l) => ({ extraId: l.extra_id, required: l.required, sellPhase: l.sell_phase })),
        videoUrl: r.video_url,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    }),
    points: (points.data ?? []) as TransferState["points"],
    priceMatrix: ((prices.data ?? []) as { id: string; from_point_id: string; to_point_id: string; vehicle_type: Vehicle["vehicleType"]; price: number; currency: string }[]).map((r) => ({ id: r.id, fromPointId: r.from_point_id, toPointId: r.to_point_id, vehicleType: r.vehicle_type, price: Number(r.price), currency: r.currency })),
    mapZones: ((zones.data ?? []) as { id: string; name: string; city_country: string; keywords: string }[]).map((z) => ({ id: z.id, name: z.name, cityCountry: z.city_country, keywords: z.keywords })),
    zonePriceMatrix: ((zonePrices.data ?? []) as { id: string; from_zone_id: string; to_zone_id: string; vehicle_type: Vehicle["vehicleType"]; price: number; currency: string }[]).map((r) => ({ id: r.id, fromZoneId: r.from_zone_id, toZoneId: r.to_zone_id, vehicleType: r.vehicle_type, price: Number(r.price), currency: r.currency })),
    kmFormula: kmRow
      ? { enabled: kmRow.enabled, baseFare: Number(kmRow.base_fare), perKm: Number(kmRow.per_km), privateMultiplier: Number(kmRow.private_multiplier), shuttleMultiplier: Number(kmRow.shuttle_multiplier), currency: kmRow.currency }
      : emptyKmFormula(),
    popularRoutes: ((routes.data ?? []) as { id: string; kind: "point" | "zone"; title: string; slug: string; description: string; duration_minutes: number; duration_unit: "dakika" | "saat"; start_point_id: string | null; end_point_id: string | null; start_zone_id: string | null; end_zone_id: string | null; price_override: number | null; currency: string; use_custom_title_in_listing: boolean; popular_route_vehicle: { vehicle_id: string }[] }[]).map((r) => ({
      id: r.id, kind: r.kind, title: r.title, slug: r.slug.startsWith("taslak-") ? "" : r.slug, description: r.description,
      durationMinutes: r.duration_minutes, durationUnit: r.duration_unit,
      startId: r.kind === "point" ? r.start_point_id : r.start_zone_id,
      endId: r.kind === "point" ? r.end_point_id : r.end_zone_id,
      vehicleIds: r.popular_route_vehicle.map((v) => v.vehicle_id),
      priceOverride: r.price_override == null ? null : Number(r.price_override),
      currency: r.currency, useCustomTitleInListing: r.use_custom_title_in_listing,
    })),
    marginRules: ((rules.data ?? []) as { id: string; scope: "point" | "zone"; start_point_id: string | null; end_point_id: string | null; start_zone_id: string | null; end_zone_id: string | null; start_time: string | null; end_time: string | null; percent_pct: number | string; time_margin_rule_vehicle: { vehicle_id: string }[] }[]).map((r) => ({
      id: r.id, scope: r.scope,
      startLocationId: r.scope === "point" ? r.start_point_id : r.start_zone_id,
      endLocationId: r.scope === "point" ? r.end_point_id : r.end_zone_id,
      startTime: hhmm(r.start_time), endTime: hhmm(r.end_time), percentPct: Number(r.percent_pct),
      vehicleIds: r.time_margin_rule_vehicle.map((v) => v.vehicle_id),
    })),
    rentalPoints: ((rental.data ?? []) as { point_id: string; role: "pickup" | "dropoff" | "both"; location_point: { name: string } | { name: string }[] | null }[]).map((r) => ({ id: r.point_id, name: one(r.location_point)?.name ?? "", role: r.role })),
    features: (features.data ?? []) as TransferState["features"],
    extras: ((extras.data ?? []) as { id: string; name: string; price: number; currency: string; type: "perPerson" | "perBooking" }[]).map((e) => ({ ...e, price: Number(e.price) })),
    settings: {
      defaultCurrency: sRow?.default_currency ?? "TRY",
      tabVisibility: { noktaIleAracKiralama: sRow?.show_hourly_rental_tab ?? false },
      bookingApprovalMode: sRow?.booking_approval_mode ?? "otomatik",
      cancellationTemplate: one(sRow?.cancellation_policy ?? null)?.template ?? "orta",
    },
  };
}
