import Link from "next/link";
import { formatMoney, t } from "@/lib/i18n";
import { MODULE_SECTIONS, type SectionKind, type SiteConfig, type SiteSection } from "@/lib/site/config";
import type { ModuleItem, StorefrontData } from "@/lib/site/load";
import type { StorefrontProfile } from "@/lib/storefront/profile";
import type { SearchResult } from "@/lib/types";
import { DepartureBoard } from "./DepartureBoard";
import { ProductCard } from "./ProductCard";

/**
 * Ana sayfa: `config.sections` sırasıyla çizilir.
 *
 * Kural: bölümün AÇIK olması yetmez, içeriği de olmalı. Tekne bölümü açık
 * ama yayında tekne yoksa hiç çizilmez — müşteriye boş ızgara gösterilmez.
 * Editör aynı kuralı "boş, gizlenecek" etiketiyle söyler.
 */
export function StorefrontHome({
  name,
  config,
  data,
  profile,
  preview = false,
}: {
  name: string;
  config: SiteConfig;
  data: StorefrontData;
  profile: StorefrontProfile | null;
  preview?: boolean;
}) {
  const visible = config.sections.filter((s) => s.enabled && sectionHasContent(s, data, profile));

  return (
    <>
      {visible.map((s) => {
        switch (s.kind) {
          case "hero":
            return (
              <div key={s.id}>
                <Hero
                  name={name}
                  section={s}
                  layout={config.theme.hero}
                  tone={heroTone(name)}
                  preview={preview}
                />
                <TrustStrip
                  tursabNo={config.footer.showTursab ? profile?.tursabNo ?? null : null}
                  trustBadges={config.theme.trustBadges}
                />
              </div>
            );
          case "departures":
            // Bugünün tüm programı — kalkmış, son koltuklu ve müsait olanlar birlikte.
            // Başlığı bandın kendisi taşır, o yüzden Section başlıksız çizer.
            return data.todayBoard.rows.length > 0 ? (
              <Section key={s.id} section={s} bleed dark>
                <DepartureBoard title={s.title} board={data.todayBoard} />
              </Section>
            ) : null;
          case "tours":
            return (
              <Section key={s.id} section={s} more={preview ? undefined : "/magaza/tur-arama"}>
                <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  {uniqueByProduct(data.tours).slice(0, s.limit).map((r, i) => (
                    <ProductCard key={r.id} result={r} urgent={i === 0 && (r.remaining ?? 99) <= 6} />
                  ))}
                </div>
              </Section>
            );
          case "transfers":
          case "boats":
          case "villas":
          case "visa":
            return (
              <Section key={s.id} section={s} more={preview ? undefined : LIST_PATH[s.kind]} bleed>
                <ModuleCarousel items={(data.modules[s.kind] ?? []).slice(0, s.limit)} />
              </Section>
            );
          case "about":
            return (
              <Section key={s.id} section={s}>
                <div className="max-w-[68ch] rounded-[var(--radius-lg)] border border-line bg-surface p-6">
                  <p className="whitespace-pre-line text-[length:calc(var(--font-ui)*1.1)] leading-relaxed text-ink-2">
                    {profile?.about}
                  </p>
                </div>
              </Section>
            );
          case "reasons":
            return (
              <Section key={s.id} section={s}>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {parseFaq(s.body).map((r, i) => (
                    <div key={r.q} className="flex gap-4">
                      <span className="font-dense text-2xl font-semibold tabular-nums text-action">{String(i + 1).padStart(2, "0")}</span>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-[length:var(--font-ui)] font-medium text-ink">{r.q}</h3>
                        <p className="text-[length:var(--font-ui-sm)] leading-relaxed text-ink-2">{r.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            );
          case "faq":
            return (
              <Section key={s.id} section={s}>
                <dl className="max-w-[72ch] divide-y divide-line border-y border-line">
                  {parseFaq(s.body).map((qa) => (
                    <div key={qa.q} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,18rem)_1fr] sm:gap-6">
                      <dt className="font-medium text-ink">{qa.q}</dt>
                      <dd className="text-ink-2">{qa.a}</dd>
                    </div>
                  ))}
                </dl>
              </Section>
            );
          case "contact":
            return (
              <Section key={s.id} section={s}>
                <div className="flex flex-col gap-2 text-ink-2">
                  {profile?.contactPhone && (
                    <p>
                      <a href={`tel:${profile.contactPhone.replace(/\s/g, "")}`} className="tnum font-dense text-xl font-semibold text-ink">
                        {profile.contactPhone}
                      </a>
                      {profile.phoneHours && <span className="ms-3 text-[length:var(--font-ui-sm)]">{profile.phoneHours}</span>}
                    </p>
                  )}
                  {profile?.contactEmail && <p>{profile.contactEmail}</p>}
                  {profile?.address && <p>{profile.address}</p>}
                </div>
              </Section>
            );
          case "custom":
            return (
              <Section key={s.id} section={s}>
                <div className="max-w-[68ch] space-y-4 leading-relaxed text-ink-2">
                  {s.body.split(/\n{2,}/).filter(Boolean).map((p, i) => (
                    <p key={i} className="whitespace-pre-line">{p}</p>
                  ))}
                </div>
              </Section>
            );
        }
      })}
    </>
  );
}

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
      return (data.modules[s.kind as Exclude<SectionKind, "tours">] ?? []).length > 0;
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

/** Menü sekmeleri: açık VE içeriği olan modül bölümleri; her biri kendi liste sayfasına gider. */
export function moduleNavLinks(config: SiteConfig, data: StorefrontData, profile: StorefrontProfile | null): { label: string; href: string }[] {
  return config.sections
    .filter((s) => s.enabled && MODULE_SECTIONS.includes(s.kind) && sectionHasContent(s, data, profile))
    .map((s) => ({ label: s.title, href: LIST_PATH[s.kind] ?? `/magaza#${s.id}` }));
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

function uniqueByProduct(list: SearchResult[]): SearchResult[] {
  return list.filter((r, i, all) => all.findIndex((x) => x.productId === r.productId) === i);
}

function Hero({
  name,
  section,
  layout,
  tone,
  preview,
}: {
  name: string;
  section: SiteSection;
  layout: "split" | "centered";
  /** Kapak görseli yüklenene dek zemin: kiracıdan türeyen sakin bir ton. */
  tone: string;
  preview: boolean;
}) {
  const title = section.title || t("b2c.tenantTitle", { name });
  const eyebrow = section.body.trim();

  return (
    <section className="relative">
      {/* Kahraman: görsel yerine kiracıya özgü ton + aynı karartma; fotoğraf
          yüklendiğinde bu katmanın altına girer, tipografi değişmez. */}
      <div
        className={`relative flex items-end overflow-hidden ${layout === "centered" ? "min-h-[26rem] justify-center text-center" : "min-h-[32rem]"}`}
        style={{ background: tone }}
      >
        <span aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: "var(--image-hero-scrim)" }} />
        <div
          className={`relative mx-auto flex w-full max-w-6xl flex-col gap-3.5 px-4 pb-14 pt-20 sm:pb-28 ${
            layout === "centered" ? "items-center" : ""
          }`}
        >
          {eyebrow && (
            <span className="text-[length:var(--font-ui-sm)] font-semibold uppercase tracking-[0.16em] text-white [text-shadow:var(--text-shadow-hero-sm)]">
              <span aria-hidden="true" className="me-1.5 text-warning-inverse">✦</span>
              {eyebrow}
            </span>
          )}
          <h1
            className={`text-balance font-dense text-[clamp(2.75rem,6.4vw,4.75rem)] font-semibold uppercase leading-[0.98] tracking-[0.01em] text-white [text-shadow:var(--text-shadow-hero)] ${
              layout === "centered" ? "max-w-[20ch]" : "max-w-[16ch]"
            }`}
          >
            {title}
          </h1>
          {section.lead && (
            <p className="max-w-[46ch] text-[length:calc(var(--font-ui)*1.15)] leading-relaxed text-white [text-shadow:var(--text-shadow-hero-sm)]">
              {section.lead}
            </p>
          )}
        </div>
      </div>

      {/* Arama kartı kahramanın alt kenarına taşar: sayfanın ikinci durağı.
          Dar ekranda taşma yok — alanlar alt alta dizildiğinde kart yüksek
          olur ve altındaki şeridi örterdi; orada akışta durur. */}
      <div className="pointer-events-none relative z-10 -mt-8 px-4 sm:absolute sm:inset-x-0 sm:bottom-0 sm:mt-0 sm:translate-y-1/2">
        <SearchBar preview={preview} />
      </div>
    </section>
  );
}

/**
 * Vitrin arama çubuğu — üç alan tek hap: Nereye / Tarih / Kişi.
 *
 * Tarayıcının kendi GET gönderimi yeter; istemci bileşeni yok. Üç alan da
 * sonuç sayfasında gerçekten filtreler (bkz. StoreSearchResults), süs değil.
 */
function SearchBar({ preview }: { preview: boolean }) {
  return (
    <form
      action={preview ? undefined : "/magaza/tur-arama"}
      className="pointer-events-auto mx-auto flex w-full max-w-[55rem] flex-col gap-1 rounded-[var(--radius-lg)] border border-line bg-surface p-2.5 shadow-[var(--shadow-float)]
                 sm:h-[4.375rem] sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-0 sm:pe-2.5 sm:ps-1.5"
    >
      <SearchField label={t("search.destination")} grow="sm:flex-[1.35]" icon={<PinIcon />}>
        <input
          name="nereye"
          disabled={preview}
          placeholder={t("b2c.searchPlaceholder")}
          className="w-full bg-transparent text-[length:var(--font-ui)] text-ink outline-none placeholder:text-ink-3"
        />
      </SearchField>
      <Divider />
      <SearchField label={t("search.date")} grow="sm:flex-1" icon={<CalendarIcon />}>
        <input
          type="date"
          name="tarih"
          disabled={preview}
          className="tnum w-full bg-transparent text-[length:var(--font-ui)] text-ink outline-none"
        />
      </SearchField>
      <Divider />
      <SearchField label={t("b2c.searchPax")} grow="sm:flex-[0.9]" icon={<PersonIcon />}>
        <select
          name="kisi"
          defaultValue="2"
          disabled={preview}
          className="w-full cursor-pointer appearance-none bg-transparent text-[length:var(--font-ui)] text-ink outline-none"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>
              {t("b2c.searchPaxCount", { count: n })}
            </option>
          ))}
        </select>
      </SearchField>
      <button
        type="submit"
        disabled={preview}
        aria-label={t("search.submit")}
        className="grid h-12 w-full shrink-0 place-items-center rounded-full bg-action text-on-action transition-transform
                   hover:bg-action-hover hover:scale-[1.04] disabled:pointer-events-none sm:h-[3.375rem] sm:w-[3.375rem]"
      >
        <SearchIcon />
      </button>
    </form>
  );
}

