import type { Metadata } from "next";
import Link from "next/link";
import { AGENCY, SEARCH_RESULTS } from "@/data/mock";
import { t } from "@/lib/i18n";
import { getPublishedSite, getStorefrontData } from "@/lib/site/load";
import type { DepartureRow, TodayBoard } from "@/lib/storefront/departures";
import { getStorefrontProfile } from "@/lib/storefront/profile";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import type { SearchResult } from "@/lib/types";
import { DepartureBoard } from "@/components/b2c/DepartureBoard";
import { ProductCard } from "@/components/b2c/ProductCard";
import { StorefrontHome } from "@/components/b2c/StorefrontHome";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getStorefrontTenant();
  if (!tenant) return { title: `${AGENCY.name} — örnek vitrin` };
  const config = await getPublishedSite(tenant.id);
  return {
    title: config.seo.title || tenant.name,
    description: config.seo.description || undefined,
  };
}

/** Aynı ürün başlığından tek kart; tedarikçi kimliği B2C'de gizli. */
function unique(list: SearchResult[]): SearchResult[] {
  return list.filter((r, i, all) => all.findIndex((x) => x.productId === r.productId) === i);
}

export default async function MagazaPage() {
  const tenant = await getStorefrontTenant();

  if (tenant) {
    const [config, profile] = await Promise.all([getPublishedSite(tenant.id), getStorefrontProfile(tenant.id)]);
    const data = await getStorefrontData(tenant.id, config);
    return <StorefrontHome name={tenant.name} config={config} data={data} profile={profile} />;
  }

  // Örnek vitrin: mock veri, layout banner'la söylüyor.
  const cards = unique(SEARCH_RESULTS);
  const nowIso = new Date().toISOString();
  const rows: DepartureRow[] = unique([...SEARCH_RESULTS].sort((a, b) => a.startsAt.localeCompare(b.startsAt)))
    .slice(0, 6)
    .map((r) => {
      const remaining = r.remaining ?? 0;
      const status: DepartureRow["status"] = r.startsAt < nowIso ? "kalkti" : remaining <= 6 ? "sonKoltuklar" : "musait";
      return { id: r.id, tourId: r.productId, tourSlug: r.productId, title: r.title, startsAt: r.startsAt, remaining, status };
    });
  const board: TodayBoard = { rows, tomorrowNext: null };
  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 py-12 lg:py-16">
        <h1 className="max-w-[16ch] font-dense text-[clamp(2.4rem,5.5vw,4rem)] font-semibold leading-[0.98] tracking-[-0.015em] text-ink">
          {t("b2c.pageTitle", { count: SEARCH_RESULTS.length })}
        </h1>
        <p className="mt-5 max-w-[46ch] text-[length:calc(var(--font-ui)*1.15)] leading-relaxed text-ink-2">
          {t("b2c.heroLead")}
        </p>
      </section>
      <section className="w-full bg-inverse py-10 text-ink-inverse">
        <div className="mx-auto w-full max-w-6xl px-4">
          <DepartureBoard title={t("b2c.boardTitle")} board={board} />
        </div>
      </section>
      <section className="mx-auto mt-4 w-full max-w-6xl px-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-2">
          <h2 className="font-dense text-xl font-medium text-ink">{t("b2c.sectionPopular")}</h2>
          <Link href="/magaza/tur-arama" className="text-[length:var(--font-ui-sm)] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink">
            {t("home.seeAll")}
          </Link>
        </div>
        <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((r, i) => (
            <ProductCard key={r.id} result={r} urgent={i === 0 && (r.remaining ?? 99) <= 6} />
          ))}
        </div>
      </section>
    </>
  );
}
