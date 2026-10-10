import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { kartFromTour, mediaUrl, type KartUrun } from "@/lib/storefront/kart";
import { createStorefrontClient } from "@/lib/storefront/tenant";
import { listPublishedTours } from "@/lib/storefront/tours";
import { getTodayBoard, type TodayBoard } from "@/lib/storefront/departures";
import type { SearchResult } from "@/lib/types";
import { normalizeSite, type SectionKind, type SiteConfig } from "./config";

/** Müşterinin gördüğü yapı: yayınlanmış; hiç yayınlanmamışsa varsayılan. */
export const getPublishedSite = cache(async (tenantId: string): Promise<SiteConfig> => {
  const db = createStorefrontClient();
  const { data } = await db
    .from("tenant_site")
    .select("published")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return normalizeSite((data?.published ?? null) as Record<string, unknown> | null);
});

/** Editörün gördüğü taslak — oturumdaki kullanıcının haklarıyla. */
export async function getDraftSite(tenantId: string): Promise<{ draft: SiteConfig; publishedAt: string | null; hasPublished: boolean }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenant_site")
    .select("draft, published, published_at")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  const raw = (data?.draft ?? null) as Record<string, unknown> | null;
  // Hiç taslak yoksa yayınlanandan, o da yoksa varsayılandan başla.
  const source = raw && Object.keys(raw).length ? raw : ((data?.published ?? null) as Record<string, unknown> | null);
  return {
    draft: normalizeSite(source),
    publishedAt: data?.published_at ?? null,
    hasPublished: !!data?.published,
  };
}

/* --- Bölüm verileri ------------------------------------------------------- */

export type ModuleKind = Exclude<SectionKind, "tours" | "hero" | "departures" | "about" | "reasons" | "faq" | "contact" | "custom">;

export type StorefrontData = {
  tours: SearchResult[];
  /** Tur kartları — `tours`tan türetilmiş, `UrunKarti` için hazır. */
  tourCards: KartUrun[];
  /** Modül kartları (tekne, villa, araç, vize); VITRIN.md §5. */
  modules: Partial<Record<ModuleKind, KartUrun[]>>;
  /** "Bugünün kalkışları" bandı — yalnız o bölüm açıksa doldurulur. */
  todayBoard: TodayBoard;
};

function toneFor(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `oklch(0.62 0.09 ${h})`;
}

type MediaRow = { tone: string | null; alt: string; is_cover: boolean; position: number; storage_path: string | null; external_url: string | null };
const MEDIA = "media_asset(tone, alt, is_cover, position, storage_path, external_url)";

function cover(id: string, title: string, media: MediaRow[] | null | undefined): { photo: KartUrun["photo"]; tone: string } {
  const list = [...(media ?? [])].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position);
  const m = list[0];
  const url = mediaUrl(m);
  return { photo: url ? { url, alt: m?.alt || title } : null, tone: m?.tone ?? toneFor(id) };
}

/**
 * Yalnız AÇIK modül bölümlerinin verisi çekilir; kapalı bölüm için sorgu
 * atılmaz. Boş gelen modül vitrinde çizilmez (StorefrontHome karar verir).
 */
