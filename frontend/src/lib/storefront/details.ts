import "server-only";

import { cache } from "react";
import { createStorefrontClient } from "./tenant";

/**
 * İlan detay sayfalarının verisi — modül başına bir okuyucu.
 *
 * Hepsi anonim istemciyle okur; RLS yalnız yayındaki (aktif) kaydı ve
 * onun alt kayıtlarını verir. Referans siteden alınan ilke: detay sayfası
 * kartın uzun hâlidir — aynı bilgi, daha çok bağlam, bir de talep kutusu.
 */

export type Gallery = { tone: string; alt: string }[];
export type Cutoff = { daysBefore: number; refundPct: number };
type CutoffRow = { days_before: number; refund_pct: number };
const toCutoffs = (rows: CutoffRow[] | null | undefined): Cutoff[] =>
  (rows ?? []).map((c) => ({ daysBefore: c.days_before, refundPct: Number(c.refund_pct) })).sort((a, b) => b.daysBefore - a.daysBefore);

function toneFor(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `oklch(0.62 0.09 ${h})`;
}

function gallery(id: string, media: { tone: string | null; alt: string; is_cover: boolean; position: number }[]): Gallery {
  const list = [...media].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position);
  if (list.length === 0) return [{ tone: toneFor(id), alt: "" }];
  return list.map((m, i) => ({ tone: m.tone ?? toneFor(id + i), alt: m.alt }));
}

/* --- Tekne ---------------------------------------------------------------- */

export type BoatDetail = {
  id: string; slug: string; title: string; description: string; whatToBring: string;
  brandModel: string; buildYear: number | null; lengthMeters: number | null; engineInfo: string;
  cabinCount: number; bedCount: number; legalCapacity: number;
  captainOption: "kaptanli" | "kaptansiz" | "herIkisi"; captainFee: number | null; captainFeeUnit: "saatlik" | "gunluk";
  pricingModel: "saatlik" | "cokGunlu" | "kisiBasi"; currency: string;
  hourlyRate: number | null; multidayUnit: "gece" | "gun" | null; multidayUnitPrice: number | null;
  multidayMin: number | null; perPersonPrice: number | null; perPersonMinGroup: number | null;
  minRentalHours: number; securityDeposit: number; fuelIncluded: boolean; weatherCancellation: boolean;
  includes: string[]; excludes: string[]; features: string[]; tiers: { afterHours: number; discountPct: number }[];
  safety: { lifejackets: number; lifeRaft: boolean; fireExtinguisher: boolean; notes: string };
  cancellation: { template: string; cutoffs: Cutoff[] } | null;
  marina: { name: string; address: string } | null;
  gallery: Gallery;
};

export const getBoatDetail = cache(async (tenantId: string, slug: string): Promise<BoatDetail | null> => {
  const db = createStorefrontClient();
  const { data: r } = await db
    .from("boat")
    .select(`id, slug, title, description, what_to_bring, brand_model, build_year, length_meters, engine_info,
      cabin_count, bed_count, legal_capacity, captain_option, captain_fee, captain_fee_unit, pricing_model, currency,
      hourly_rate, multiday_unit, multiday_unit_price, multiday_min_units, per_person_price, per_person_min_group,
      min_rental_hours, security_deposit, fuel_policy_included, weather_cancellation_enabled, includes, excludes,
      lifejacket_count, has_life_raft, has_fire_extinguisher, safety_notes,
      boat_hourly_tier(after_hours, discount_pct),
      boat_feature_link(boat_feature(name)),
      media_asset(tone, alt, is_cover, position),
      cancellation_policy(template, cancellation_cutoff(days_before, refund_pct)),
      marina:location_point(name, address)`)
    .eq("tenant_id", tenantId).eq("slug", slug).eq("status", "aktif").maybeSingle();
  if (!r) return null;
  const policy = Array.isArray(r.cancellation_policy) ? r.cancellation_policy[0] : r.cancellation_policy;
  const marina = Array.isArray(r.marina) ? r.marina[0] : r.marina;
  return {
    id: r.id, slug: r.slug, title: r.title, description: r.description, whatToBring: r.what_to_bring,
    brandModel: r.brand_model, buildYear: r.build_year, lengthMeters: r.length_meters == null ? null : Number(r.length_meters),
    engineInfo: r.engine_info, cabinCount: r.cabin_count, bedCount: r.bed_count, legalCapacity: r.legal_capacity,
    captainOption: r.captain_option, captainFee: r.captain_fee, captainFeeUnit: r.captain_fee_unit,
    pricingModel: r.pricing_model, currency: r.currency, hourlyRate: r.hourly_rate, multidayUnit: r.multiday_unit,
    multidayUnitPrice: r.multiday_unit_price, multidayMin: r.multiday_min_units, perPersonPrice: r.per_person_price,
    perPersonMinGroup: r.per_person_min_group, minRentalHours: r.min_rental_hours, securityDeposit: r.security_deposit,
    fuelIncluded: r.fuel_policy_included, weatherCancellation: r.weather_cancellation_enabled,
    includes: r.includes, excludes: r.excludes,
    features: r.boat_feature_link.map((l) => (Array.isArray(l.boat_feature) ? l.boat_feature[0]?.name : l.boat_feature?.name)).filter((x): x is string => !!x),
    tiers: r.boat_hourly_tier.map((t) => ({ afterHours: t.after_hours, discountPct: Number(t.discount_pct) })).sort((a, b) => a.afterHours - b.afterHours),
    safety: { lifejackets: r.lifejacket_count, lifeRaft: r.has_life_raft, fireExtinguisher: r.has_fire_extinguisher, notes: r.safety_notes },
    cancellation: policy ? { template: policy.template, cutoffs: toCutoffs(policy.cancellation_cutoff as CutoffRow[]) } : null,
    marina: marina ? { name: marina.name, address: marina.address } : null,
    gallery: gallery(r.id, r.media_asset),
  };
});

