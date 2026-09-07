"use client";

import { useState } from "react";
import { formatTime, t } from "@/lib/i18n";
import { SEARCH_RESULTS } from "@/data/mock";
import { PriceTriad, PriceTriadHeader } from "@/components/primitives/PriceTriad";
import { SupplierMark } from "@/components/primitives/SupplierMark";

/**
 * Hero'nun çapası: ürünün gerçek sonuç satırı, çalışır halde.
 *
 * Ekran görüntüsü ya da çizim değil — Extranet'in kullandığı PriceTriad
 * bileşeninin ta kendisi, compact yoğunlukta. Ziyaretçi marjı değiştirir,
 * satış fiyatı döner. Ürünün tek cümlelik vaadi bu satırda görünüyor.
 */

const ROWS = ["r1", "r7", "r5"]
  .map((id) => SEARCH_RESULTS.find((r) => r.id === id)!)
  .filter(Boolean);

export function LivePriceDemo() {
  const [margins, setMargins] = useState<Record<string, number>>(() =>
    Object.fromEntries(ROWS.map((r) => [r.id, r.defaultMarginPct])),
  );

  return (
    <figure
      data-density="compact"
      className="m-0 overflow-hidden rounded-[var(--radius-lg)] border border-line-strong bg-surface"
    >
      <div className="border-b border-line px-3 py-2">
        <span className="font-dense text-[length:var(--font-ui-sm)] text-ink-3">
          {t("site.hero.demoCaption")}
        </span>
      </div>

      <div className="hidden px-3 pt-2 sm:block">
        <div className="flex justify-end">
          <PriceTriadHeader />
        </div>
      </div>

      <ul>
        {ROWS.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-3
                       py-2 last:border-0 sm:h-[var(--row-h)] sm:flex-nowrap sm:py-0"
          >
            <span
              aria-hidden="true"
              className="h-5 w-5 shrink-0 rounded-[2px]"
              style={{ background: r.imageTone }}
            />
            <span className="min-w-0 flex-1 truncate font-dense text-[length:var(--font-ui)] text-ink">
              {r.title}
            </span>
            <span className="tnum shrink-0 font-dense text-[length:var(--font-ui-sm)] text-ink-2">
              {formatTime(r.startsAt)}
            </span>
            <SupplierMark supplier={r.supplier} className="shrink-0" />
            <span className="ms-auto shrink-0">
              <PriceTriad
                net={r.net}
                marginPct={margins[r.id]}
                onMarginChange={(pct) =>
                  setMargins((prev) => ({ ...prev, [r.id]: pct }))
                }
              />
            </span>
          </li>
        ))}
      </ul>

      <figcaption className="border-t border-line bg-paper px-3 py-2 font-dense text-[length:var(--font-ui-sm)] text-ink-2">
        {t("site.hero.demoHint")}
      </figcaption>
    </figure>
  );
}
