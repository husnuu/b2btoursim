"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { formatDuration, formatShortDate, formatTime, t } from "@/lib/i18n";
import type { SearchResult } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { useToast } from "@/components/primitives/Toast";
import { PriceTriad } from "@/components/primitives/PriceTriad";

/**
 * Sonuç listesi — kart değil tablo (Bölüm 3.3), "Perfeksiyon" geçişi (1a).
 *
 * Satır yüksekliği 38px, ekranda 20+ satır. Kolon sırası operatörün karar
 * sırasıyla aynı: kalkış → ürün → süre → dil → kontenjan → net → marj →
 * satış → eylem. Tedarikçi kodu ürün adının yanında satır içi rozet;
 * ayrı bir kolon açmaz — pazaryeri satırında kaynak acente adı altına düşer.
 *
 * "Sepete" eylemi onay istemez: satırdaki marj ve aranan katılımcı
 * sayısıyla doğrudan sepete eklenir, "geri al" ile telafi edilir (Bölüm
 * 3.3 geri alınabilir işlem ilkesi). Odaklı satırda Enter aynı eylemi
 * tetikler — klavye ile art arda birden çok satır sepete eklenebilir.
 */
export function ResultTable({
  results,
  margins,
  onMarginChange,
  sort,
  onSortChange,
  adults,
  childCount,
}: {
  results: SearchResult[];
  margins: Record<string, number>;
  onMarginChange: (resultId: string, pct: number) => void;
  sort: SortKey;
  onSortChange: (key: SortKey) => void;
  /** Arama katılımcı sayısı — hızlı "Sepete" eylemi bunu taşır. */
  adults: number;
  childCount: number;
}) {
  const router = useRouter();
  const cart = useCart();
  const { notify } = useToast();
  const seq = useRef(0);

  const open = (r: SearchResult) => router.push(`/extranet/urun/${r.productId}`);

  const addToCart = (r: SearchResult) => {
    const margin = margins[r.id] ?? r.defaultMarginPct;
    const line = {
      id: `${r.id}-${++seq.current}`,
      productId: r.productId,
      // UUID değilse (ör. pazaryeri satırı) checkout kalkış aramaz, geçerli fiyatla açar.
      variantId: r.departureId ?? "",
      title: r.title,
      supplier: r.supplier,
      optionName: r.startsAt ? formatShortDate(r.startsAt) : t("product.remaining", { count: r.remaining ?? 0 }),
      startsAt: r.startsAt,
      pax: { adults, children: childCount },
      net: r.net,
      marginPct: margin,
    };
    cart.add(line);
    notify(t("cart.added", { product: r.title }), () => cart.remove(line.id));
  };

  return (
    <table className="w-full border-collapse text-start font-dense">
      <caption className="sr-only">{t("results.marginHint")}</caption>
      <colgroup>
        <col className="w-14" />
        <col />
        <col className="hidden w-14 lg:table-column" />
        <col className="hidden w-20 lg:table-column" />
        <col className="w-20" />
        <col className="w-[19rem]" />
        <col className="w-20" />
      </colgroup>

      <thead>
        <tr className="border-b border-line-strong text-[length:var(--font-ui-xs)] text-ink-3">
          <th scope="col" className="py-1.5 ps-[var(--pad-x)] text-start font-normal">
            {t("results.col.time")}
          </th>
          <th scope="col" className="px-2 py-1.5 text-start font-normal">
            {t("results.col.product")}
          </th>
          <th scope="col" className="hidden px-2 py-1.5 text-start font-normal lg:table-cell">
            {t("results.col.duration")}
          </th>
          <th scope="col" className="hidden px-2 py-1.5 text-start font-normal lg:table-cell">
            {t("results.col.languages")}
          </th>
          <th scope="col" className="px-2 py-1.5 text-start font-normal">
            {t("results.col.capacity")}
          </th>
          <th scope="col" className="py-1.5 pe-2 text-end font-normal">
            <div className="flex items-baseline justify-end gap-3">
              <SortHeader label={t("results.col.net")} width="6.5rem" active={false} />
              <SortHeader label={t("results.col.margin")} width="3.75rem" active={sort === "margin"} onClick={() => onSortChange("margin")} />
              <SortHeader label={t("results.col.sale")} width="7rem" active={sort === "sale"} onClick={() => onSortChange("sale")} />
            </div>
          </th>
          <th scope="col" className="p-0 pe-[var(--pad-x)]">
            <span className="sr-only">{t("results.addToCart")}</span>
          </th>
        </tr>
      </thead>

      <tbody>
        {results.map((r) => {
          const margin = margins[r.id] ?? r.defaultMarginPct;
          const lowStock = r.remaining != null && r.remaining <= 6;
          return (
            <tr
              key={r.id}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.target !== e.currentTarget) return;
                e.preventDefault();
                addToCart(r);
              }}
              onDoubleClick={() => open(r)}
              className="row-in group h-[var(--row-h)] border-b border-line
                         hover:bg-action-tint focus:bg-action-tint focus:outline-none
                         focus-visible:shadow-[inset_2px_0_0_0_var(--action-primary)]"
            >
              <td className="tnum ps-[var(--pad-x)] pe-2 text-[length:var(--font-ui)] font-medium text-ink">
                {r.startsAt ? formatTime(r.startsAt) : "—"}
              </td>

              <td className="max-w-0 py-1">
                <div className="flex min-w-0 items-center gap-2 pe-3">
                  <button
                    type="button"
                    onClick={() => open(r)}
                    className="max-w-full truncate text-start text-[length:var(--font-ui)] text-ink
                               underline decoration-transparent underline-offset-2
                               group-hover:decoration-line-strong hover:decoration-ink"
                  >
                    {r.title}
                  </button>
                  {r.marketplace ? (
                    <span className="shrink-0 rounded-[2px] bg-action-tint px-1 text-[length:var(--font-ui-xs)] font-semibold text-action">
                      {r.supplier.code}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-[2px] border border-line px-1 text-[length:var(--font-ui-xs)] text-ink-3">
                      {r.supplier.code}
                    </span>
                  )}
                </div>
                {r.marketplace && (
                  <span className="block truncate ps-0.5 text-[length:var(--font-ui-xs)] text-ink-3">
                    {r.marketplace.agencyName}
                  </span>
                )}
              </td>

              <td className="tnum hidden px-2 text-[length:var(--font-ui-sm)] text-ink-2 lg:table-cell">
                {r.durationMinutes > 0 ? formatDuration(r.durationMinutes) : "—"}
              </td>

              <td className="hidden px-2 text-[length:var(--font-ui-sm)] text-ink-2 lg:table-cell">
                {r.languages.join(" ")}
              </td>

              <td className="px-2 text-[length:var(--font-ui-sm)]">
                {r.remaining == null ? (
                  <span className="text-ink-3">—</span>
                ) : lowStock ? (
                  <span className="-rotate-2 inline-block whitespace-nowrap rounded-[2px] border border-warning px-1 text-[length:var(--font-ui-xs)] font-semibold uppercase tracking-wide text-warning">
                    {t("results.lastSpots", { count: r.remaining })}
                  </span>
                ) : (
                  <span className="tnum text-ink-2">{t("results.spotsShort", { count: r.remaining })}</span>
                )}
              </td>

              <td className="pe-2">
                <PriceTriad net={r.net} marginPct={margin} onMarginChange={(pct) => onMarginChange(r.id, pct)} />
              </td>

              <td className="pe-[var(--pad-x)] text-end">
                <button
                  type="button"
                  onClick={() => addToCart(r)}
                  className="rounded-[var(--radius)] border border-line-strong bg-surface px-3 py-1
                             text-[length:var(--font-ui-sm)] font-medium text-ink
                             hover:border-action hover:text-action
                             focus-visible:border-action focus-visible:text-action"
                >
                  {t("results.addToCart")}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export type SortKey = "sale" | "margin";

function SortHeader({
  label,
  width,
  active,
  onClick,
}: {
  label: string;
  width: string;
  active: boolean;
  onClick?: () => void;
}) {
  if (!onClick)
    return (
      <span className="text-end" style={{ width }}>
        {label}
      </span>
    );
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-end ${active ? "font-medium text-ink underline decoration-action decoration-2 underline-offset-4" : "hover:text-ink"}`}
      style={{ width }}
    >
      {label}
    </button>
  );
}
