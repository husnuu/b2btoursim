import "server-only";

import { emptyVillaDraft, type VillaCategory, type VillaDraft, type VillaFeature, type VillaRegion } from "@/lib/villa";
import { createClient } from "@/lib/supabase/server";

/** `villa` satırı + alt tablolar → sihirbaz taslağı; `syncVilla`'nın tersi. */
const SELECT = `
  id, status, title, slug, description, category_id, tourism_license_no, price_currency, nightly_rate,
  ask_for_price, forced_currency, list_currency_override, list_price, province, district, address_detail,
  map_lat, map_lng, capacity, check_in_time, check_out_time, pets_allowed, min_nights, booking_cutoff_days,
  collect_estimated_arrival, collect_guest_breakdown, collect_special_requests, video_url, created_at, updated_at,
  villa_region_link(region_id), villa_feature_link(feature_id),
  villa_poi_distance(id, label, distance, unit), villa_booking_method_option(method),
  villa_translation(locale, title, description, auto),
  cancellation_policy(template, custom_text)
`;

type Row = {
  id: string; status: VillaDraft["status"]; title: string; slug: string; description: string; category_id: string | null;
  tourism_license_no: string; price_currency: string; nightly_rate: number; ask_for_price: boolean; forced_currency: boolean;
  list_currency_override: string | null; list_price: number | null; province: string; district: string; address_detail: string;
  map_lat: number | string | null; map_lng: number | string | null; capacity: number; check_in_time: string; check_out_time: string;
  pets_allowed: boolean; min_nights: number; booking_cutoff_days: number; collect_estimated_arrival: boolean;
  collect_guest_breakdown: boolean; collect_special_requests: boolean; video_url: string | null; created_at: string; updated_at: string;
  villa_region_link: { region_id: string }[]; villa_feature_link: { feature_id: string }[];
  villa_poi_distance: { id: string; label: string; distance: number | string; unit: "m" | "km" }[];
  villa_booking_method_option: { method: VillaDraft["bookingMethods"][number] }[];
  villa_translation: { locale: string; title: string; description: string; auto: boolean }[];
  cancellation_policy: { template: VillaDraft["cancellationTemplate"]; custom_text: string } | { template: VillaDraft["cancellationTemplate"]; custom_text: string }[] | null;
};

const hhmm = (t: string) => t.slice(0, 5);

export function rowToVilla(r: Row): VillaDraft {
  const base = emptyVillaDraft(r.id, r.created_at);
  const en = r.villa_translation.find((t) => t.locale === "en");
  const policy = Array.isArray(r.cancellation_policy) ? r.cancellation_policy[0] : r.cancellation_policy;
  return {
    ...base,
    status: r.status,
    title: r.title,
    slug: r.slug.startsWith("taslak-") ? "" : r.slug,
    priceCurrency: r.price_currency,
    nightlyRate: Number(r.nightly_rate),
    description: r.description,
    translations: en ? { en: { title: en.title, description: en.description, auto: en.auto } } : {},
    categoryId: r.category_id,
    askForPrice: r.ask_for_price,
    forcedCurrency: r.forced_currency,
    tourismLicenseNo: r.tourism_license_no,
    listCurrencyOverride: r.list_currency_override,
    listPrice: r.list_price == null ? null : Number(r.list_price),
    province: r.province,
    district: r.district,
    addressDetail: r.address_detail,
    regionIds: r.villa_region_link.map((l) => l.region_id),
    mapLat: r.map_lat == null ? null : Number(r.map_lat),
    mapLng: r.map_lng == null ? null : Number(r.map_lng),
    videoUrl: r.video_url,
    poiDistances: r.villa_poi_distance.length
      ? r.villa_poi_distance.map((p) => ({ id: p.id, label: p.label, distance: Number(p.distance), unit: p.unit }))
      : base.poiDistances,
    capacity: r.capacity,
    featureIds: r.villa_feature_link.map((l) => l.feature_id),
    checkInTime: hhmm(r.check_in_time),
    checkOutTime: hhmm(r.check_out_time),
    petsAllowed: r.pets_allowed,
    cancellationTemplate: policy?.template ?? base.cancellationTemplate,
    customPolicyText: policy?.custom_text ?? "",
    bookingCutoffDays: r.booking_cutoff_days,
    bookingMethods: r.villa_booking_method_option.map((m) => m.method),
    minNights: r.min_nights,
    collectEstimatedArrival: r.collect_estimated_arrival,
    collectGuestBreakdown: r.collect_guest_breakdown,
    collectSpecialRequests: r.collect_special_requests,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listTenantVillas(tenantId: string): Promise<VillaDraft[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("villa")
    .select(SELECT)
    .eq("tenant_id", tenantId)
    .neq("status", "arsivlendi")
    .order("updated_at", { ascending: false });
  return ((data ?? []) as unknown as Row[]).map(rowToVilla);
}

export type VillaLibraries = { categories: VillaCategory[]; regions: VillaRegion[]; features: VillaFeature[] };

/** Kategori / bölge / özellik kütüphaneleri — kiracı başına. */
export async function loadVillaLibraries(tenantId: string): Promise<VillaLibraries> {
  const supabase = await createClient();
  const [c, r, f] = await Promise.all([
    supabase.from("villa_category").select("id, title").eq("tenant_id", tenantId).order("title"),
    supabase.from("villa_region").select("id, name").eq("tenant_id", tenantId).order("name"),
    supabase.from("villa_feature").select("id, name").eq("tenant_id", tenantId).order("name"),
  ]);
  return { categories: c.data ?? [], regions: r.data ?? [], features: f.data ?? [] };
}