/* --- Villa ---------------------------------------------------------------- */

export type VillaDetail = {
  id: string; slug: string; title: string; description: string; province: string; district: string;
  capacity: number; nightlyRate: number; currency: string; minNights: number; checkIn: string; checkOut: string;
  petsAllowed: boolean; tursabLicense: string; features: string[]; regions: string[];
  poi: { label: string; distance: number; unit: string }[];
  cancellation: { template: string; cutoffs: Cutoff[] } | null;
  gallery: Gallery;
};

export const getVillaDetail = cache(async (tenantId: string, slug: string): Promise<VillaDetail | null> => {
  const db = createStorefrontClient();
  const { data: r } = await db
    .from("villa")
    .select(`id, slug, title, description, province, district, capacity, nightly_rate, price_currency, min_nights,
      check_in_time, check_out_time, pets_allowed, tourism_license_no,
      villa_feature_link(villa_feature(name)), villa_region_link(villa_region(name)),
      villa_poi_distance(label, distance, unit), media_asset(tone, alt, is_cover, position),
      cancellation_policy(template, cancellation_cutoff(days_before, refund_pct))`)
    .eq("tenant_id", tenantId).eq("slug", slug).eq("status", "aktif").maybeSingle();
  if (!r) return null;
  const policy = Array.isArray(r.cancellation_policy) ? r.cancellation_policy[0] : r.cancellation_policy;
  const one = <T,>(x: T | T[] | null): T | null => (Array.isArray(x) ? x[0] ?? null : x);
  return {
    id: r.id, slug: r.slug, title: r.title, description: r.description, province: r.province, district: r.district,
    capacity: r.capacity, nightlyRate: r.nightly_rate, currency: r.price_currency, minNights: r.min_nights,
    checkIn: r.check_in_time.slice(0, 5), checkOut: r.check_out_time.slice(0, 5), petsAllowed: r.pets_allowed,
    tursabLicense: r.tourism_license_no,
    features: r.villa_feature_link.map((l) => one(l.villa_feature)?.name).filter((x): x is string => !!x),
    regions: r.villa_region_link.map((l) => one(l.villa_region)?.name).filter((x): x is string => !!x),
    poi: r.villa_poi_distance.map((p) => ({ label: p.label, distance: Number(p.distance), unit: p.unit })),
    cancellation: policy ? { template: policy.template, cutoffs: toCutoffs(policy.cancellation_cutoff as CutoffRow[]) } : null,
    gallery: gallery(r.id, r.media_asset),
  };
});

/* --- Transfer aracı ------------------------------------------------------ */

export type VehicleDetail = {
  id: string; title: string; description: string; vehicleType: "private" | "shuttle"; seats: number; luggage: number;
  pricingModel: "rotaBazli" | "saatlikKiralama"; hourlyRate: number | null; currency: string; features: string[]; gallery: Gallery;
};

