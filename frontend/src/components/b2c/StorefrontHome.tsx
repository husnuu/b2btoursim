import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarCheck, CalendarDays, Check, Headset, Mail, MailCheck, MapPin, Phone, Search, Zap, type LucideIcon } from "lucide-react";
import { t } from "@/lib/i18n";
import { MODULE_SECTIONS, type SectionKind, type SiteConfig, type SiteSection } from "@/lib/site/config";
import type { ModuleKind, StorefrontData } from "@/lib/site/load";
import type { KartKind, KartUrun } from "@/lib/storefront/kart";
import type { StorefrontProfile } from "@/lib/storefront/profile";
import { STOCK_ABOUT, STOCK_HERO } from "@/lib/storefront/stock-photos";
import { Carousel } from "./Carousel";
import { DepartureBoard } from "./DepartureBoard";
import { HeroSearch, type SearchTab } from "./HeroSearch";
import { HeroSlides, type HeroSlide } from "./HeroSlides";
import { ProductMedia } from "./ProductMedia";
import { SSS } from "./SSS";
import { UrunKarti } from "./UrunKarti";

/**
 * Ana sayfa (Seyyah vitrin tasarımı): `config.sections` sırasıyla çizilir.
 *
 * Kural: bölümün AÇIK olması yetmez, içeriği de olmalı. Tekne bölümü açık
 * ama yayında tekne yoksa hiç çizilmez — müşteriye boş ızgara gösterilmez.
 *
 * Düzen: büyük köşeli fotoğraf kahramanı + şeritli başlık + sekmeli arama
 * kartı; güven satırı; art arda gelen modül bölümleri tek "mist" kutuda
 * karusel olarak; hakkımızda aksan renkli bant; "Neden biz" numaralı
 * kartlar; SSS iki kolon; iletişim koyu bant; en altta üç adım.
 */
const wrap = "mx-auto w-full max-w-[1320px] px-4";

