import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
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

export type ModuleItem = {
  id: string;
  title: string;
  subtitle: string;
  price: number | null;
  currency: string;
  tone: string;
  /** Detay sayfası. */
  href: string;
};

export type StorefrontData = {
  tours: SearchResult[];
  modules: Partial<Record<Exclude<SectionKind, "tours">, ModuleItem[]>>;
  /** "Bugünün kalkışları" bandı — yalnız o bölüm açıksa doldurulur. */
  todayBoard: TodayBoard;
};

function toneFor(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `oklch(0.62 0.09 ${h})`;
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
        ? db.from("boat").select("id, slug, title, brand_model, legal_capacity, pricing_model, currency, hourly_rate, multiday_unit_price, per_person_price").eq("tenant_id", tenantId).eq("status", "aktif").limit(24)
        : Promise.resolve({ data: [] }),
      wants("villas")
        ? db.from("villa").select("id, slug, title, province, district, capacity, nightly_rate, price_currency").eq("tenant_id", tenantId).eq("status", "aktif").limit(24)
        : Promise.resolve({ data: [] }),
      wants("transfers")
        ? db.from("vehicle").select("id, title, vehicle_type, seat_capacity, pricing_model, hourly_rate, hourly_currency").eq("tenant_id", tenantId).eq("status", "aktif").limit(24)
        : Promise.resolve({ data: [] }),
      wants("visa")
        ? db.from("visa_product").select("id, title, country, price, currency, processing_days_min, processing_days_max").eq("tenant_id", tenantId).eq("status", "aktif").limit(24)
        : Promise.resolve({ data: [] }),
      wantsBoard ? getTodayBoard(tenantId) : Promise.resolve({ rows: [], tomorrowNext: null }),
    ]);

    return {
      tours,
      todayBoard,
      modules: {
        boats: (boats.data ?? []).map((b) => ({
          id: b.id,
          title: b.title,
          subtitle: [b.brand_model, `${b.legal_capacity} kişi`].filter(Boolean).join(" · "),
          price: b.pricing_model === "saatlik" ? b.hourly_rate : b.pricing_model === "cokGunlu" ? b.multiday_unit_price : b.per_person_price,
          currency: b.currency,
          tone: toneFor(b.id),
          href: `/magaza/tekne/${b.slug}`,
        })),
        villas: (villas.data ?? []).map((v) => ({
          id: v.id,
          title: v.title,
          subtitle: [v.district, v.province, `${v.capacity} kişi`].filter(Boolean).join(" · "),
          price: v.nightly_rate,
          currency: v.price_currency,
          tone: toneFor(v.id),
          href: `/magaza/villa/${v.slug}`,
        })),
        transfers: (vehicles.data ?? []).map((v) => ({
          id: v.id,
          title: v.title,
          subtitle: `${v.vehicle_type === "shuttle" ? "Paylaşımlı" : "Özel"} · ${v.seat_capacity} koltuk`,
          price: v.pricing_model === "saatlikKiralama" ? v.hourly_rate : null,
          currency: v.hourly_currency ?? "TRY",
          tone: toneFor(v.id),
          href: `/magaza/transfer/${v.id}`,
        })),
        visa: (visas.data ?? []).map((v) => ({
          id: v.id,
          title: v.title,
          subtitle: [v.country, v.processing_days_min != null && v.processing_days_max != null ? `${v.processing_days_min}–${v.processing_days_max} gün` : null].filter(Boolean).join(" · "),
          price: v.price,
          currency: v.currency,
          tone: toneFor(v.id),
          href: `/magaza/vize/${v.id}`,
        })),
      },
    };
  },
);
