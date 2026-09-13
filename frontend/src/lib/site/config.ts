/**
 * Vitrin tasarımı — acentenin müşteri sitesinin karakteri.
 *
 * Tek bir JSON; `tenant_site.draft` ve `.published` bu şekli taşır. Burada
 * TİP ve DOĞRULAMA var: veritabanından ne gelirse gelsin `normalizeSite`
 * her zaman geçerli, eksiksiz bir yapı döndürür. Bilinmeyen bölüm türleri
 * atılır, eksik alanlar varsayılanla dolar — eski bir taslak yeni sürümle
 * açılabilir.
 *
 * Bölümler sıralı bir listedir; sürükle-bırak bu listeyi yeniden dizer.
 * Modül bölümleri (turlar, tekneler…) verisi olmayan acentede otomatik
 * gizlenir: açık olması görünmesi için yeterli değil, içerik de gerekir.
 */

export const SITE_VERSION = 1 as const;

export const SECTION_KINDS = [
  "hero",
  "departures",
  "tours",
  "transfers",
  "boats",
  "villas",
  "visa",
  "about",
  "faq",
  "contact",
  "custom",
] as const;
export type SectionKind = (typeof SECTION_KINDS)[number];

/** Veriye bağlı bölümler: yayınlanmış kayıt yoksa vitrinde çizilmez. */
export const MODULE_SECTIONS: SectionKind[] = ["tours", "transfers", "boats", "villas", "visa"];

/** Sayfada yalnız bir kez bulunabilen bölümler: serbest metin dışında hepsi.
 *  Aynı modülü iki kez eklemek (iki "Tekne kiralama") yalnız çift sekme üretir. */
export const SINGLETON_SECTIONS: SectionKind[] = [
  "hero", "departures", "tours", "transfers", "boats", "villas", "visa", "about", "faq", "contact",
];

export type SiteSection = {
  /** Kararlı kimlik: sürükle-bırak ve düzenleme bu kimliğe bağlanır. */
  id: string;
  kind: SectionKind;
  enabled: boolean;
  title: string;
  lead: string;
  /** Modül bölümlerinde gösterilecek en fazla kart sayısı. */
  limit: number;
  /** `custom` bölümde serbest metin (satır sonu paragraf). */
  body: string;
};

export type SiteTheme = {
  /** BRAND_PALETTE kimliği. */
  brand: string;
  /** Üst çubuk: açık zemin ya da koyu (inverse) zemin. */
  header: "light" | "inverse";
  /** Köşe yumuşaklığı. */
  radius: "sharp" | "soft";
  /** Kahraman alanı düzeni. */
  hero: "split" | "centered";
};

export type SiteNavLink = { label: string; href: string };

export type SiteConfig = {
  version: typeof SITE_VERSION;
  theme: SiteTheme;
  nav: { links: SiteNavLink[]; showCart: boolean; showSignIn: boolean };
  footer: { note: string; instagram: string; whatsapp: string; showTursab: boolean };
  seo: { title: string; description: string };
  sections: SiteSection[];
};

/* --- Varsayılanlar ------------------------------------------------------- */

const DEFAULT_SECTION_TEXT: Record<SectionKind, { title: string; lead: string }> = {
  hero: { title: "", lead: "Acentenin kendi düzenlediği turlar; fiyatlar kişi başı, vergiler dahil." },
  departures: { title: "Bugünün kalkış saatleri", lead: "" },
  tours: { title: "Turlar", lead: "" },
  transfers: { title: "Transferler", lead: "Havalimanı ve şehirler arası özel transfer." },
  boats: { title: "Tekne kiralama", lead: "" },
  villas: { title: "Villalar", lead: "" },
  visa: { title: "Vize hizmetleri", lead: "" },
  about: { title: "Hakkımızda", lead: "" },
  faq: { title: "Sıkça sorulan sorular", lead: "" },
  contact: { title: "İletişim", lead: "" },
  custom: { title: "Yeni bölüm", lead: "" },
};

export function makeSection(kind: SectionKind, id = `${kind}-${Math.random().toString(36).slice(2, 8)}`): SiteSection {
  return {
    id,
    kind,
    enabled: true,
    title: DEFAULT_SECTION_TEXT[kind].title,
    lead: DEFAULT_SECTION_TEXT[kind].lead,
    limit: 6,
    body: "",
  };
}

