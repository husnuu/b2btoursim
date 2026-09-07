import Link from "next/link";
import { SEARCH_RESULTS } from "@/data/mock";
import { t } from "@/lib/i18n";
import { DepartureBoard } from "@/components/b2c/DepartureBoard";
import { ProductCard } from "@/components/b2c/ProductCard";

/** Aynı ürün başlığından tek kart göster; tedarikçi kimliği B2C'de gizli. */
const unique = SEARCH_RESULTS.filter(
  (r, i, all) => all.findIndex((x) => x.productId === r.productId) === i,
);

const departures = [...SEARCH_RESULTS]
  .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  .filter((r, i, all) => all.findIndex((x) => x.productId === r.productId) === i)
  .slice(0, 6);

export default function MagazaPage() {
  return (
    <>
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.05fr_1fr] lg:py-16">
        <div>
          <h1 className="font-dense text-[clamp(2.4rem,5.5vw,4rem)] font-semibold leading-[0.98] tracking-[-0.015em] text-ink">
            {t("b2c.pageTitle", { count: SEARCH_RESULTS.length })}
          </h1>
          <p className="mt-5 max-w-[46ch] text-[length:calc(var(--font-ui)*1.15)] leading-relaxed text-ink-2">
            {t("b2c.heroLead")}
          </p>
        </div>

        <DepartureBoard departures={departures} />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-2">
          <h2 className="font-dense text-xl font-medium text-ink">
            {t("b2c.sectionPopular")}
          </h2>
          <Link
            href="/magaza/tur-arama"
            className="text-[length:var(--font-ui-sm)] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
          >
            {t("home.seeAll")}
          </Link>
        </div>
        <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {unique.map((r, i) => (
            <ProductCard
              key={r.id}
              result={r}
              // Aciliyet rozeti seyrek: yalnız gerçekten az yer kalanda.
              urgent={i === 0 && (r.remaining ?? 99) <= 6}
            />
          ))}
        </div>
      </section>
    </>
  );
}
