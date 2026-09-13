import "server-only";

import { emptyBoatDraft, type BoatDraft } from "@/lib/boat";
import { createClient } from "@/lib/supabase/server";

/** `boat` satırı → sihirbaz taslağı; `syncBoat`'un tersi. */
const SELECT = `
  id, status, title, slug, internal_short_name, legal_capacity, brand_model, build_year, length_meters,
  engine_info, cabin_count, bed_count, description, what_to_bring, includes, excludes, video_url,
  lifejacket_count, has_life_raft, has_fire_extinguisher, safety_notes, captain_option, captain_fee,
  captain_fee_unit, captain_payment_method, captain_language, pricing_model, currency, hourly_rate,
  multiday_unit, multiday_unit_price, multiday_min_units, multiday_max_units, per_person_price,
  per_person_min_group, min_rental_hours, security_deposit, fuel_policy_included,
  weather_cancellation_enabled, payment_mode, deposit_block_timing, deposit_refund_timing,
  require_captain_license, collect_passenger_list, collect_emergency_contact, contract_text,
  contract_version, contract_updated_at, created_at, updated_at,
  boat_hourly_tier(after_hours, discount_pct),
  boat_translation(locale, title, description, what_to_bring, includes, excludes, auto)
`;

type Row = {
  id: string; status: BoatDraft["status"]; title: string; slug: string; internal_short_name: string;
  legal_capacity: number; brand_model: string; build_year: number | null; length_meters: number | null;
  engine_info: string; cabin_count: number; bed_count: number; description: string; what_to_bring: string;
  includes: string[]; excludes: string[]; video_url: string | null; lifejacket_count: number;
  has_life_raft: boolean; has_fire_extinguisher: boolean; safety_notes: string;
  captain_option: BoatDraft["captainOption"]; captain_fee: number | null; captain_fee_unit: BoatDraft["captainFeeUnit"];
  captain_payment_method: BoatDraft["captainPaymentMethod"]; captain_language: string;
  pricing_model: BoatDraft["pricingModel"]; currency: string; hourly_rate: number | null;
  multiday_unit: "gece" | "gun" | null; multiday_unit_price: number | null; multiday_min_units: number | null; multiday_max_units: number | null;
  per_person_price: number | null; per_person_min_group: number | null; min_rental_hours: number;
  security_deposit: number; fuel_policy_included: boolean; weather_cancellation_enabled: boolean;
  payment_mode: BoatDraft["paymentMode"]; deposit_block_timing: BoatDraft["depositBlockTiming"];
  deposit_refund_timing: BoatDraft["depositRefundTiming"]; require_captain_license: boolean;
  collect_passenger_list: boolean; collect_emergency_contact: boolean; contract_text: string | null;
  contract_version: number; contract_updated_at: string | null; created_at: string; updated_at: string;
  boat_hourly_tier: { after_hours: number; discount_pct: number }[];
  boat_translation: { locale: string; title: string; description: string; what_to_bring: string; includes: string[]; excludes: string[]; auto: boolean }[];
};

export function rowToBoat(r: Row): BoatDraft {
  const base = emptyBoatDraft(r.id, r.created_at);
  const en = r.boat_translation.find((t) => t.locale === "en");
  return {
    ...base,
    status: r.status,
    title: r.title,
    slug: r.slug.startsWith("taslak-") ? "" : r.slug,
    internalShortName: r.internal_short_name,
    legalCapacity: r.legal_capacity,
    brandModel: r.brand_model,
    buildYear: r.build_year,
    lengthMeters: r.length_meters == null ? null : Number(r.length_meters),
    engineInfo: r.engine_info,
    cabinCount: r.cabin_count,
    bedCount: r.bed_count,
    description: r.description,
    whatToBring: r.what_to_bring,
    includes: r.includes,
    excludes: r.excludes,
    videoUrl: r.video_url,
    safetyEquipment: {
      lifejacketCount: r.lifejacket_count,
      hasLifeRaft: r.has_life_raft,
      hasFireExtinguisher: r.has_fire_extinguisher,
      notes: r.safety_notes,
    },
    captainOption: r.captain_option,
    captainFee: r.captain_fee,
    captainFeeUnit: r.captain_fee_unit,
    captainPaymentMethod: r.captain_payment_method,
    captainLanguage: r.captain_language,
    pricingModel: r.pricing_model,
    currency: r.currency,
    hourlyRate: r.hourly_rate,
    hourlyTiers: r.boat_hourly_tier
      .sort((a, b) => a.after_hours - b.after_hours)
      .map((t, i) => ({ id: `${r.id}-tier-${i}`, afterHours: t.after_hours, discountPct: Number(t.discount_pct) })),
    multiDay: {
      unit: r.multiday_unit ?? base.multiDay.unit,
      unitPrice: r.multiday_unit_price ?? 0,
      minUnits: r.multiday_min_units ?? base.multiDay.minUnits,
      maxUnits: r.multiday_max_units ?? base.multiDay.maxUnits,
    },
    perPerson: { pricePerPerson: r.per_person_price ?? 0, minGroupSize: r.per_person_min_group ?? 1 },
    minRentalHours: r.min_rental_hours,
    securityDeposit: r.security_deposit,
    fuelPolicyIncluded: r.fuel_policy_included,
    weatherCancellationEnabled: r.weather_cancellation_enabled,
    paymentMode: r.payment_mode,
    depositBlockTiming: r.deposit_block_timing,
    depositRefundTiming: r.deposit_refund_timing,
    requireCaptainLicense: r.require_captain_license,
    collectPassengerList: r.collect_passenger_list,
    collectEmergencyContact: r.collect_emergency_contact,
    contract: r.contract_text ? { text: r.contract_text, version: r.contract_version, updatedAt: r.contract_updated_at ?? r.updated_at } : null,
    translations: en
      ? { en: { title: en.title, description: en.description, whatToBring: en.what_to_bring, includes: en.includes, excludes: en.excludes, auto: en.auto } }
      : {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listTenantBoats(tenantId: string): Promise<BoatDraft[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("boat")
    .select(SELECT)
    .eq("tenant_id", tenantId)
    .neq("status", "arsivlendi")
    .order("updated_at", { ascending: false });
  return ((data ?? []) as unknown as Row[]).map(rowToBoat);
}
