import "server-only";

import { createClient } from "@/lib/supabase/server";
import { emptyTourDraft, type TourDraft } from "@/lib/tour";

/**
 * `tour` satırını sihirbazın taslak tipine çevirir — `syncTour`'un tersi.
 *
 * Taslakta olup tabloda henüz olmayan alanlar (kategori/etiket/ekstra
 * kütüphane kimlikleri, buluşma noktası, görseller) boş varsayılanla
 * gelir; sihirbaz onları yerelde düzenler, bir sonraki senkronda DB'ye
 * taşındıkça buraya eklenir.
 */
const SELECT = `
  id, status, featured, title, slug, tour_kind, program_type, show_on_website,
  ask_for_price, forced_currency, list_currency_override, start_location, end_location,
  route_stops, description, extra_notes, includes, excludes, know_before_you_go,
  what_to_bring, difficulty, video_url, meeting_time_minutes_before, pickup_enabled,
  pickup_regions, pickup_extra_fee, pricing_model, pricing_currency,
  alternate_display_currency, tax_included_in_price, payment_mode, social_post_text,
  social_post_generated_at, contract_text, contract_version, contract_updated_at,
  created_at, updated_at,
  tour_age_tier(key, enabled, min_age, max_age, price),
  itinerary_stop(position, name, duration_minutes, description),
  tour_group_pricing(min_size, max_size, price),
  tour_translation(locale, title, description, includes, excludes, know_before_you_go, what_to_bring, auto)
`;

type Row = {
  id: string; status: TourDraft["status"]; featured: boolean; title: string; slug: string;
  tour_kind: TourDraft["tourKind"]; program_type: TourDraft["programType"]; show_on_website: boolean;
  ask_for_price: boolean; forced_currency: boolean; list_currency_override: string | null;
  start_location: string; end_location: string; route_stops: string[]; description: string;
  extra_notes: string; includes: string[]; excludes: string[]; know_before_you_go: string;
  what_to_bring: string; difficulty: TourDraft["difficulty"]; video_url: string | null;
  meeting_time_minutes_before: number | null; pickup_enabled: boolean; pickup_regions: string;
  pickup_extra_fee: number; pricing_model: TourDraft["pricingModel"]; pricing_currency: string;
  alternate_display_currency: string | null; tax_included_in_price: boolean;
  payment_mode: TourDraft["paymentMode"]; social_post_text: string | null;
  social_post_generated_at: string | null; contract_text: string | null; contract_version: number;
  contract_updated_at: string | null; created_at: string; updated_at: string;
  tour_age_tier: { key: "adult" | "child" | "infant"; enabled: boolean; min_age: number; max_age: number; price: number }[];
  itinerary_stop: { position: number; name: string; duration_minutes: number; description: string }[];
  tour_group_pricing: { min_size: number; max_size: number; price: number } | { min_size: number; max_size: number; price: number }[] | null;
  tour_translation: { locale: string; title: string; description: string; includes: string[]; excludes: string[]; know_before_you_go: string; what_to_bring: string; auto: boolean }[];
};

export function rowToDraft(r: Row): TourDraft {
  const base = emptyTourDraft(r.id, r.created_at);
  const group = Array.isArray(r.tour_group_pricing) ? r.tour_group_pricing[0] : r.tour_group_pricing;
  const en = r.tour_translation.find((t) => t.locale === "en");
  const tiers = base.ageTiers.map((t) => {
    const db = r.tour_age_tier.find((x) => x.key === t.key);
    return db ? { key: t.key, enabled: db.enabled, minAge: db.min_age, maxAge: db.max_age, price: db.price } : t;
  });
  return {
    ...base,
    status: r.status,
    featured: r.featured,
    title: r.title,
    slug: r.slug.startsWith("taslak-") ? "" : r.slug,
    tourKind: r.tour_kind,
    programType: r.program_type,
    showOnWebsite: r.show_on_website,
    askForPrice: r.ask_for_price,
    forcedCurrency: r.forced_currency,
    listCurrencyOverride: r.list_currency_override,
    startLocation: r.start_location,
    endLocation: r.end_location,
    routeStops: r.route_stops,
    itinerary: [...r.itinerary_stop]
      .sort((a, b) => a.position - b.position)
      .map((s) => ({ id: `${r.id}-stop-${s.position}`, name: s.name, durationMinutes: s.duration_minutes, description: s.description })),
    description: r.description,
    extraNotes: r.extra_notes,
    includes: r.includes,
    excludes: r.excludes,
    knowBeforeYouGo: r.know_before_you_go,
    difficulty: r.difficulty,
    whatToBring: r.what_to_bring,
    videoUrl: r.video_url,
    meetingTimeMinutesBefore: r.meeting_time_minutes_before,
    pickup: { enabled: r.pickup_enabled, regions: r.pickup_regions, extraFee: r.pickup_extra_fee },
    pricingModel: r.pricing_model,
    pricingCurrency: r.pricing_currency,
    alternateDisplayCurrency: r.alternate_display_currency,
    ageTiers: tiers,
    groupPricing: group ? { minSize: group.min_size, maxSize: group.max_size, price: group.price } : null,
    taxIncludedInPrice: r.tax_included_in_price,
    paymentMode: r.payment_mode,
    socialPostDraft: r.social_post_text ? { text: r.social_post_text, generatedAt: r.social_post_generated_at ?? r.updated_at } : null,
    contract: r.contract_text ? { text: r.contract_text, version: r.contract_version, updatedAt: r.contract_updated_at ?? r.updated_at } : null,
    translations: en
      ? { en: { title: en.title, description: en.description, includes: en.includes, excludes: en.excludes, knowBeforeYouGo: en.know_before_you_go, whatToBring: en.what_to_bring, auto: en.auto } }
      : {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** Kiracının turları — oturumdaki kullanıcının haklarıyla (RLS). */
export async function listTenantTours(tenantId: string): Promise<TourDraft[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tour")
    .select(SELECT)
    .eq("tenant_id", tenantId)
    .neq("status", "arsivlendi")
    .order("updated_at", { ascending: false });
  return ((data ?? []) as unknown as Row[]).map(rowToDraft);
}