export const getVehicleDetail = cache(async (tenantId: string, id: string): Promise<VehicleDetail | null> => {
  const db = createStorefrontClient();
  const { data: r } = await db
    .from("vehicle")
    .select(`id, title, description, vehicle_type, seat_capacity, luggage_capacity, pricing_model, hourly_rate, hourly_currency,
      vehicle_feature_link(vehicle_feature(name)), media_asset(tone, alt, is_cover, position)`)
    .eq("tenant_id", tenantId).eq("id", id).eq("status", "aktif").maybeSingle();
  if (!r) return null;
  return {
    id: r.id, title: r.title, description: r.description, vehicleType: r.vehicle_type, seats: r.seat_capacity,
    luggage: r.luggage_capacity, pricingModel: r.pricing_model, hourlyRate: r.hourly_rate, currency: r.hourly_currency ?? "TRY",
    features: r.vehicle_feature_link.map((l) => (Array.isArray(l.vehicle_feature) ? l.vehicle_feature[0]?.name : l.vehicle_feature?.name)).filter((x): x is string => !!x),
    gallery: gallery(r.id, r.media_asset),
  };
});

/* --- Vize ------------------------------------------------------------------ */

export type VisaDetail = {
  id: string; title: string; country: string; description: string; price: number; currency: string;
  daysMin: number | null; daysMax: number | null; documents: string[];
};

export const getVisaDetail = cache(async (tenantId: string, id: string): Promise<VisaDetail | null> => {
  const db = createStorefrontClient();
  const { data: r } = await db
    .from("visa_product")
    .select("id, title, country, description, price, currency, processing_days_min, processing_days_max, required_documents")
    .eq("tenant_id", tenantId).eq("id", id).eq("status", "aktif").maybeSingle();
  if (!r) return null;
  return {
    id: r.id, title: r.title, country: r.country, description: r.description, price: r.price, currency: r.currency,
    daysMin: r.processing_days_min, daysMax: r.processing_days_max, documents: r.required_documents,
  };
});

/* --- Tur: kartın ötesindeki alanlar --------------------------------------- */

export type TourExtra = {
  itinerary: { name: string; durationMinutes: number; description: string }[];
  tiers: { key: "adult" | "child" | "infant"; minAge: number; maxAge: number; price: number }[];
  departures: { id: string; startsAt: string; remaining: number; price: number | null }[];
  cutoffs: Cutoff[]; template: string | null;
  difficulty: string | null; knowBeforeYouGo: string; whatToBring: string; startLocation: string; endLocation: string;
  categories: string[]; gallery: Gallery; meetingTimeMinutesBefore: number | null;
};

export const getTourExtra = cache(async (tenantId: string, slug: string): Promise<TourExtra | null> => {
  const db = createStorefrontClient();
  const { data: r } = await db
    .from("tour")
    .select(`id, difficulty, know_before_you_go, what_to_bring, start_location, end_location, meeting_time_minutes_before,
      itinerary_stop(position, name, duration_minutes, description),
      tour_age_tier(key, enabled, min_age, max_age, price),
      tour_departure(id, starts_at, capacity, booked_count, stop_sale, price_override),
      tour_category_link(tour_category(title)),
      cancellation_policy(template, cancellation_cutoff(days_before, refund_pct)),
      media_asset(tone, alt, is_cover, position)`)
    .eq("tenant_id", tenantId).eq("slug", slug).eq("status", "aktif").eq("show_on_website", true).maybeSingle();
  if (!r) return null;
  const policy = Array.isArray(r.cancellation_policy) ? r.cancellation_policy[0] : r.cancellation_policy;
  const now = Date.now();
  return {
    itinerary: [...r.itinerary_stop].sort((a, b) => a.position - b.position).map((s) => ({ name: s.name, durationMinutes: s.duration_minutes, description: s.description })),
    tiers: r.tour_age_tier.filter((t) => t.enabled && t.price > 0).map((t) => ({ key: t.key, minAge: t.min_age, maxAge: t.max_age, price: t.price })),
    departures: r.tour_departure
      .filter((d) => !d.stop_sale && new Date(d.starts_at).getTime() >= now)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      .map((d) => ({ id: d.id, startsAt: d.starts_at, remaining: Math.max(0, d.capacity - d.booked_count), price: d.price_override })),
    cutoffs: policy ? toCutoffs(policy.cancellation_cutoff as CutoffRow[]) : [],
    template: policy?.template ?? null,
    difficulty: r.difficulty, knowBeforeYouGo: r.know_before_you_go, whatToBring: r.what_to_bring,
    startLocation: r.start_location, endLocation: r.end_location,
    categories: r.tour_category_link.map((l) => (Array.isArray(l.tour_category) ? l.tour_category[0]?.title : l.tour_category?.title)).filter((x): x is string => !!x),
    gallery: gallery(r.id, r.media_asset), meetingTimeMinutesBefore: r.meeting_time_minutes_before,
  };
});
