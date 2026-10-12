import "server-only";
import { cache } from "react";
import { ALL_CATEGORIES, DEMO_VITRIN, type CategoryKey, type Destination, type HeroSlide, type Product, type VitrinData } from "@/content/vitrin";
import { formatDuration } from "@/lib/i18n";
import { getPublishedSite, getStorefrontData } from "@/lib/site/load";
import type { KartUrun } from "@/lib/storefront/kart";
import { getTourExtra } from "@/lib/storefront/details";
import { getStorefrontProfile } from "@/lib/storefront/profile";
import { STOCK_HERO } from "@/lib/storefront/stock-photos";
import { listPublishedTours } from "@/lib/storefront/tours";
import { parseFaq } from "@/components/b2c/StorefrontHome";

/**
 * Kiracı vitrininin verisi, Seyyah vitrin bileşenlerinin okuduğu şekle
 * (`VitrinData`) çevrilir: turlar `Product`, modül ilanları (tekne, villa,
 * araç, vize) kendi detay sayfalarına giden `Product`, şehirler
 * destinasyon, kategoriler ilan türlerinden. Kiracısız adreste DEMO.
 *
 * Fiyatlar kuruştan TL'ye (Seyyah bileşenleri TL basar); sunucu sipariş
 * anında kendi hesaplar, istemci fiyat göndermez.
 */
export const getVitrinData = cache(async (tenant: { id: string; name: string } | null): Promise<VitrinData> => {
  if (!tenant) return DEMO_VITRIN;

  const [config, profile, tours] = await Promise.all([getPublishedSite(tenant.id), getStorefrontProfile(tenant.id), listPublishedTours(tenant.id)]);
  const unique = tours.filter((r, i, all) => all.findIndex((x) => x.productId === r.productId) === i).slice(0, 24);
  const extras = await Promise.all(unique.map((r) => getTourExtra(tenant.id, r.productId)));
  const modules = await getStorefrontData(tenant.id, config);

  const products: Product[] = [];
  /** slug → görünen ad (Türkçe harfler korunur). */
  const names = new Map<string, string>();
  let stock = 0;
  const stockImage = () => STOCK_HERO[stock++ % STOCK_HERO.length].url;

  unique.forEach((r, i) => {
    const x = extras[i];
    const gallery = (x?.gallery ?? []).map((g) => g.url).filter((u): u is string => !!u);
    const image = r.imageUrl ?? gallery[0] ?? stockImage();
    const tiers = x?.tiers ?? [];
    const tickets = tiers.length
      ? tiers.map((t) => ({ label: t.key === "adult" ? "Yetişkin" : t.key === "child" ? `Çocuk (${t.minAge}–${t.maxAge})` : `Bebek (${t.minAge}–${t.maxAge})`, price: Math.round(t.price / 100) }))
      : [{ label: "Yetişkin", price: Math.round(r.net / 100) }];
    const cityName = (x?.startLocation || tenant.name).trim();
    const city = slug(cityName);
    names.set(city, cityName);
    const remaining = r.remaining ?? 99;
    products.push({
      slug: r.productId,
      title: r.title,
      city,
      category: "tur",
      image,
      gallery: gallery.length ? gallery : [image],
      summary: "",
      duration: r.durationMinutes ? formatDuration(r.durationMinutes) : "",
      languages: r.languages,
      badge: remaining <= 6 ? "Son yerler" : r.featured ? "Çok tercih edilen" : undefined,
      instant: false,
      freeCancel: r.cancellation.type === "free",
      options: [{ name: "Standart", tickets }],
      highlights: [],
      description: "",
      included: [],
      excluded: [],
      meeting: x?.startLocation ?? "",
      remember: [x?.knowBeforeYouGo, x?.whatToBring].filter((s): s is string => !!s?.trim()),
      cancellation: r.cancellation.type === "free" ? `Tur saatinden ${r.cancellation.hoursBefore} saat öncesine kadar ücretsiz iptal.` : "Bu ürün için iade yapılmaz.",
      supplier: tenant.name,
      chips: x?.categories ?? [],
      itinerary: x?.itinerary.length ? x.itinerary.map((s) => ({ time: s.durationMinutes ? formatDuration(s.durationMinutes) : "", title: s.name, body: s.description })) : undefined,
      available: r.departureDays?.map((d) => d.date),
    });
  });

  const KIND: Record<string, CategoryKey> = { tekne: "tekne", transfer: "transfer", villa: "konaklama", vize: "vize" };
  for (const list of Object.values(modules.modules)) {
    for (const k of list ?? []) {
      const p = fromKart(k, KIND[k.kind] ?? "tur", tenant.name, stockImage);
      if (p.city && !names.has(p.city)) names.set(p.city, k.subtitle.split(",")[0].trim());
      products.push(p);
    }
  }

  // Destinasyonlar yalnız gerçek yer adlarından: tur başlangıcı ve villa ilçesi.
  const destMap = new Map<string, Destination>();
  for (const p of products) if (p.city && !destMap.has(p.city)) destMap.set(p.city, { slug: p.city, name: names.get(p.city) ?? titleCase(p.city), image: p.image });
  const cats = ALL_CATEGORIES.filter((c) => products.some((p) => p.category === c.key));
  const faqSection = config.sections.find((s) => s.kind === "faq" && s.enabled);
  const own = products.filter((p) => !STOCK_HERO.some((s) => s.url === p.image)).slice(0, 3);
  const hero: HeroSlide[] = own.length
    ? own.map((p) => ({ src: p.image, alt: p.title, caption: p.title }))
    : STOCK_HERO.map((s) => ({ src: s.url, alt: s.alt, caption: s.alt }));

  return {
    demo: false,
    agency: { name: tenant.name, tagline: config.footer.note || "Turizm & Seyahat", phone: profile.contactPhone ?? "", email: profile.contactEmail ?? "" },
    destinations: [...destMap.values()],
    categories: cats.length ? cats : ALL_CATEGORIES.slice(0, 1),
    products,
    inspirations: [],
    faq: faqSection ? parseFaq(faqSection.body) : [],
    hero,
    whatsapp: config.footer.whatsapp || undefined,
  };
});

