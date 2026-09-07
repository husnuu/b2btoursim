import Link from "next/link";
import { notFound } from "next/navigation";
import { PRODUCTS } from "@/data/mock";
import { formatDuration, t } from "@/lib/i18n";
import { OptionPicker } from "@/components/extranet/OptionPicker";
import { SupplierMark } from "@/components/primitives/SupplierMark";

export default async function UrunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = PRODUCTS[id];
  if (!product) notFound();

  return (
    <div className="mx-auto w-full max-w-[86rem] px-[var(--pad-x)] py-5">
      <Link
        href="/extranet/arama?nereye=Kapadokya&tarih=2026-09-18"
        className="text-[length:var(--font-ui-sm)] text-ink-3 underline decoration-line-strong underline-offset-2 hover:text-ink"
      >
        {t("product.back")}
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div className="min-w-0">
          <h1 className="text-xl font-medium text-ink">{product.title}</h1>
          <p className="mt-1 max-w-[70ch] text-ink-2">{product.summary}</p>
        </div>
        <dl className="grid shrink-0 grid-cols-[auto_auto] items-baseline gap-x-4 gap-y-1 text-[length:var(--font-ui-sm)]">
          <dt className="text-ink-3">{t("results.col.supplier")}</dt>
          <dd>
            <SupplierMark supplier={product.supplier} showName />
          </dd>
          <dt className="text-ink-3">{t("product.supplierRef")}</dt>
          <dd className="tnum text-ink">{product.supplierRef}</dd>
          <dt className="text-ink-3">{t("results.col.duration")}</dt>
          <dd className="tnum text-ink">{formatDuration(product.durationMinutes)}</dd>
          <dt className="text-ink-3">{t("results.col.languages")}</dt>
          <dd className="text-ink">{product.languages.join(" ")}</dd>
        </dl>
      </header>

      <section className="mt-6">
        <h2 className="mb-2 font-dense text-base font-medium text-ink">
          {t("product.options")}
        </h2>
        <OptionPicker product={product} />
      </section>

      <div className="mt-8 grid gap-8 border-t border-line pt-6 md:grid-cols-3">
        <section>
          <h2 className="mb-2 font-dense text-[length:var(--font-ui)] font-medium text-ink">
            {t("product.includes")}
          </h2>
          <ul className="space-y-1 text-ink-2">
            {product.includes.map((x) => (
              <li key={x} className="flex gap-2">
                <span aria-hidden="true" className="text-success">
                  ✓
                </span>
                {x}
              </li>
            ))}
          </ul>
          <h2 className="mb-2 mt-5 font-dense text-[length:var(--font-ui)] font-medium text-ink">
            {t("product.excludes")}
          </h2>
          <ul className="space-y-1 text-ink-2">
            {product.excludes.map((x) => (
              <li key={x} className="flex gap-2">
                <span aria-hidden="true" className="text-ink-3">
                  ✕
                </span>
                {x}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-dense text-[length:var(--font-ui)] font-medium text-ink">
            {t("product.meetingPoint")}
          </h2>
          <p className="max-w-[55ch] text-ink-2">{product.meetingPoint}</p>
        </section>

        <section>
          <h2 className="mb-2 font-dense text-[length:var(--font-ui)] font-medium text-ink">
            {t("product.policy")}
          </h2>
          <p className="max-w-[55ch] text-ink-2">
            {product.cancellation.type === "free"
              ? t("results.freeCancel", { hours: product.cancellation.hoursBefore })
              : t("results.noCancel")}
          </p>
        </section>
      </div>
    </div>
  );
}