export function StorefrontHome({
  name,
  config,
  data,
  profile,
  preview = false,
  slides,
}: {
  name: string;
  config: SiteConfig;
  data: StorefrontData;
  profile: StorefrontProfile | null;
  preview?: boolean;
  /** Kahraman fotoğrafları; verilmezse yayınlanmış ilanların kapaklarından türetilir. */
  slides?: HeroSlide[];
}) {
  const visible = config.sections.filter((s) => s.enabled && sectionHasContent(s, data, profile));
  const tabs = searchTabs(config, data, profile);
  const own = slidesFrom(data);
  // Acentenin görseli yoksa stok fotoğraf: kahraman ve hakkımızda bandı boş kalmaz.
  const heroSlides = slides ?? (own.length ? own : STOCK_HERO);
  const ownPhotos = allCards(data).filter((c) => c.photo).map((c) => c.photo!);
  const photos = ownPhotos.length >= 2 ? ownPhotos : STOCK_ABOUT;

  // Art arda gelen modül bölümleri tek kutuda toplanır.
  const groups: (SiteSection | SiteSection[])[] = [];
  for (const s of visible) {
    const prev = groups[groups.length - 1];
    if (isModuleSection(s.kind)) {
      if (Array.isArray(prev)) prev.push(s);
      else groups.push([s]);
    } else groups.push(s);
  }

  return (
    <>
      {groups.map((g) => {
        if (Array.isArray(g)) {
          return (
            <div key={g.map((s) => s.id).join("+")} className={`${wrap} pt-16`}>
              <div className="rounded-[var(--radius-xl)] bg-sunken px-4 py-12 sm:px-10 sm:py-16">
                {g.map((s, i) => (
                  <ModuleStrip key={s.id} section={s} items={cardsFor(s, data)} first={i === 0} preview={preview} />
                ))}
              </div>
              {g.some((s) => s.kind === "tours") && <CategoryBento cards={uniqueByHref(data.tourCards)} preview={preview} />}
            </div>
          );
        }
        const s = g;
        switch (s.kind) {
          case "hero":
            return (
              <div key={s.id}>
                <Hero name={name} section={s} layout={config.theme.hero} tone={heroTone(name)} tabs={tabs} slides={heroSlides} preview={preview} />
                <TrustRow trustBadges={config.theme.trustBadges} profile={profile} />
              </div>
            );
          case "departures":
            return (
              <section key={s.id} id={s.id} className={`${wrap} scroll-mt-[calc(var(--header-h)+1rem)] pt-16`} data-section={s.kind}>
                <div className="rounded-[var(--radius-xl)] bg-inverse px-5 py-10 text-ink-inverse sm:px-10 sm:py-12">
                  <DepartureBoard title={s.title} board={data.todayBoard} />
                </div>
              </section>
            );
          case "about":
            return (
              <section key={s.id} id={s.id} className={`${wrap} scroll-mt-[calc(var(--header-h)+1rem)] pt-20`} data-section={s.kind}>
                <div className={`grain relative grid items-center gap-10 overflow-hidden rounded-[var(--radius-xl)] bg-highlight p-8 text-on-highlight sm:p-14 ${photos.length >= 2 ? "lg:grid-cols-[1.2fr_1fr]" : ""}`}>
                  <div className="relative">
                    <p className="text-sm font-bold tracking-wide uppercase opacity-80">{t("b2c.about.eyebrow", { name })}</p>
                    <h2 className="font-display mt-3 text-[2.2rem] leading-[1.05] sm:text-5xl">{s.title}</h2>
                    {s.lead && <p className="mt-4 text-lg font-semibold opacity-90">{s.lead}</p>}
                    <p className="mt-5 max-w-lg whitespace-pre-line text-lg leading-relaxed opacity-85">{profile?.about}</p>
                  </div>
                  {photos.length >= 2 && (
                    <div className="relative h-64 sm:h-72" aria-hidden="true">
                      <div className="polaroid absolute top-0 left-[8%] w-[48%] -rotate-6">
                        <div className="relative aspect-[4/5]">
                          <Image src={photos[0].url} alt="" fill sizes="240px" className="object-cover" />
                        </div>
                      </div>
                      <div className="polaroid float absolute top-6 right-[6%] w-[46%] rotate-6">
                        <div className="relative aspect-[4/5]">
                          <Image src={photos[1].url} alt="" fill sizes="240px" className="object-cover" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          case "reasons":
            return (
              <section key={s.id} id={s.id} className={`${wrap} scroll-mt-[calc(var(--header-h)+1rem)] pt-20`} data-section={s.kind}>
                <SectionTitle lead={s.lead}>{s.title}</SectionTitle>
                <ol className="grid gap-4 md:grid-cols-3">
                  {parseFaq(s.body).map((r, i) => (
                    <li
                      key={r.q}
                      data-reveal
                      style={{ "--d": `${i * 120}ms` } as React.CSSProperties}
                      className="group relative overflow-hidden rounded-[var(--radius-lg)] border-2 border-line p-7 transition-colors hover:border-ink"
                    >
                      <span className="font-display absolute -top-4 right-4 text-[7rem] leading-none text-ink/[0.06] transition-colors group-hover:text-highlight">{i + 1}</span>
                      <span className="relative grid size-12 place-items-center rounded-[var(--radius)] bg-inverse text-ink-inverse">
                        <Check className="size-6" strokeWidth={2.6} />
                      </span>
                      <h3 className="relative mt-5 text-xl font-bold text-ink">{r.q}</h3>
                      <p className="relative mt-2 leading-relaxed text-ink-2">{r.a}</p>
                    </li>
                  ))}
                </ol>
              </section>
            );
          case "faq": {
            const phone = profile?.contactPhone;
            return (
              <section key={s.id} id={s.id} className={`${wrap} grid gap-10 scroll-mt-[calc(var(--header-h)+1rem)] pt-20 lg:grid-cols-[0.8fr_1.2fr]`} data-section={s.kind}>
                <div>
                  <h2 className="text-[1.6rem] font-extrabold tracking-tight text-ink sm:text-[2.2rem]">{s.title}</h2>
                  <p className="mt-3 max-w-sm text-ink-2">{s.lead || (phone ? t("b2c.faq.help", { phone }) : t("b2c.faq.helpNoPhone"))}</p>
                  {!preview && (
                    <Link href="/magaza/sss" className="btn-arrow mt-5 inline-flex items-center gap-1.5 font-semibold text-ink underline decoration-2 underline-offset-4 hover:decoration-highlight">
                      {t("home.seeAll")} <ArrowRight className="size-4" />
                    </Link>
                  )}
                </div>
                <SSS sorular={parseFaq(s.body)} />
              </section>
            );
          }
          case "contact":
            return (
              <section key={s.id} id={s.id} className={`${wrap} scroll-mt-[calc(var(--header-h)+1rem)] pt-20`} data-section={s.kind}>
                <div className="grid gap-8 overflow-hidden rounded-[var(--radius-xl)] bg-inverse p-8 text-ink-inverse sm:p-12 lg:grid-cols-[1fr_1fr]">
                  <div>
                    <h2 className="font-display text-[2.2rem] leading-[1.05] sm:text-5xl">{s.title}</h2>
                    {s.lead && <p className="mt-4 max-w-md text-ink-inverse-2">{s.lead}</p>}
                  </div>
                  <ul className="flex flex-col divide-y divide-ink-inverse-3/20">
                    {profile?.contactPhone && (
                      <li className="flex items-center gap-4 py-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius)] bg-highlight text-on-highlight"><Phone className="size-5" /></span>
                        <span>
                          <a href={`tel:${profile.contactPhone.replace(/\s/g, "")}`} className="tnum block text-xl font-bold hover:underline">{profile.contactPhone}</a>
                          {profile.phoneHours && <span className="text-sm text-ink-inverse-2">{profile.phoneHours}</span>}
                        </span>
                      </li>
                    )}
                    {profile?.contactEmail && (
                      <li className="flex items-center gap-4 py-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius)] bg-highlight text-on-highlight"><Mail className="size-5" /></span>
                        <span className="font-semibold">{profile.contactEmail}</span>
                      </li>
                    )}
                    {profile?.address && (
                      <li className="flex items-center gap-4 py-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius)] bg-highlight text-on-highlight"><MapPin className="size-5" /></span>
                        <span className="text-ink-inverse-2">{profile.address}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </section>
            );
          case "custom":
            return (
              <section key={s.id} id={s.id} className={`${wrap} scroll-mt-[calc(var(--header-h)+1rem)] pt-20`} data-section={s.kind}>
                <SectionTitle lead={s.lead}>{s.title}</SectionTitle>
                <div className="max-w-[68ch] space-y-4 text-[17px] leading-[1.75] text-ink-2">
                  {s.body.split(/\n{2,}/).filter(Boolean).map((p, i) => (
                    <p key={i} className="whitespace-pre-line">{p}</p>
                  ))}
                </div>
              </section>
            );
          default:
            return null;
        }
      })}

      {tabs.length > 0 && <Steps />}
    </>
  );
}

/* --- Yardımcılar (diğer sayfalar da kullanır) ------------------------------ */

/** Bölümün çizilecek bir şeyi var mı? */
export function sectionHasContent(s: SiteSection, data: StorefrontData, profile: StorefrontProfile | null): boolean {
  switch (s.kind) {
    case "hero":
      return true;
    case "departures":
      return data.todayBoard.rows.length > 0;
    case "tours":
      return data.tours.length > 0;
    case "about":
      return !!profile?.about?.trim();
    case "contact":
      return !!(profile?.contactPhone || profile?.contactEmail || profile?.address);
    case "faq":
      return parseFaq(s.body).length > 0;
    case "reasons":
    case "custom":
      return s.body.trim().length > 0;
    default:
      return (data.modules[s.kind as ModuleKind] ?? []).length > 0;
  }
}

export function isModuleSection(kind: SectionKind): boolean {
  return MODULE_SECTIONS.includes(kind);
}

/** Modül liste sayfaları. */
export const LIST_PATH: Record<string, string> = {
  tours: "/magaza/tur-arama",
  transfers: "/magaza/transferler",
  boats: "/magaza/tekneler",
  villas: "/magaza/villalar",
  visa: "/magaza/vize",
};

const KART_KIND: Record<string, KartKind> = { tours: "tur", transfers: "transfer", boats: "tekne", villas: "villa", visa: "vize" };

/** Menü sekmeleri: açık VE içeriği olan modül bölümleri; her biri kendi liste sayfasına gider. */
export function moduleNavLinks(config: SiteConfig, data: StorefrontData, profile: StorefrontProfile | null): { label: string; href: string }[] {
  return config.sections
    .filter((s) => s.enabled && MODULE_SECTIONS.includes(s.kind) && sectionHasContent(s, data, profile))
    .map((s) => ({ label: s.title, href: LIST_PATH[s.kind] ?? `/magaza#${s.id}` }));
}

/** Arama sekmeleri: menüyle aynı kural, aynı sıra (VITRIN.md §4.2). */
export function searchTabs(config: SiteConfig, data: StorefrontData, profile: StorefrontProfile | null): SearchTab[] {
  return config.sections
    .filter((s) => s.enabled && MODULE_SECTIONS.includes(s.kind) && sectionHasContent(s, data, profile))
    .map((s) => ({ kind: KART_KIND[s.kind], label: s.title, href: LIST_PATH[s.kind] }));
}

/** "Soru?\nCevap" blokları; boş satırla ayrılır. */
export function parseFaq(body: string): { q: string; a: string }[] {
  return body
    .split(/\n{2,}/)
    .map((block) => block.split("\n").map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length >= 2)
    .map((lines) => ({ q: lines[0], a: lines.slice(1).join(" ") }));
}

/** Kapak görseli yüklenene dek kahraman zemini: addan türeyen koyu, sakin bir ton. */
function heroTone(seed: string): string {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `oklch(0.46 0.07 ${h})`;
}

function uniqueByHref(list: KartUrun[]): KartUrun[] {
  return list.filter((r, i, all) => all.findIndex((x) => x.href === r.href) === i);
}

function allCards(data: StorefrontData): KartUrun[] {
  return uniqueByHref([...data.tourCards, ...Object.values(data.modules).flat()]);
}

function cardsFor(s: SiteSection, data: StorefrontData): KartUrun[] {
  const list = s.kind === "tours" ? uniqueByHref(data.tourCards) : (data.modules[s.kind as ModuleKind] ?? []);
  return list.slice(0, s.limit);
}

/** Yayınlanmış ilanların kapaklarından en çok dört kahraman fotoğrafı. */
function slidesFrom(data: StorefrontData): HeroSlide[] {
  const seen = new Set<string>();
  const out: HeroSlide[] = [];
  for (const c of allCards(data)) {
    if (!c.photo || seen.has(c.photo.url)) continue;
    seen.add(c.photo.url);
    out.push({ url: c.photo.url, alt: c.photo.alt || c.title });
    if (out.length === 4) break;
  }
  return out;
}

/* --- Parçalar ---------------------------------------------------------------- */

function SectionTitle({ children, href, lead }: { children: string; href?: string; lead?: string }) {
  return (
    <div data-reveal className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-[1.6rem] leading-tight font-extrabold tracking-tight text-ink sm:text-[2.2rem]">{children}</h2>
        {lead && <p className="mt-2 max-w-[60ch] text-ink-2">{lead}</p>}
      </div>
      {href && (
        <Link href={href} className="btn-arrow flex shrink-0 items-center gap-1.5 font-semibold text-ink underline decoration-2 underline-offset-4 hover:decoration-highlight">
          {t("home.seeAll")} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

function ModuleStrip({ section, items, first, preview }: { section: SiteSection; items: KartUrun[]; first: boolean; preview: boolean }) {
  return (
    <section id={section.id} aria-label={section.title} className={`scroll-mt-[calc(var(--header-h)+1rem)] ${first ? "" : "mt-12"}`} data-section={section.kind}>
      <SectionTitle href={preview ? undefined : LIST_PATH[section.kind]} lead={section.lead}>
        {section.title}
      </SectionTitle>
      <Carousel label={section.title}>
        {items.map((m) => (
          <UrunKarti key={m.id} item={m} sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 82vw" preview={preview} />
        ))}
      </Carousel>
    </section>
  );
}

function Hero({
  name,
  section,
  layout,
  tone,
  tabs,
  slides,
  preview,
}: {
  name: string;
  section: SiteSection;
  layout: "split" | "centered";
  tone: string;
  tabs: SearchTab[];
  slides: HeroSlide[];
  preview: boolean;
}) {
  const title = section.title || t("b2c.tenantTitle", { name });
  const eyebrow = section.body.trim();
  const centered = layout === "centered";
  const L = preview ? "span" : Link;

  return (
    <section id="arama" className={`${wrap} pt-4 sm:pt-6`}>
      <div className="relative isolate overflow-hidden rounded-[var(--radius-xl)]">
        <div className="absolute inset-0 -z-10">
          <HeroSlides slides={slides} tone={tone} />
        </div>
        <div className={`flex min-h-[540px] flex-col justify-center px-5 py-16 sm:min-h-[600px] sm:px-14 lg:px-20 ${centered ? "items-center text-center" : ""}`}>
          {eyebrow && (
            <p className="tab-in mb-4 text-sm font-bold tracking-[0.16em] text-ink-inverse uppercase [text-shadow:var(--text-shadow-hero-sm)]">
              <span aria-hidden="true" className="me-1.5 text-warning-inverse">✦</span>
              {eyebrow}
            </p>
          )}
          <h1 className="max-w-4xl text-[2rem] leading-[1.18] font-extrabold tracking-tight uppercase sm:text-5xl lg:text-[3.4rem]">
            <span className="strip-in block">
              <span className="strip bg-highlight text-on-highlight">{title}</span>
            </span>
            {section.lead && (
              <span className="strip-in mt-1 block text-[0.55em] font-bold tracking-normal normal-case" style={{ animationDelay: "250ms" }}>
                <span className="strip bg-surface text-ink">{section.lead}</span>
              </span>
            )}
          </h1>
          {tabs.length > 0 && (
            <div className={`tab-in relative z-20 mt-8 w-full max-w-[880px] ${centered ? "text-start" : ""}`} style={{ animationDelay: "450ms" }}>
              <HeroSearch tabs={tabs} preview={preview} />
            </div>
          )}
          {tabs.length > 1 && (
            <div className={`tab-in mt-5 flex flex-wrap gap-2 ${centered ? "justify-center" : ""}`} style={{ animationDelay: "600ms" }}>
              {tabs.map((x) => (
                <L
                  key={x.kind}
                  href={x.href}
                  className="rounded-full bg-surface/85 px-4 py-1.5 text-sm font-semibold text-ink backdrop-blur transition-colors hover:bg-highlight hover:text-on-highlight"
                >
                  {x.label}
                </L>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Güven satırı (Seyyah vitrin): üç öğe, dönük kare ikon zeminleri.
 * "Anında talep onayı" sistemin gerçek davranışı; acentenin kendi iddiaları
 * (`trustBadges`) ve iletişim varsa yerel ekip satırı.
 */
function TrustRow({ trustBadges, profile }: { trustBadges: string[]; profile: StorefrontProfile | null }) {
  const items: { Icon: LucideIcon; title: string; body: string }[] = [
    { Icon: Zap, title: t("b2c.trust.instant"), body: t("b2c.trust.instantBody") },
    ...trustBadges.map((b) => ({ Icon: CalendarCheck, title: b, body: t("b2c.trust.claimBody") })),
  ];
  if (profile?.contactPhone || profile?.contactEmail) {
    items.push({
      Icon: Headset,
      title: t("b2c.trust.support"),
      body: profile.contactPhone ? t("b2c.trust.supportBody", { phone: profile.contactPhone }) : t("b2c.trust.supportBodyNoPhone"),
    });
  }
  return (
    <section className={`${wrap} grid gap-8 py-14 sm:grid-cols-2 md:grid-cols-3`} aria-label={t("b2c.footer.trust")}>
      {items.slice(0, 6).map(({ Icon, title, body }, i) => (
        <div key={title} data-reveal style={{ "--d": `${i * 100}ms` } as React.CSSProperties} className="flex gap-5">
          <span className="relative grid size-16 shrink-0 place-items-center">
            <span className="absolute inset-0 rotate-6 rounded-[var(--radius-lg)] bg-highlight" />
            <span className="absolute inset-0 -rotate-3 rounded-[var(--radius-lg)] border-2 border-ink" />
            <Icon className="relative size-7 text-ink" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-ink">{title}</h3>
            <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{body}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-[14px] font-medium text-ink-2 shadow-[var(--shadow-chip)]">
      <span aria-hidden="true" className="font-semibold text-success">✓</span>
      {children}
    </span>
  );
}

/** Platformun gerçek akışı: keşfet → tarih seç → acente onayı. Her acentede aynı. */
function Steps() {
  const steps: { Icon: LucideIcon; title: string; body: string }[] = [
    { Icon: Search, title: t("b2c.steps.1.title"), body: t("b2c.steps.1.body") },
    { Icon: CalendarDays, title: t("b2c.steps.2.title"), body: t("b2c.steps.2.body") },
    { Icon: MailCheck, title: t("b2c.steps.3.title"), body: t("b2c.steps.3.body") },
  ];
  return (
    <section className={`${wrap} pt-20`} aria-label={t("b2c.steps.title")}>
      <SectionTitle>{t("b2c.steps.title")}</SectionTitle>
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map(({ Icon, title, body }, i) => (
          <li
            key={title}
            data-reveal
            style={{ "--d": `${i * 120}ms` } as React.CSSProperties}
            className="group relative overflow-hidden rounded-[var(--radius-lg)] border-2 border-line p-7 transition-colors hover:border-ink"
          >
            <span className="font-display absolute -top-4 right-4 text-[7rem] leading-none text-ink/[0.06] transition-colors group-hover:text-highlight">{i + 1}</span>
            <span className="relative grid size-12 place-items-center rounded-[var(--radius)] bg-inverse text-highlight">
              <Icon className="size-6" />
            </span>
            <h3 className="relative mt-5 text-xl font-bold text-ink">{title}</h3>
            <p className="relative mt-2 leading-relaxed text-ink-2">{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Kategori ızgarası (Seyyah "Destinasyonunuzu seçin" bento'su): tur
 * kategorileri (`facets.kategori`) sayıları ve o kategorideki ilk ilanın
 * fotoğrafıyla; ilk kutu büyük. En az üç kategori yoksa çizilmez.
 */
function CategoryBento({ cards, preview }: { cards: KartUrun[]; preview: boolean }) {
  const map = new Map<string, { count: number; photo: KartUrun["photo"]; tone: string }>();
  for (const c of cards) {
    const cats = c.facets.kategori;
    for (const k of Array.isArray(cats) ? cats : []) {
      const key = String(k);
      const cur = map.get(key);
      if (cur) {
        cur.count += 1;
        if (!cur.photo && c.photo) cur.photo = c.photo;
      } else map.set(key, { count: 1, photo: c.photo, tone: c.tone });
    }
  }
  const cats = [...map.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 8);
  if (cats.length < 3) return null;
  const L = preview ? "span" : Link;
  return (
    <section aria-label={t("b2c.home.categories")} className="pt-20">
      <SectionTitle href={preview ? undefined : LIST_PATH.tours}>{t("b2c.home.categories")}</SectionTitle>
      <ul className="grid grid-flow-dense grid-cols-2 gap-3 [grid-auto-rows:180px] sm:gap-4 sm:[grid-auto-rows:220px] lg:grid-cols-4">
        {cats.map(([name, c], i) => {
          const span = i === 0 ? "col-span-2 row-span-2" : i === 3 ? "lg:col-span-2" : "";
          return (
            <li key={name} data-reveal style={{ "--d": `${(i % 4) * 70}ms` } as React.CSSProperties} className={`min-h-[180px] ${span}`}>
              <L href={`${LIST_PATH.tours}?kategori=${encodeURIComponent(name)}`} className="group relative block h-full overflow-hidden rounded-[var(--radius-lg)]">
                <ProductMedia photo={c.photo} tone={c.tone} sizes={i === 0 ? "(min-width: 1024px) 640px, 100vw" : "(min-width: 1024px) 320px, 50vw"} className="transition-transform duration-[1.4s] ease-out group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-inverse/75 via-inverse/5 to-transparent transition-opacity duration-500 group-hover:opacity-80" />
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-ink-inverse sm:inset-x-5 sm:bottom-5">
                  <span>
                    <span className={`block font-extrabold tracking-tight ${i === 0 ? "text-3xl sm:text-5xl" : "text-xl sm:text-2xl"}`}>{name}</span>
                    <span className="text-sm text-ink-inverse-2">{t("b2c.home.categoryCount", { count: c.count })}</span>
                  </span>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-highlight text-on-highlight transition-transform duration-500 group-hover:-rotate-45">
                    <ArrowRight className="size-5" />
                  </span>
                </div>
              </L>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Kart ızgarası — katalog ve detaydaki benzer ilanlar. */
export function CardGrid({ items, preview = false }: { items: KartUrun[]; preview?: boolean }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((m) => (
        <UrunKarti key={m.id} item={m} preview={preview} />
      ))}
    </div>
  );
}