function fromKart(k: KartUrun, category: CategoryKey, agencyName: string, stockImage: () => string): Product {
  const price = k.price != null ? Math.round(k.price / 100) : 0;
  const unit = { kisiBasi: "Kişi", aracBasi: "Araç", saatlik: "Saat", gecelik: "Gece", gunluk: "Gün", basvuruBasi: "Başvuru" }[k.priceUnit];
  const image = k.photo?.url ?? stockImage();
  return {
    slug: k.id,
    href: k.href,
    title: k.title,
    // Villa alt başlığı ilçe/il (gerçek yer); tekne, araç ve vizede marka/tip olduğu için şehir yok.
    city: k.kind === "villa" && k.subtitle ? slug(k.subtitle.split(",")[0]) : "",
    category,
    image,
    gallery: [image],
    summary: k.meta.join(" · "),
    duration: k.meta[0] ?? "",
    languages: [],
    badge: k.badge === "sonYerler" ? "Son yerler" : k.badge === "oneCikan" ? "Çok tercih edilen" : undefined,
    instant: false,
    freeCancel: k.freeCancelHours != null,
    options: price ? [{ name: "Standart", tickets: [{ label: unit, price }] }] : [],
    highlights: [],
    description: "",
    included: [],
    excluded: [],
    meeting: "",
    remember: [],
    cancellation: "",
    supplier: agencyName,
    chips: k.meta,
    stay: k.stay,
  };
}

function slug(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "merkez";
}

function titleCase(s: string): string {
  return s.split("-").map((w) => w.charAt(0).toLocaleUpperCase("tr") + w.slice(1)).join(" ");
}
