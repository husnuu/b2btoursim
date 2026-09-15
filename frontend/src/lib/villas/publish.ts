"use server";

import { getSessionState } from "@/lib/auth/session";
import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import type { VillaDraft } from "@/lib/villa";

/**
 * Villa taslağını `villa` ve alt tablolarına yazar — `boats/publish.ts`
 * ile aynı kalıp. İptal politikası villa ile aynı kimlikli bir
 * `cancellation_policy` satırıdır (villa başına bir politika).
 */
export type PublishResult = { ok: true; villaId: string } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string | null | undefined): s is string => !!s && UUID.test(s);

async function resolveAgency() {
  const session = await getSessionState();
  if (session.kind !== "ready") return null;
  const { tenantId } = session.claims;
  const supabase = await createClient();
  let agencyId = session.claims.agencyId;
  if (!agencyId) {
    const { data: master } = await supabase
      .from("agency").select("id").eq("tenant_id", tenantId).eq("type", "master").limit(1).maybeSingle();
    agencyId = master?.id ?? null;
  }
  return agencyId ? { tenantId, agencyId, supabase } : null;
}

export async function syncVilla(draft: VillaDraft): Promise<PublishResult> {
  if (!UUID.test(draft.id)) return { ok: false, error: "legacy_id" };
  const slug = draft.slug.trim() || `taslak-${draft.id.slice(0, 8)}`;
  if (draft.status === "aktif" && !draft.slug.trim()) return { ok: false, error: "slug" };

  const ctx = await resolveAgency();
  if (!ctx) return { ok: false, error: "auth" };
  const { tenantId, agencyId, supabase } = ctx;

  // Kütüphane bağları: yalnız tabloda gerçekten var olan kimlikler.
  const [cat, regions, features] = await Promise.all([
    isUuid(draft.categoryId)
      ? supabase.from("villa_category").select("id").eq("tenant_id", tenantId).eq("id", draft.categoryId).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("villa_region").select("id").eq("tenant_id", tenantId).in("id", draft.regionIds.filter(isUuid)),
    supabase.from("villa_feature").select("id").eq("tenant_id", tenantId).in("id", draft.featureIds.filter(isUuid)),
  ]);

  // İptal politikası (villa ile aynı kimlik). "ozel" boş metinle geçersiz → orta.
  const custom = draft.customPolicyText.trim();
  const template = draft.cancellationTemplate === "ozel" && !custom ? "orta" : draft.cancellationTemplate;
  const { error: policyErr } = await supabase
    .from("cancellation_policy")
    .upsert({ id: draft.id, tenant_id: tenantId, template, custom_text: template === "ozel" ? custom : "" }, { onConflict: "id" });
  if (policyErr) log.warn("villa.policy.failed", { tenantId, code: policyErr.code });

  const { data: row, error } = await supabase
    .from("villa")
    .upsert(
      {
        id: draft.id,
        tenant_id: tenantId,
        agency_id: agencyId,
        status: draft.status,
        title: draft.title.trim() || "Yeni villa",
        slug,
        description: draft.description,
        category_id: cat.data?.id ?? null,
        tourism_license_no: draft.tourismLicenseNo,
        price_currency: draft.priceCurrency,
        nightly_rate: Math.max(0, Math.round(draft.nightlyRate)),
        ask_for_price: draft.askForPrice,
        forced_currency: draft.forcedCurrency,
        list_currency_override: draft.listCurrencyOverride,
        list_price: draft.listPrice == null ? null : Math.max(0, Math.round(draft.listPrice)),
        province: draft.province,
        district: draft.district,
        address_detail: draft.addressDetail,
        map_lat: draft.mapLat,
        map_lng: draft.mapLng,
        capacity: Math.max(1, draft.capacity),
        check_in_time: draft.checkInTime || "16:00",
        check_out_time: draft.checkOutTime || "10:00",
        pets_allowed: draft.petsAllowed,
        min_nights: Math.max(1, draft.minNights),
        booking_cutoff_days: Math.max(0, draft.bookingCutoffDays),
        cancellation_policy_id: policyErr ? null : draft.id,
        collect_estimated_arrival: draft.collectEstimatedArrival,
        collect_guest_breakdown: draft.collectGuestBreakdown,
        collect_special_requests: draft.collectSpecialRequests,
        video_url: draft.videoUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("id")
    .single();

  if (error || !row) {
    log.warn("villa.sync.failed", { tenantId, code: error?.code, message: error?.message });
    return { ok: false, error: error?.code ?? "unknown" };
  }
  const villaId = row.id;

  await Promise.all([
    supabase.from("villa_region_link").delete().eq("villa_id", villaId),
    supabase.from("villa_feature_link").delete().eq("villa_id", villaId),
    supabase.from("villa_poi_distance").delete().eq("villa_id", villaId),
    supabase.from("villa_booking_method_option").delete().eq("villa_id", villaId),
    supabase.from("villa_translation").delete().eq("villa_id", villaId),
  ]);
  const regionIds = (regions.data ?? []).map((r) => r.id);
  const featureIds = (features.data ?? []).map((f) => f.id);
  const pois = draft.poiDistances.filter((p) => p.label.trim() && p.distance > 0);
  const methods = [...new Set(draft.bookingMethods)];
  await Promise.all([
    regionIds.length
      ? supabase.from("villa_region_link").insert(regionIds.map((region_id) => ({ tenant_id: tenantId, villa_id: villaId, region_id })))
      : Promise.resolve(),
    featureIds.length
      ? supabase.from("villa_feature_link").insert(featureIds.map((feature_id) => ({ tenant_id: tenantId, villa_id: villaId, feature_id })))
      : Promise.resolve(),
    pois.length
      ? supabase.from("villa_poi_distance").insert(pois.map((p) => ({ id: isUuid(p.id) ? p.id : undefined, tenant_id: tenantId, villa_id: villaId, label: p.label.trim(), distance: p.distance, unit: p.unit })))
      : Promise.resolve(),
    methods.length
      ? supabase.from("villa_booking_method_option").insert(methods.map((method) => ({ tenant_id: tenantId, villa_id: villaId, method })))
      : Promise.resolve(),
    draft.translations.en
      ? supabase.from("villa_translation").insert({ tenant_id: tenantId, villa_id: villaId, locale: "en", title: draft.translations.en.title, description: draft.translations.en.description, auto: draft.translations.en.auto })
      : Promise.resolve(),
  ]);

  log.info("villa.sync", { tenantId, villaId, status: draft.status });
  return { ok: true, villaId };
}

/* --- Kütüphaneler: kimlik istemcide üretilir, satır burada açılır. ------- */

type LibResult = { ok: true } | { ok: false; error: string };

async function libCtx(id: string) {
  if (!UUID.test(id)) return { error: "legacy_id" as const };
  const ctx = await resolveAgency();
  if (!ctx) return { error: "auth" as const };
  return ctx;
}

function done(error: { code: string } | null, table: string): LibResult {
  if (error) {
    log.warn("villa.lib.failed", { table, code: error.code });
    return { ok: false, error: error.code };
  }
  return { ok: true };
}

export async function addVillaCategory(id: string, title: string): Promise<LibResult> {
  const ctx = await libCtx(id);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { error } = await ctx.supabase.from("villa_category").upsert({ id, tenant_id: ctx.tenantId, title: title.trim() }, { onConflict: "id" });
  return done(error, "villa_category");
}
export async function addVillaRegion(id: string, name: string): Promise<LibResult> {
  const ctx = await libCtx(id);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { error } = await ctx.supabase.from("villa_region").upsert({ id, tenant_id: ctx.tenantId, name: name.trim() }, { onConflict: "id" });
  return done(error, "villa_region");
}
export async function addVillaFeature(id: string, name: string): Promise<LibResult> {
  const ctx = await libCtx(id);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { error } = await ctx.supabase.from("villa_feature").upsert({ id, tenant_id: ctx.tenantId, name: name.trim() }, { onConflict: "id" });
  return done(error, "villa_feature");
}
