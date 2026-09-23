import "server-only";

import type { CancellationPolicy, Product, SearchResult, Supplier } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { createStorefrontClient } from "./tenant";

/**
 * Yayındaki turları vitrinin beklediği şekle çevirir.
 *
 * B2C bileşenleri `SearchResult` / `Product` sözleşmesini konuşur (tedarikçi
 * kataloğu için yazıldı). Kendi turunda "net + marj" yok: kişi başı fiyat
 * zaten satış fiyatıdır; `net = fiyat, marj = 0` olarak geçer ve
 * `PriceDisplay` retail modda aynı sayıyı basar.
 */

const OWN_SUPPLIER: Supplier = {
  id: "own",
  name: "Kendi envanteri",
  code: "KE",
  adapterType: "own_contracted",
  status: "active",
  credentialsRef: "",
  uptimePct: 100,
  avgLatencyMs: 0,
  errorRatePct: 0,
};

/**
 * İptal şablonu → müşteriye gösterilen özet. Kademelerin tamamı ürün
 * sayfasında ayrıca listelenir; kartta tek satır yeter.
 */
function policyOf(template: string | null | undefined, cutoffs: { days_before: number; refund_pct: number }[]): CancellationPolicy {
  if (template === "kati") return { type: "nonRefundable" };
  const full = cutoffs.filter((c) => Number(c.refund_pct) >= 100).map((c) => c.days_before);
  const days = full.length ? Math.min(...full) : template === "esnek" ? 1 : 2;
  return { type: "free", hoursBefore: days * 24 };
}

/** Gerçek görsel yüklenmemişse kimlikten türetilen sakin bir ton. */
function toneFor(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `oklch(0.62 0.09 ${h})`;
}

const SELECT = `
  id, slug, title, description, status, show_on_website, pricing_currency,
  includes, excludes, know_before_you_go, what_to_bring, difficulty,
  tour_age_tier(key, enabled, price),
  itinerary_stop(position, name, duration_minutes, description),
  tour_translation(locale),
  tour_departure(id, starts_at, capacity, booked_count, stop_sale, price_override),
  media_asset(tone, is_cover, position, storage_path, external_url),
  cancellation_policy(template, cancellation_cutoff(days_before, refund_pct)),
  meeting_point:location_point(name, address)
`;

type Row = {
  id: string; slug: string; title: string; description: string;
  pricing_currency: string;
  includes: string[]; excludes: string[]; know_before_you_go: string; what_to_bring: string;
  tour_age_tier: { key: string; enabled: boolean; price: number }[];
  itinerary_stop: { position: number; name: string; duration_minutes: number; description: string }[];
  tour_translation: { locale: string }[];
  tour_departure: { id: string; starts_at: string; capacity: number; booked_count: number; stop_sale: boolean; price_override: number | null }[];
  media_asset: { tone: string | null; is_cover: boolean; position: number }[];
  cancellation_policy: { template: string; cancellation_cutoff: { days_before: number; refund_pct: number }[] } | null;
  meeting_point: { name: string; address: string } | null;
};

function basePrice(r: Row): number {
  const enabled = r.tour_age_tier.filter((t) => t.enabled && t.price > 0);
  const adult = enabled.find((t) => t.key === "adult");
  if (adult) return adult.price;
  return enabled.length ? Math.min(...enabled.map((t) => t.price)) : 0;
}

function nextDeparture(r: Row) {
  const now = Date.now();
  return r.tour_departure
    .filter((d) => !d.stop_sale && new Date(d.starts_at).getTime() >= now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
}

const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3, DST yok.

/** Kalkış anının İstanbul'daki takvim günü (YYYY-AA-GG). */
function istanbulDay(iso: string): string {
  return new Date(new Date(iso).getTime() + ISTANBUL_OFFSET_MS).toISOString().slice(0, 10);
}

/** Satışa açık gelecek kalkışlar, güne göre: aynı günde birden çok saat varsa yerler toplanır. */
function departureDays(r: Row): { date: string; remaining: number }[] {
  const now = Date.now();
  const byDay = new Map<string, number>();
  for (const d of r.tour_departure) {
    if (d.stop_sale || new Date(d.starts_at).getTime() < now) continue;
    const day = istanbulDay(d.starts_at);
    byDay.set(day, (byDay.get(day) ?? 0) + Math.max(0, d.capacity - d.booked_count));
  }
  return [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, remaining]) => ({ date, remaining }));
}