function SearchField({
  label,
  icon,
  grow,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  grow: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-full px-4 py-2 transition-colors hover:bg-paper sm:self-stretch sm:px-6 ${grow}`}>
      <span className="shrink-0 text-ink-3">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[length:var(--font-ui-xs)] font-semibold text-ink">{label}</span>
        {children}
      </span>
    </label>
  );
}

function Divider() {
  return <span aria-hidden="true" className="hidden h-[2.125rem] w-px shrink-0 bg-line sm:block" />;
}

function SearchIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4.8-4.8" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  );
}
function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

/**
 * Güven şeridi — kahramanın altında, taşan arama çubuğunu kucaklayan
 * kağıt zemin. Üst boşluk çubuğun yarısını karşılar.
 */
function TrustStrip({ tursabNo, trustBadges }: { tursabNo: string | null; trustBadges: string[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 border-b border-line bg-paper px-4 pb-5 pt-10 sm:pt-20">
      {/* Sistemin gerçek davranışı — her acentede aynı, editörde değişmez. */}
      <TrustBadge>{t("b2c.trust.instant")}</TrustBadge>
      {trustBadges.map((b) => (
        <TrustBadge key={b}>{b}</TrustBadge>
      ))}
      {tursabNo && <TrustBadge>{t("b2c.tursab", { no: tursabNo })}</TrustBadge>}
    </div>
  );
}

function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 rounded-full border border-line bg-surface px-4.5 py-2.5 text-[length:var(--font-ui-sm)] text-ink-2 shadow-[var(--shadow-chip)]">
      <span aria-hidden="true" className="font-semibold text-success">✓</span>
      {children}
    </span>
  );
}

function Section({
  section,
  more,
  bleed = false,
  dark = false,
  children,
}: {
  section: SiteSection;
  more?: string;
  /** Modül vitrinleri gibi yatay kaydırılan içerik: alt kapsayıcı kendi taşmasını yönetir. */
  bleed?: boolean;
  /** "Bugünün kalkışları" bandı gibi tam-genişlik koyu zemin. */
  dark?: boolean;
  children: React.ReactNode;
}) {
  if (dark) {
    return (
      <section id={section.id} className="mt-14 w-full scroll-mt-16 bg-inverse pb-12 pt-11 text-ink-inverse" data-section={section.kind}>
        <div className="mx-auto w-full max-w-6xl px-4">{children}</div>
      </section>
    );
  }
  return (
    <section id={section.id} className="mx-auto mt-14 w-full max-w-6xl scroll-mt-16" data-section={section.kind}>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-4 pb-2.5">
        <div>
          <h2 className="font-dense text-[length:clamp(1.35rem,2.4vw,1.7rem)] font-semibold tracking-tight text-ink">{section.title}</h2>
          {section.lead && <p className="mt-1 max-w-[60ch] text-[length:var(--font-ui-sm)] text-ink-2">{section.lead}</p>}
        </div>
        {more && (
          <Link href={more} className="whitespace-nowrap text-[length:var(--font-ui-sm)] font-medium text-ink underline decoration-line-strong underline-offset-2 hover:text-ink">
            {t("home.seeAll")}
          </Link>
        )}
      </div>
      <div className={bleed ? "mt-6" : "mt-6 px-4"}>{children}</div>
    </section>
  );
}

function ModuleCardBody({ item }: { item: ModuleItem }) {
  return (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-lg)]" style={{ background: item.tone }}>
        <span aria-hidden="true" className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: "var(--image-sheen)" }} />
      </div>
      <div className="flex flex-col gap-0.5 px-0.5">
        <h3 className="font-dense text-[length:calc(var(--font-ui)*1.1)] font-medium leading-snug text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">{item.title}</h3>
        {item.subtitle && <p className="text-[length:var(--font-ui-sm)] text-ink-2">{item.subtitle}</p>}
        {item.price != null && item.price > 0 && (
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <span className="tnum text-[length:var(--font-ui)] font-semibold text-warning">{formatMoney(item.price, item.currency)}</span>
            <span className="text-[length:var(--font-ui-sm)] font-medium text-ink underline decoration-line-strong underline-offset-2">{t("b2c.viewDetail")}</span>
          </div>
        )}
      </div>
    </>
  );
}

/** Tur dışındaki modüller için kart ızgarası — tam liste sayfalarında (Tekneler, Villalar…). */
export function ModuleGrid({ items }: { items: ModuleItem[] }) {
  return (
    <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((m) => (
        <article key={m.id} className="group flex flex-col gap-3">
          <Link href={m.href} className="flex flex-col gap-3">
            <ModuleCardBody item={m} />
          </Link>
        </article>
      ))}
    </div>
  );
}

/** Aynı kart, ana sayfada yatay kaydırılan bir şerit olarak — 2a modül vitrini. */
function ModuleCarousel({ items }: { items: ModuleItem[] }) {
  return (
    <div className="flex gap-5 overflow-x-auto px-4 pb-2 [scroll-snap-type:x_mandatory] [scrollbar-width:none]">
      {items.map((m) => (
        <article key={m.id} className="group flex w-64 shrink-0 flex-col gap-3 [scroll-snap-align:start]">
          <Link href={m.href} className="flex flex-col gap-3">
            <ModuleCardBody item={m} />
          </Link>
        </article>
      ))}
    </div>
  );
}