export function defaultSiteConfig(): SiteConfig {
  return {
    version: SITE_VERSION,
    theme: { brand: "mürekkep", header: "light", radius: "soft", hero: "split" },
    nav: {
      // Modül sekmeleri (Turlar, Tekneler…) içeriğe göre otomatik; buradakiler ek bağlantı.
      links: [],
      showCart: true,
      showSignIn: false,
    },
    footer: { note: "", instagram: "", whatsapp: "", showTursab: true },
    seo: { title: "", description: "" },
    sections: [
      makeSection("hero", "hero"),
      makeSection("departures", "departures"),
      makeSection("tours", "tours"),
      makeSection("transfers", "transfers"),
      makeSection("boats", "boats"),
      makeSection("villas", "villas"),
      makeSection("visa", "visa"),
      makeSection("about", "about"),
      makeSection("contact", "contact"),
    ],
  };
}

/* --- Doğrulama ------------------------------------------------------------ */

type Raw = Record<string, unknown> | null | undefined;

function str(v: unknown, fallback: string, max = 2000): string {
  return typeof v === "string" ? v.slice(0, max) : fallback;
}
function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

/** Yalnız site içi göreli yollar ya da https bağlantılar. */
function safeHref(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (s.startsWith("/") && !s.startsWith("//")) return s.slice(0, 200);
  if (/^https:\/\/[^\s]+$/i.test(s)) return s.slice(0, 500);
  return null;
}

export function normalizeSite(raw: Raw): SiteConfig {
  const d = defaultSiteConfig();
  if (!raw || typeof raw !== "object") return d;

  const theme = (raw.theme ?? {}) as Record<string, unknown>;
  const nav = (raw.nav ?? {}) as Record<string, unknown>;
  const footer = (raw.footer ?? {}) as Record<string, unknown>;
  const seo = (raw.seo ?? {}) as Record<string, unknown>;

  const seen = new Set<string>();
  const singletons = new Set<SectionKind>();
  const sections: SiteSection[] = [];
  const rawSections = Array.isArray(raw.sections) ? raw.sections : d.sections;
  for (const item of rawSections) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    if (typeof s.kind !== "string" || !(SECTION_KINDS as readonly string[]).includes(s.kind)) continue;
    const kind = s.kind as SectionKind;
    if (SINGLETON_SECTIONS.includes(kind)) {
      if (singletons.has(kind)) continue;
      singletons.add(kind);
    }
    let id = str(s.id, kind, 40).replace(/[^a-z0-9-]/gi, "") || kind;
    while (seen.has(id)) id = `${id}-x`;
    seen.add(id);
    const base = makeSection(kind, id);
    const limitRaw = typeof s.limit === "number" ? Math.floor(s.limit) : base.limit;
    sections.push({
      id,
      kind,
      enabled: bool(s.enabled, true),
      title: str(s.title, base.title, 120),
      lead: str(s.lead, base.lead, 400),
      limit: Math.min(24, Math.max(1, limitRaw)),
      body: str(s.body, "", 8000),
    });
  }
  // Kahraman alanı her zaman var ve her zaman en üstte.
  const heroIdx = sections.findIndex((s) => s.kind === "hero");
  const hero = heroIdx >= 0 ? sections.splice(heroIdx, 1)[0] : makeSection("hero", "hero");
  sections.unshift(hero);

  const links: SiteNavLink[] = [];
  if (Array.isArray(nav.links)) {
    for (const l of nav.links.slice(0, 6)) {
      const o = (l ?? {}) as Record<string, unknown>;
      const href = safeHref(o.href);
      const label = str(o.label, "", 40).trim();
      // Modül sekmeleri otomatik üretilir; elle eklenmiş kopyaları alınmaz.
      if (href && label && href !== "/magaza/tur-arama" && !href.startsWith("/magaza#")) links.push({ label, href });
    }
  }

  return {
    version: SITE_VERSION,
    theme: {
      brand: str(theme.brand, d.theme.brand, 40),
      header: oneOf(theme.header, ["light", "inverse"] as const, d.theme.header),
      radius: oneOf(theme.radius, ["sharp", "soft"] as const, d.theme.radius),
      hero: oneOf(theme.hero, ["split", "centered"] as const, d.theme.hero),
    },
    nav: {
      links: Array.isArray(nav.links) ? links : d.nav.links,
      showCart: bool(nav.showCart, d.nav.showCart),
      showSignIn: bool(nav.showSignIn, d.nav.showSignIn),
    },
    footer: {
      note: str(footer.note, "", 300),
      instagram: str(footer.instagram, "", 80).replace(/^@/, ""),
      whatsapp: str(footer.whatsapp, "", 32).replace(/[^\d+]/g, ""),
      showTursab: bool(footer.showTursab, true),
    },
    seo: { title: str(seo.title, "", 80), description: str(seo.description, "", 200) },
    sections,
  };
}

/* --- Sıralama yardımcıları (editör ve testler için) ------------------------ */

export function moveSection(sections: SiteSection[], from: number, to: number): SiteSection[] {
  const next = [...sections];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
