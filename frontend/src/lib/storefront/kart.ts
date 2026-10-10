import type { SearchResult } from "@/lib/types";

/**
 * Vitrin kartının veri modeli (VITRIN.md §5).
 *
 * Referansın tek `ProductCard`'ı dört tip için `kind`'e göre dallanıyor; biz
 * de tur (`SearchResult`) ve modül kayıtlarını (tekne, villa, araç, vize) tek
 * tipe indiriyoruz. `priceUnit` kritik: kartın yanlış birim yazmaması buna
 * bağlı. `facets` katalog filtrelerinin okuduğu düz alanlar; kart basmaz.
 */
export type KartKind = "tur" | "transfer" | "tekne" | "villa" | "vize";

export type PriceUnit = "kisiBasi" | "aracBasi" | "saatlik" | "gecelik" | "gunluk" | "basvuruBasi";

export type KartFoto = { url: string; alt: string } | null;

export type KartUrun = {
  kind: KartKind;
  id: string;
  href: string;
  title: string;
  subtitle: string;
  /** Gerçek görsel; yoksa `tone` zemin. */
  photo: KartFoto;
  tone: string;
  /** Kuruş; `null` → "fiyat teklifle". */
  price: number | null;
  currency: string;
  priceUnit: PriceUnit;
  badge: "sonYerler" | "oneCikan" | null;
  /** En çok 3 kısa nitelik: süre, dil, kapasite… */
  meta: string[];
  freeCancelHours: number | null;
  /** Yorum verisi bugün yok; her zaman null. Uydurma puan basılmaz. */
  rating: { score: number; count: number } | null;
  facets: Record<string, string | number | boolean | string[]>;
};

/** `media_asset` satırından görsel adresi: dış bağlantı ya da Supabase Storage. */
export function mediaUrl(m: { storage_path?: string | null; external_url?: string | null } | null | undefined): string | null {
  if (!m) return null;
  if (m.external_url) return m.external_url;
  if (m.storage_path) {
    const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
    if (!base) return null;
    // `storage_path` kova adıyla başlar: "<kova>/<yol>".
    return `${base}/storage/v1/object/public/${m.storage_path.replace(/^\//, "")}`;
  }
  return null;
}

/** Süre kovası: katalog filtresi için. */
export function sureKovasi(minutes: number): "yarimGun" | "tamGun" | "cokGun" | "" {
  if (!minutes) return "";
  if (minutes <= 4 * 60) return "yarimGun";
  if (minutes <= 24 * 60) return "tamGun";
  return "cokGun";
}

/** Tur (`SearchResult`) → kart. Kiracı vitrininde marj 0: `net` zaten satış fiyatı. */
export function kartFromTour(r: SearchResult, opts: { featured?: boolean; retailMarginPct?: number } = {}): KartUrun {
  const pct = opts.retailMarginPct ?? r.defaultMarginPct ?? 0;
  const price = Math.round(r.net * (1 + pct / 100));
  const lastSpots = (r.remaining ?? 99) <= 6;
  const meta: string[] = [];
  if (r.durationMinutes > 0) meta.push(formatDurationShort(r.durationMinutes));
  if (r.languages.length) meta.push(r.languages.join(", "));
  const free = r.cancellation.type === "free" ? r.cancellation.hoursBefore : null;
  return {
    kind: "tur",
    id: r.id,
    href: `/magaza/${r.productId}`,
    title: r.title,
    subtitle: "",
    photo: r.imageUrl ? { url: r.imageUrl, alt: r.imageAlt ?? r.title } : null,
    tone: r.imageTone,
    price: price > 0 ? price : null,
    currency: r.currency ?? "TRY",
    priceUnit: "kisiBasi",
    badge: lastSpots ? "sonYerler" : (opts.featured ?? r.featured) ? "oneCikan" : null,
    meta,
    freeCancelHours: free,
    rating: (r.reviewCount ?? 0) > 0 && r.rating ? { score: r.rating, count: r.reviewCount ?? 0 } : null,
    facets: {
      kategori: r.categories ?? [],
      sure: sureKovasi(r.durationMinutes),
      iptal: r.cancellation.type === "free",
      dil: r.languages,
      fiyat: price,
    },
  };
}

function formatDurationShort(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} sa ${m} dk`;
  if (h) return `${h} sa`;
  return `${m} dk`;
}
