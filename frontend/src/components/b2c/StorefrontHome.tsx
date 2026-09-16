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
  const departures = uniqueByProduct(
    [...data.tours].filter((r) => r.startsAt).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
  ).slice(0, 6);

  return (
    <>
      {visible.map((s) => {
        switch (s.kind) {
          case "hero":
            return (
              <Hero
                key={s.id}
                name={name}
                section={s}
                layout={config.theme.hero}
                board={config.sections.some((x) => x.kind === "departures" && x.enabled) && departures.length > 0 ? departures : null}
                tursabNo={config.footer.showTursab ? profile?.tursabNo ?? null : null}
              />
            );
          case "departures":
            // Kalkış tablosu kahraman alanının içinde çizilir (bölünmüş düzen);
            // ortalı düzende ayrı bir bölüm olarak.
            return config.theme.hero === "centered" ? (
              <Section key={s.id} section={s}>
                <DepartureBoard departures={departures} />
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
      return data.tours.some((r) => r.startsAt);
    case "tours":
      return data.tours.length > 0;
    case "about":
      return !!profile?.about?.trim();
    case "contact":
      return !!(profile?.contactPhone || profile?.contactEmail || profile?.address);
    case "faq":
      return parseFaq(s.body).length > 0;
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

function uniqueByProduct(list: SearchResult[]): SearchResult[] {
  return list.filter((r, i, all) => all.findIndex((x) => x.productId === r.productId) === i);
}

function Hero({
  name,
  section,
  layout,
  board,
  tursabNo,
}: {
  name: string;
  section: SiteSection;
  layout: "split" | "centered";
  board: SearchResult[] | null;
  /** Yalnız gerçek profil verisinde varsa gösterilir — uydurma bir güvence değil. */
  tursabNo: string | null;
}) {
  const title = section.title || t("b2c.tenantTitle", { name });
  const badges = (
    <div className="mt-7 flex flex-wrap items-center gap-2.5">
      <TrustBadge>{t("b2c.trust.instant")}</TrustBadge>
      {tursabNo && <TrustBadge>{t("b2c.tursab", { no: tursabNo })}</TrustBadge>}
    </div>
  );

  if (layout === "centered" || !board) {
    return (
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_1100px_420px_at_50%_-10%,var(--action-primary-tint),transparent_70%)] px-4 py-16 text-center lg:py-24">
        <h1 className="mx-auto max-w-[18ch] font-dense text-[clamp(2.4rem,5.5vw,4.2rem)] font-semibold leading-[0.98] tracking-[-0.015em] text-ink">
          {title}
        </h1>
        {section.lead && (
          <p className="mx-auto mt-5 max-w-[52ch] text-[length:calc(var(--font-ui)*1.15)] leading-relaxed text-ink-2">
            {section.lead}
          </p>
        )}
        <div className="flex justify-center">{badges}</div>
      </section>
    );
  }
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(ellipse_900px_500px_at_85%_-15%,var(--action-primary-tint),transparent_65%)]">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.05fr_1fr] lg:py-16">
        <div>
          <h1 className="font-dense text-[clamp(2.4rem,5.5vw,4.2rem)] font-semibold leading-[0.98] tracking-[-0.015em] text-ink">
            {title}
          </h1>
          {section.lead && (
            <p className="mt-5 max-w-[46ch] text-[length:calc(var(--font-ui)*1.15)] leading-relaxed text-ink-2">
              {section.lead}
            </p>
          )}
          {badges}
        </div>
        <DepartureBoard departures={board} />
      </div>
    </section>
  );
}

function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[length:var(--font-ui-sm)] text-ink-2 shadow-[var(--shadow-raised)]">
      <span aria-hidden="true" className="font-semibold text-success">✓</span>
      {children}
    </span>
  );
}

function Section({
  section,
  more,
  bleed = false,
  children,
}: {
  section: SiteSection;
  more?: string;
  /** Modül vitrinleri gibi yatay kaydırılan içerik: alt kapsayıcı kendi taşmasını yönetir. */
  bleed?: boolean;
  children: React.ReactNode;
}) {
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
          <p className="tnum mt-0.5 text-[length:var(--font-ui)] font-medium text-ink">{formatMoney(item.price, item.currency)}</p>
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

/** Aynı kart, ana sayfada yatay kaydırılan bir şerit olarak — 2b modül vitrini. */
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