export const getStorefrontData = cache(
  async (tenantId: string, config: SiteConfig): Promise<StorefrontData> => {
    const db = createStorefrontClient();
    const wants = (k: SectionKind) => config.sections.some((s) => s.kind === k && s.enabled);
    const needTours = wants("tours") || wants("departures");

    const wantsBoard = wants("departures");
    const [tours, boats, villas, vehicles, visas, todayBoard] = await Promise.all([
      needTours ? listPublishedTours(tenantId) : Promise.resolve([]),
      wants("boats")
        ? db.from("boat").select(`id, slug, title, brand_model, legal_capacity, captain_option, pricing_model, currency, hourly_rate, multiday_unit, multiday_unit_price, per_person_price, ${MEDIA}`).eq("tenant_id", tenantId).eq("status", "aktif").limit(24)
        : Promise.resolve({ data: [] }),
      wants("villas")
        ? db.from("villa").select(`id, slug, title, province, district, capacity, nightly_rate, price_currency, min_nights, pets_allowed,
            villa_category(title), villa_feature_link(villa_feature(name)), villa_poi_distance(label, distance, unit), ${MEDIA}`).eq("tenant_id", tenantId).eq("status", "aktif").limit(24)
        : Promise.resolve({ data: [] }),
      wants("transfers")
        ? db.from("vehicle").select(`id, title, vehicle_type, seat_capacity, luggage_capacity, pricing_model, hourly_rate, hourly_currency, ${MEDIA}`).eq("tenant_id", tenantId).eq("status", "aktif").limit(24)
        : Promise.resolve({ data: [] }),
      wants("visa")
        ? db.from("visa_product").select("id, title, country, price, currency, processing_days_min, processing_days_max").eq("tenant_id", tenantId).eq("status", "aktif").limit(24)
        : Promise.resolve({ data: [] }),
      wantsBoard ? getTodayBoard(tenantId) : Promise.resolve({ rows: [], tomorrowNext: null }),
    ]);

    type BoatRow = { id: string; slug: string; title: string; brand_model: string; legal_capacity: number; captain_option: string; pricing_model: string; currency: string; hourly_rate: number | null; multiday_unit: string | null; multiday_unit_price: number | null; per_person_price: number | null; media_asset: MediaRow[] };
    type One<T> = T | T[] | null;
    type VillaRow = {
      id: string; slug: string; title: string; province: string; district: string; capacity: number; nightly_rate: number; price_currency: string; min_nights: number;
      pets_allowed: boolean; villa_category: One<{ title: string }>; villa_feature_link: { villa_feature: One<{ name: string }> }[];
      villa_poi_distance: { label: string; distance: number | string; unit: string }[]; media_asset: MediaRow[];
    };
    const first = <T,>(x: One<T>): T | null => (Array.isArray(x) ? x[0] ?? null : x);
    type VehicleRow = { id: string; title: string; vehicle_type: string; seat_capacity: number; luggage_capacity: number; pricing_model: string; hourly_rate: number | null; hourly_currency: string | null; media_asset: MediaRow[] };
    type VisaRow = { id: string; title: string; country: string; price: number; currency: string; processing_days_min: number | null; processing_days_max: number | null };

    return {
      tours,
      tourCards: tours.map((r) => kartFromTour(r)),
      todayBoard,
      modules: {
        boats: ((boats.data ?? []) as unknown as BoatRow[]).map((b) => {
          const price = b.pricing_model === "saatlik" ? b.hourly_rate : b.pricing_model === "cokGunlu" ? b.multiday_unit_price : b.per_person_price;
          const unit = b.pricing_model === "saatlik" ? "saatlik" : b.pricing_model === "cokGunlu" ? (b.multiday_unit === "gun" ? "gunluk" : "gecelik") : "kisiBasi";
          return {
            kind: "tekne" as const,
            id: b.id,
            href: `/magaza/tekne/${b.slug}`,
            title: b.title,
            subtitle: b.brand_model,
            ...cover(b.id, b.title, b.media_asset),
            price,
            currency: b.currency,
            priceUnit: unit,
            badge: null,
            meta: [`${b.legal_capacity} kişi`, b.captain_option === "kaptanli" ? "Kaptanlı" : b.captain_option === "kaptansiz" ? "Kaptansız" : "Kaptanlı / kaptansız"],
            freeCancelHours: null,
            rating: null,
            facets: { kapasite: b.legal_capacity, kaptan: b.captain_option, fiyat: price ?? 0 },
          };
        }),
        villas: ((villas.data ?? []) as unknown as VillaRow[]).map((v) => ({
          kind: "villa" as const,
          id: v.id,
          href: `/magaza/villa/${v.slug}`,
          title: v.title,
          subtitle: [v.district, v.province].filter(Boolean).join(", "),
          ...cover(v.id, v.title, v.media_asset),
          price: v.nightly_rate,
          currency: v.price_currency,
          priceUnit: "gecelik" as const,
          badge: null,
          meta: [`${v.capacity} kişi`, `En az ${v.min_nights} gece`],
          freeCancelHours: null,
          rating: null,
          facets: { kisi: v.capacity, bolge: [v.district, v.province].filter(Boolean), fiyat: v.nightly_rate },
          stay: {
            location: [v.district, v.province].filter(Boolean).join(", "),
            category: first(v.villa_category)?.title ?? null,
            features: v.villa_feature_link.map((l) => first(l.villa_feature)?.name).filter((x): x is string => !!x),
            poi: v.villa_poi_distance.map((x) => ({ label: x.label, distance: Number(x.distance), unit: x.unit })).sort((x, y) => toMeters(x) - toMeters(y)),
            capacity: v.capacity,
            minNights: v.min_nights,
            petsAllowed: v.pets_allowed,
          },
        })),
        transfers: ((vehicles.data ?? []) as unknown as VehicleRow[]).map((v) => ({
          kind: "transfer" as const,
          id: v.id,
          href: `/magaza/transfer/${v.id}`,
          title: v.title,
          subtitle: v.vehicle_type === "shuttle" ? "Paylaşımlı" : "Özel araç",
          ...cover(v.id, v.title, v.media_asset),
          price: v.pricing_model === "saatlikKiralama" ? v.hourly_rate : null,
          currency: v.hourly_currency ?? "TRY",
          priceUnit: (v.pricing_model === "saatlikKiralama" ? "saatlik" : "aracBasi") as KartUrun["priceUnit"],
          badge: null,
          meta: [`${v.seat_capacity} koltuk`, `${v.luggage_capacity} bavul`],
          freeCancelHours: null,
          rating: null,
          facets: { tip: v.vehicle_type, koltuk: v.seat_capacity, model: v.pricing_model },
        })),
        visa: ((visas.data ?? []) as unknown as VisaRow[]).map((v) => ({
          kind: "vize" as const,
          id: v.id,
          href: `/magaza/vize/${v.id}`,
          title: v.title,
          subtitle: v.country,
          photo: null,
          tone: toneFor(v.id),
          price: v.price,
          currency: v.currency,
          priceUnit: "basvuruBasi" as const,
          badge: null,
          meta: v.processing_days_min != null && v.processing_days_max != null ? [`${v.processing_days_min}–${v.processing_days_max} gün`] : [],
          freeCancelHours: null,
          rating: null,
          facets: { ulke: v.country },
        })),
      },
    };
  },
);

/** Mesafe sıralaması için: en yakın nokta kartta önce görünür. */
function toMeters(p: { distance: number; unit: string }): number {
  return p.unit === "km" ? p.distance * 1000 : p.distance;
}
