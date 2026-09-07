import { notFound } from "next/navigation";
import { getProduct, SEARCH_RESULTS } from "@/data/mock";
import { formatDuration, formatNumber, t } from "@/lib/i18n";
import { StickyBookingWidget } from "@/components/b2c/StickyBookingWidget";

/** SSR/ISR: B2C sayfaları organik trafiğe açık (Bölüm 8). */
export const revalidate = 3600;

export function generateStaticParams() {
  return [...new Set(SEARCH_RESULTS.map((r) => r.productId))].map((id) => ({ id }));
}

export default async function MagazaUrunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-8 lg:pb-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          <h1 className="max-w-[20ch] font-dense text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-[1.02] tracking-[-0.01em] text-ink">
            {product.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-[length:var(--font-ui)] text-ink-2">
            <span className="tnum flex items-baseline gap-2">
              <b className="font-medium text-ink">
                {product.rating.toLocaleString("tr-TR", { minimumFractionDigits: 1 })}
              </b>
              <span>{t("b2c.reviews", { count: formatNumber(product.reviewCount) })}</span>
            </span>
            <span className="tnum">{formatDuration(product.durationMinutes)}</span>
            <span>{t("b2c.languages", { languages: product.languages.join(", ") })}</span>
          </div>

          <div
            className="mt-6 aspect-[16/9] w-full rounded-[var(--radius-lg)]"
            style={{
              background: product.imageTone,
              backgroundImage: "var(--image-sheen-wide)",
            }}
          />

          <p className="mt-8 max-w-[68ch] text-[length:calc(var(--font-ui)*1.1)] leading-relaxed text-ink-2">
            {product.summary}
          </p>

          <div className="mt-10 grid gap-8 border-t border-line pt-8 sm:grid-cols-2">
            <section>
              <h2 className="mb-2 font-dense text-lg font-medium text-ink">
                {t("product.includes")}
              </h2>
              <ul className="space-y-1 text-ink-2">
                {product.includes.map((x) => (
                  <li key={x} className="flex gap-2">
                    <span aria-hidden="true" className="text-success">✓</span>
                    {x}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="mb-2 font-dense text-lg font-medium text-ink">
                {t("product.meetingPoint")}
              </h2>
              <p className="max-w-[50ch] text-ink-2">{product.meetingPoint}</p>
              <h2 className="mb-2 mt-6 font-dense text-lg font-medium text-ink">
                {t("product.policy")}
              </h2>
              <p className="max-w-[50ch] text-ink-2">
                {product.cancellation.type === "free"
                  ? t("results.freeCancel", { hours: product.cancellation.hoursBefore })
                  : t("results.noCancel")}
              </p>
            </section>
          </div>
        </div>

        <StickyBookingWidget product={product} retailMarginPct={22} />
      </div>
    </div>
  );
}