function toResult(r: Row): SearchResult {
  const dep = nextDeparture(r);
  const cover = r.media_asset.find((m) => m.is_cover) ?? r.media_asset[0];
  return {
    id: r.id,
    // Vitrin URL'si slug: SEO ve okunabilirlik. Sepet/kimlik yine uuid taşır.
    productId: r.slug,
    type: "tour",
    title: r.title,
    supplier: OWN_SUPPLIER,
    startsAt: dep?.starts_at ?? "",
    durationMinutes: r.itinerary_stop.reduce((s, x) => s + x.duration_minutes, 0),
    languages: ["TR", ...r.tour_translation.map((t) => t.locale.toUpperCase())],
    cancellation: policyOf(r.cancellation_policy?.template, r.cancellation_policy?.cancellation_cutoff ?? []),
    net: dep?.price_override ?? basePrice(r),
    defaultMarginPct: 0,
    remaining: dep ? Math.max(0, dep.capacity - dep.booked_count) : undefined,
    departureId: dep?.id,
    departureDays: departureDays(r),
    instantConfirm: true,
    imageTone: cover?.tone ?? toneFor(r.id),
  };
}

function toProduct(r: Row): Product {
  const result = toResult(r);
  const departures = r.tour_departure
    .filter((d) => !d.stop_sale)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const price = basePrice(r);
  const variants = departures.length
    ? departures.map((d) => ({
        id: d.id,
        name: new Date(d.starts_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", timeZone: "Europe/Istanbul" }),
        startsAt: d.starts_at,
        basePrice: d.price_override ?? price,
        currency: r.pricing_currency,
        cancellation: result.cancellation,
        quantityAvailable: Math.max(0, d.capacity - d.booked_count),
      }))
    : [
        // Kalkış takvimi girilmemiş tur: tek "kişi başı" seçenek, tarih müşteriden.
        {
          id: `${r.id}-standart`,
          name: "Kişi başı",
          startsAt: new Date().toISOString(),
          basePrice: price,
          currency: r.pricing_currency,
          cancellation: result.cancellation,
          quantityAvailable: 99,
        },
      ];

  return {
    id: r.id,
    type: "tour",
    title: r.title,
    summary: r.description,
    supplier: OWN_SUPPLIER,
    destination: "",
    durationMinutes: result.durationMinutes,
    languages: result.languages,
    cancellation: result.cancellation,
    meetingPoint: r.meeting_point ? `${r.meeting_point.name} — ${r.meeting_point.address}` : "",
    includes: r.includes,
    excludes: r.excludes,
    supplierRef: r.slug,
    variants,
    rating: 0,
    reviewCount: 0,
    imageTone: result.imageTone,
  };
}

export async function listPublishedTours(tenantId: string): Promise<SearchResult[]> {
  const db = createStorefrontClient();
  const { data } = await db
    .from("tour")
    .select(SELECT)
    .eq("tenant_id", tenantId)
    .eq("status", "aktif")
    .eq("show_on_website", true)
    .order("featured", { ascending: false })
    .order("updated_at", { ascending: false });
  return ((data ?? []) as unknown as Row[]).map(toResult);
}

/* --- Extranet (operatör oturumu, RLS) ------------------------------------ */

/** Operatör araması: kiracının yayındaki turları (vitrine kapalı olsa da). */
export async function listTenantToursForSearch(tenantId: string): Promise<SearchResult[]> {
  const db = await createClient();
  const { data } = await db
    .from("tour")
    .select(SELECT)
    .eq("tenant_id", tenantId)
    .eq("status", "aktif")
    .order("featured", { ascending: false })
    .order("updated_at", { ascending: false });
  return ((data ?? []) as unknown as Row[]).map((r) => ({ ...toResult(r), productId: r.id }));
}

/** Operatör ürün sayfası: kimlikle. */
export async function getTenantTourProduct(tenantId: string, id: string): Promise<Product | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await createClient();
  const { data } = await db.from("tour").select(SELECT).eq("tenant_id", tenantId).eq("id", id).eq("status", "aktif").maybeSingle();
  return data ? toProduct(data as unknown as Row) : null;
}

export async function getPublishedTour(tenantId: string, slug: string): Promise<Product | null> {
  const db = createStorefrontClient();
  const { data } = await db
    .from("tour")
    .select(SELECT)
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .eq("status", "aktif")
    .eq("show_on_website", true)
    .maybeSingle();
  return data ? toProduct(data as unknown as Row) : null;
}
