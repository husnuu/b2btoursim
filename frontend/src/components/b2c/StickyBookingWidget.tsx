"use client";

import { useState } from "react";
import { formatMoney, formatTime, t } from "@/lib/i18n";
import { salePrice, type Product } from "@/lib/types";
import { Button } from "@/components/primitives/Button";

/**
 * Bölüm 4: masaüstünde sağda yapışkan rezervasyon paneli, mobilde ekranın
 * altında sabit fiyat + CTA çubuğu. Dönüşüm üzerindeki en yüksek etkili
 * desen; MVP'de var.
 *
 * B2C perakende marjı sunucudan gelir ve kullanıcıya hiç gösterilmez —
 * burada yalnızca satış fiyatı var.
 */
export function StickyBookingWidget({
  product,
  retailMarginPct,
}: {
  product: Product;
  retailMarginPct: number;
}) {
  const [optionId, setOptionId] = useState(product.variants[0].id);
  const [pax, setPax] = useState(2);
  const option = product.variants.find((v) => v.id === optionId)!;
  const unit = salePrice(option.basePrice, retailMarginPct);

  return (
    <>
      {/* Masaüstü: yapışkan panel */}
      <aside className="hidden lg:block">
        <div className="sticky top-6 rounded-[var(--radius-lg)] border border-line-strong bg-surface p-5">
          <p className="flex items-baseline gap-2">
            <span className="tnum text-3xl font-semibold text-ink">
              {formatMoney(unit)}
            </span>
            <span className="text-[length:var(--font-ui-sm)] text-ink-2">
              {t("common.perPerson")}
            </span>
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[length:var(--font-ui-sm)] text-ink-2">
                {t("product.options")}
              </span>
              <select
                value={optionId}
                onChange={(e) => setOptionId(e.target.value)}
                className="h-11 rounded-[var(--radius)] border border-line-strong bg-surface px-2.5
                           text-[length:var(--font-ui)] text-ink outline-none focus:border-action"
              >
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — {formatTime(v.startsAt)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[length:var(--font-ui-sm)] text-ink-2">
                {t("search.pax")}
              </span>
              <input
                type="number"
                min={1}
                max={option.quantityAvailable}
                value={pax}
                onChange={(e) => setPax(Number(e.target.value))}
                className="tnum h-11 rounded-[var(--radius)] border border-line-strong bg-surface px-2.5
                           text-[length:var(--font-ui)] text-ink outline-none focus:border-action"
              />
            </label>
          </div>

          <dl className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
            <dt className="text-ink-2">{t("common.total")}</dt>
            <dd className="tnum text-xl font-semibold text-ink">
              {formatMoney(unit * pax)}
            </dd>
          </dl>

          <Button variant="primary" size="lg" className="mt-4 w-full">
            {t("b2c.bookNow")}
          </Button>

          {product.cancellation.type === "free" && (
            <p className="mt-3 text-[length:var(--font-ui-sm)] text-success">
              {t("results.freeCancel", { hours: product.cancellation.hoursBefore })}
            </p>
          )}
        </div>
      </aside>

      {/* Mobil: alt sabit çubuk */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-4 py-3 lg:hidden">
        <div className="flex items-center gap-4">
          <p className="flex flex-col leading-tight">
            <span className="tnum text-lg font-semibold text-ink">
              {formatMoney(unit)}
            </span>
            <span className="text-[length:var(--font-ui-sm)] text-ink-2">
              {t("common.perPerson")}
            </span>
          </p>
          <Button variant="primary" size="lg" className="ms-auto flex-1">
            {t("b2c.bookNow")}
          </Button>
        </div>
      </div>
    </>
  );
}
