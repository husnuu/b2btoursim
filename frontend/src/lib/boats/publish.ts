"use server";

import { getSessionState } from "@/lib/auth/session";
import type { BoatDraft } from "@/lib/boat";
import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";

/**
 * Tekne taslağını `boat` tablosuna yazar — `tours/publish.ts` ile aynı kalıp.
 *
 * Kimlik UUID, taslak ile satır aynı kimliği taşır. Yayında olmayan tekne
 * eksik olabilir (fiyat girilmemiş); kısıtlar yalnız `aktif` satırda
 * zorunlu (0021). Kategori/özellik/ekstra/marina kütüphaneleri hâlâ
 * sekmede; taşındıkça buraya eklenir.
 */
export type PublishResult = { ok: true; boatId: string } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const pos = (n: number | null | undefined): number | null => (n != null && n > 0 ? n : null);

export async function syncBoat(draft: BoatDraft): Promise<PublishResult> {
  if (!UUID.test(draft.id)) return { ok: false, error: "legacy_id" };
  const slug = draft.slug.trim() || `taslak-${draft.id.slice(0, 8)}`;
  if (draft.status === "aktif" && !draft.slug.trim()) return { ok: false, error: "slug" };

  const session = await getSessionState();
  if (session.kind !== "ready") return { ok: false, error: "auth" };
  const { tenantId } = session.claims;
  const supabase = await createClient();

  let agencyId = session.claims.agencyId;
  if (!agencyId) {
    const { data: master } = await supabase
      .from("agency").select("id").eq("tenant_id", tenantId).eq("type", "master").limit(1).maybeSingle();
    agencyId = master?.id ?? null;
  }
  if (!agencyId) return { ok: false, error: "agency" };

  const { data: row, error } = await supabase
    .from("boat")
    .upsert(
      {
        id: draft.id,
        tenant_id: tenantId,
        agency_id: agencyId,
        status: draft.status,
        title: draft.title,
        slug,
        internal_short_name: draft.internalShortName,
        legal_capacity: Math.max(1, draft.legalCapacity),
        brand_model: draft.brandModel,
        build_year: draft.buildYear,
        length_meters: pos(draft.lengthMeters),
        engine_info: draft.engineInfo,
        cabin_count: draft.cabinCount,
        bed_count: draft.bedCount,
        description: draft.description,
        what_to_bring: draft.whatToBring,
        includes: draft.includes,
        excludes: draft.excludes,
        video_url: draft.videoUrl,
        lifejacket_count: draft.safetyEquipment.lifejacketCount,
        has_life_raft: draft.safetyEquipment.hasLifeRaft,
        has_fire_extinguisher: draft.safetyEquipment.hasFireExtinguisher,
        safety_notes: draft.safetyEquipment.notes,
        captain_option: draft.captainOption,
        captain_fee: draft.captainFee,
        captain_fee_unit: draft.captainFeeUnit,
        captain_payment_method: draft.captainPaymentMethod,
        captain_language: draft.captainLanguage,
        pricing_model: draft.pricingModel,
        currency: draft.currency,
        hourly_rate: pos(draft.hourlyRate),
        multiday_unit: draft.pricingModel === "cokGunlu" ? draft.multiDay.unit : null,
        multiday_unit_price: draft.pricingModel === "cokGunlu" ? pos(draft.multiDay.unitPrice) : null,
        multiday_min_units: draft.pricingModel === "cokGunlu" ? pos(draft.multiDay.minUnits) : null,
        multiday_max_units: draft.pricingModel === "cokGunlu" ? pos(draft.multiDay.maxUnits) : null,
        per_person_price: draft.pricingModel === "kisiBasi" ? pos(draft.perPerson.pricePerPerson) : null,
        per_person_min_group: draft.pricingModel === "kisiBasi" ? pos(draft.perPerson.minGroupSize) : null,
        min_rental_hours: Math.max(1, draft.minRentalHours),
        security_deposit: draft.securityDeposit,
        fuel_policy_included: draft.fuelPolicyIncluded,
        weather_cancellation_enabled: draft.weatherCancellationEnabled,
        payment_mode: draft.paymentMode,
        deposit_block_timing: draft.depositBlockTiming,
        deposit_refund_timing: draft.depositRefundTiming,
        require_captain_license: draft.requireCaptainLicense,
        collect_passenger_list: draft.collectPassengerList,
        collect_emergency_contact: draft.collectEmergencyContact,
        contract_text: draft.contract?.text ?? null,
        contract_version: draft.contract?.version ?? 0,
        contract_updated_at: draft.contract?.updatedAt ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("id")
    .single();

  if (error || !row) {
    log.warn("boat.sync.failed", { tenantId, code: error?.code, message: error?.message });
    return { ok: false, error: error?.code ?? "unknown" };
  }
  const boatId = row.id;

  await supabase.from("boat_hourly_tier").delete().eq("boat_id", boatId);
  if (draft.hourlyTiers.length) {
    await supabase.from("boat_hourly_tier").insert(
      draft.hourlyTiers.map((t) => ({ tenant_id: tenantId, boat_id: boatId, after_hours: t.afterHours, discount_pct: t.discountPct })),
    );
  }

  await supabase.from("boat_translation").delete().eq("boat_id", boatId);
  if (draft.translations.en) {
    const en = draft.translations.en;
    await supabase.from("boat_translation").insert({
      tenant_id: tenantId, boat_id: boatId, locale: "en",
      title: en.title, description: en.description, what_to_bring: en.whatToBring,
      includes: en.includes, excludes: en.excludes, auto: en.auto,
    });
  }

  log.info("boat.sync", { tenantId, boatId, status: draft.status });
  return { ok: true, boatId };
}
