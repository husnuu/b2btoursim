"use server";

import { getSessionState } from "@/lib/auth/session";
import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import type { TourDraft } from "@/lib/tour";

/**
 * Sihirbaz taslağını `tour` tablosuna yazar.
 *
 * Editör hâlâ sekme başına sessionStorage'da çalışır (tour-store); bu eylem
 * durum her değiştiğinde taslağın SUNUCUDAKİ kopyasını günceller. Vitrin
 * yalnız `aktif + show_on_website` satırları görür — taslak ve pasif
 * kayıtlar veritabanında durur ama anon'a görünmez (RLS).
 *
 * İlk sürüm çekirdeği taşır: tur satırı, yaş kademeleri, program durakları,
 * grup fiyatı, çeviriler. Kategori/etiket/ekstra/buluşma noktası sihirbazın
 * yerel kütüphane kimliklerine bağlı; o kütüphaneler tabloya taşınınca
 * buraya eklenir.
 */
export type PublishResult = { ok: true; tourId: string } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function syncTour(draft: TourDraft): Promise<PublishResult> {
  // Taslak kimliği tabloya birebir gider; eski "tur-xxx" kimlikleri
  // (önceki oturumlardan) taşınamaz.
  if (!UUID.test(draft.id)) return { ok: false, error: "legacy_id" };
  // Slug zorunlu ve kiracıda tekil; taslakta boşsa yer tutucu.
  const slug = draft.slug.trim() || `taslak-${draft.id.slice(0, 8)}`;
  if (draft.status === "aktif" && !draft.slug.trim()) return { ok: false, error: "slug" };

  const session = await getSessionState();
  if (session.kind !== "ready") return { ok: false, error: "auth" };
  const { tenantId } = session.claims;
  const supabase = await createClient();

  // Platform yöneticisi bir acenteye bağlı değil; tur kiracının ana
  // acentesine yazılır.
  let agencyId = session.claims.agencyId;
  if (!agencyId) {
    const { data: master } = await supabase
      .from("agency")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("type", "master")
      .limit(1)
      .maybeSingle();
    agencyId = master?.id ?? null;
  }
  if (!agencyId) return { ok: false, error: "agency" };

  const { data: row, error } = await supabase
    .from("tour")
    .upsert(
      {
        id: draft.id,
        tenant_id: tenantId,
        agency_id: agencyId,
        status: draft.status,
        featured: draft.featured,
        title: draft.title,
        slug,
        tour_kind: draft.tourKind,
        program_type: draft.programType,
        show_on_website: draft.showOnWebsite,
        ask_for_price: draft.askForPrice,
        forced_currency: draft.forcedCurrency,
        list_currency_override: draft.listCurrencyOverride,
        start_location: draft.startLocation,
        end_location: draft.endLocation,
        route_stops: draft.routeStops,
        description: draft.description,
        extra_notes: draft.extraNotes,
        includes: draft.includes,
        excludes: draft.excludes,
        know_before_you_go: draft.knowBeforeYouGo,
        what_to_bring: draft.whatToBring,
        difficulty: draft.difficulty,
        video_url: draft.videoUrl,
        meeting_time_minutes_before: draft.meetingTimeMinutesBefore,
        pickup_enabled: draft.pickup.enabled,
        pickup_regions: draft.pickup.regions,
        pickup_extra_fee: draft.pickup.extraFee,
        pricing_model: draft.pricingModel,
        pricing_currency: draft.pricingCurrency,
        alternate_display_currency: draft.alternateDisplayCurrency,
        tax_included_in_price: draft.taxIncludedInPrice,
        payment_mode: draft.paymentMode,
        social_post_text: draft.socialPostDraft?.text ?? null,
        social_post_generated_at: draft.socialPostDraft?.generatedAt ?? null,
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
    log.warn("tour.sync.failed", { tenantId, code: error?.code, message: error?.message });
    return { ok: false, error: error?.code ?? "unknown" };
  }
  const tourId = row.id;

  // Alt kayıtlar: sil-yaz. Taslak küçük, fark hesaplamaya değmez.
  await supabase.from("tour_age_tier").delete().eq("tour_id", tourId);
  await supabase.from("tour_age_tier").insert(
    draft.ageTiers.map((t) => ({
      tenant_id: tenantId,
      tour_id: tourId,
      key: t.key,
      enabled: t.enabled,
      min_age: t.minAge,
      max_age: t.maxAge,
      price: t.price,
    })),
  );

  await supabase.from("itinerary_stop").delete().eq("tour_id", tourId);
  if (draft.itinerary.length) {
    await supabase.from("itinerary_stop").insert(
      draft.itinerary.map((s, i) => ({
        tenant_id: tenantId,
        tour_id: tourId,
        position: i + 1,
        name: s.name,
        duration_minutes: s.durationMinutes,
        description: s.description,
      })),
    );
  }

  await supabase.from("tour_group_pricing").delete().eq("tour_id", tourId);
  if (draft.pricingModel === "grupBazli" && draft.groupPricing) {
    await supabase.from("tour_group_pricing").insert({
      tenant_id: tenantId,
      tour_id: tourId,
      min_size: draft.groupPricing.minSize,
      max_size: draft.groupPricing.maxSize,
      price: draft.groupPricing.price,
    });
  }

  await supabase.from("tour_translation").delete().eq("tour_id", tourId);
  if (draft.translations.en) {
    const en = draft.translations.en;
    await supabase.from("tour_translation").insert({
      tenant_id: tenantId,
      tour_id: tourId,
      locale: "en",
      title: en.title,
      description: en.description,
      includes: en.includes,
      excludes: en.excludes,
      know_before_you_go: en.knowBeforeYouGo,
      what_to_bring: en.whatToBring,
      auto: en.auto,
    });
  }

  log.info("tour.sync", { tenantId, tourId, status: draft.status });
  return { ok: true, tourId };
}
