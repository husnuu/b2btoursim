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
            return <Hero key={s.id} name={name} section={s} layout={config.theme.hero} board={config.sections.some((x) => x.kind === "departures" && x.enabled) && departures.length > 0 ? departures : null} />;
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
              <Section key={s.id} section={s} more={preview ? undefined : LIST_PATH[s.kind]}>
                <ModuleGrid items={(data.modules[s.kind] ?? []).slice(0, s.limit)} />
              </Section>
            );
          case "about":
            return (
              <Section key={s.id} section={s}>
                <p className="max-w-[68ch] whitespace-pre-line text-[length:calc(var(--font-ui)*1.1)] leading-relaxed text-ink-2">
                  {profile?.about}
                </p>
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
}: {
  name: string;
  section: SiteSection;
  layout: "split" | "centered";
  board: SearchResult[] | null;
}) {
  const title = section.title || t("b2c.tenantTitle", { name });
  if (layout === "centered" || !board) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-14 text-center lg:py-20">
        <h1 className="mx-auto max-w-[18ch] font-dense text-[clamp(2.4rem,5.5vw,4rem)] font-semibold leading-[0.98] tracking-[-0.015em] text-ink">
          {title}
        </h1>
        {section.lead && (
          <p className="mx-auto mt-5 max-w-[52ch] text-[length:calc(var(--font-ui)*1.15)] leading-relaxed text-ink-2">
            {section.lead}
          </p>
        )}
      </section>
    );
  }
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.05fr_1fr] lg:py-16">
      <div>
        <h1 className="font-dense text-[clamp(2.4rem,5.5vw,4rem)] font-semibold leading-[0.98] tracking-[-0.015em] text-ink">
          {title}
        </h1>
        {section.lead && (
          <p className="mt-5 max-w-[46ch] text-[length:calc(var(--font-ui)*1.15)] leading-relaxed text-ink-2">
            {section.lead}
          </p>
        )}
      </div>
      <DepartureBoard departures={board} />
    </section>
  );
}

function Section({ section, more, children }: { section: SiteSection; more?: string; children: React.ReactNode }) {
  return (
    <section id={section.id} className="mx-auto mt-12 w-full max-w-6xl scroll-mt-16 px-4" data-section={section.kind}>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-2">
        <div>
          <h2 className="font-dense text-xl font-medium text-ink">{section.title}</h2>
          {section.lead && <p className="mt-1 max-w-[60ch] text-[length:var(--font-ui-sm)] text-ink-2">{section.lead}</p>}
        </div>
        {more && (
          <Link href={more} className="text-[length:var(--font-ui-sm)] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink">
            {t("home.seeAll")}
          </Link>
        )}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Tur dışındaki modüller için kart: ad, alt bilgi, fiyat; detay sayfasına gider. */
export function ModuleGrid({ items }: { items: ModuleItem[] }) {
  return (
    <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((m) => (
        <article key={m.id} className="group flex flex-col">
          <Link href={m.href} className="flex flex-col gap-3">
            <div className="aspect-[4/3] w-full rounded-[var(--radius-lg)]" style={{ background: m.tone, backgroundImage: "var(--image-sheen)" }} />
            <div>
              <h3 className="text-[length:calc(var(--font-ui)*1.1)] font-medium leading-snug text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">{m.title}</h3>
              {m.subtitle && <p className="mt-0.5 text-[length:var(--font-ui-sm)] text-ink-2">{m.subtitle}</p>}
              {m.price != null && m.price > 0 && (
                <p className="tnum mt-1 text-[length:var(--font-ui)] text-ink">{formatMoney(m.price, m.currency)}</p>
              )}
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
