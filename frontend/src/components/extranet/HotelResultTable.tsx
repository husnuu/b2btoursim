"use client";

import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import type { SearchResult } from "@/lib/types";
import { PriceTriad } from "@/components/primitives/PriceTriad";
import { SupplierMark } from "@/components/primitives/SupplierMark";

/**
 * Otel sonuç tablosu.
 *
 * Bağlam dokümanı Bölüm 2.2'nin uyarısı burada somutlaşıyor: otel araması
 * tur aramasıyla aynı bileşen değil. Kolonlar oda tipi, pansiyon ve yıldız;
 * saat/süre/dil kolonları anlamsız. Ortak olan tek şey fiyat üçlüsü.
 */

const BOARD_LABEL: Record<string, MessageKey> = {
  room_only: "hotel.board.room_only",
  breakfast: "hotel.board.breakfast",
  half_board: "hotel.board.half_board",
  all_inclusive: "hotel.board.all_inclusive",
};

/** Yıldız: renk taşımayan, ekran okuyucuya sayı olarak verilen işaret. */
function Stars({ count = 0 }: { count?: number }) {
  return (
    <span className="tnum text-[length:var(--font-ui-sm)] text-ink-2">
      <span aria-hidden="true">{"★".repeat(count)}</span>
      <span className="sr-only">{t("hotel.stars", { count })}</span>
    </span>
  );
}

export function HotelResultTable({
  results,
  margins,
  onMarginChange,
}: {
  results: SearchResult[];
  margins: Record<string, number>;
  onMarginChange: (resultId: string, pct: number) => void;
}) {
  const router = useRouter();
  const open = (r: SearchResult) => router.push(`/extranet/urun/${r.productId}`);

  return (
    <table className="w-full border-collapse text-start font-dense">
      <caption className="sr-only">{t("results.marginHint")}</caption>
      <colgroup>
        <col className="w-8" />
        <col />
        <col className="w-24" />
        <col className="w-20" />
        <col className="w-44" />
        <col className="w-36" />
        <col className="w-14" />
        <col className="w-[19rem]" />
        <col className="w-16" />
      </colgroup>

      <thead>
        <tr className="border-b border-line-strong text-[length:var(--font-ui-xs)] text-ink-3">
          <th scope="col" className="p-0" />
          <th scope="col" className="py-1.5 ps-1 text-start font-normal">
            {t("hotel.col.name")}
          </th>
          <th scope="col" className="hidden px-2 py-1.5 text-start font-normal xl:table-cell">
            {t("hotel.col.district")}
          </th>
          <th scope="col" className="px-2 py-1.5 text-start font-normal">
            {t("hotel.col.stars")}
          </th>
          <th scope="col" className="hidden px-2 py-1.5 text-start font-normal lg:table-cell">
            {t("hotel.col.room")}
          </th>
          <th scope="col" className="hidden px-2 py-1.5 text-start font-normal lg:table-cell">
            {t("hotel.col.board")}
          </th>
          <th scope="col" className="px-2 py-1.5 text-start font-normal">
            {t("results.col.supplier")}
          </th>
          <th scope="col" className="py-1.5 pe-2 text-end font-normal">
            <div className="flex items-baseline justify-end gap-3">
              <span className="w-[6.5rem] text-end">{t("results.col.net")}</span>
              <span className="w-[3.75rem] text-end">{t("results.col.margin")}</span>
              <span className="w-[7rem] text-end">{t("results.col.sale")}</span>
            </div>
          </th>
          <th scope="col" className="p-0">
            <span className="sr-only">{t("results.select")}</span>
          </th>
        </tr>
      </thead>

      <tbody>
        {results.map((r) => {
          const margin = margins[r.id] ?? r.defaultMarginPct;
          return (
            <tr
              key={r.id}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target === e.currentTarget) open(r);
              }}
              onDoubleClick={() => open(r)}
              className="row-in group h-[var(--row-h)] border-b border-line
                         hover:bg-action-tint focus:bg-action-tint focus:outline-none
                         focus-visible:shadow-[inset_2px_0_0_0_var(--action-primary)]"
            >
              <td className="p-0 ps-[var(--pad-x)]">
                <span
                  aria-hidden="true"
                  className="block h-5 w-5 rounded-[2px]"
                  style={{ background: r.imageTone }}
                />
              </td>

              <td className="max-w-0 truncate ps-2 pe-3">
                <button
                  type="button"
                  onClick={() => open(r)}
                  className="max-w-full truncate text-start text-[length:var(--font-ui)] text-ink
                             underline decoration-transparent underline-offset-2
                             group-hover:decoration-line-strong hover:decoration-ink"
                >
                  {r.title}
                </button>
              </td>

              <td className="hidden px-2 text-[length:var(--font-ui-sm)] text-ink-2 xl:table-cell">
                {r.district}
              </td>

              <td className="px-2">
                <Stars count={r.stars} />
              </td>

              <td className="hidden truncate px-2 text-[length:var(--font-ui-sm)] text-ink-2 lg:table-cell">
                {r.roomType}
              </td>

              <td className="hidden px-2 text-[length:var(--font-ui-sm)] lg:table-cell">
                <span className={r.board === "room_only" ? "text-ink-3" : "text-ink-2"}>
                  {r.board ? t(BOARD_LABEL[r.board]) : "—"}
                </span>
                {r.cancellation.type === "nonRefundable" && (
                  <span className="ms-2 text-danger">{t("results.noCancel")}</span>
                )}
              </td>

              <td className="px-2">
                <SupplierMark supplier={r.supplier} />
              </td>

              <td className="pe-2">
                <PriceTriad
                  net={r.net}
                  marginPct={margin}
                  onMarginChange={(pct) => onMarginChange(r.id, pct)}
                />
              </td>

              <td className="pe-[var(--pad-x)] text-end">
                <button
                  type="button"
                  onClick={() => open(r)}
                  className="rounded-[var(--radius)] border border-transparent px-2 py-0.5
                             text-[length:var(--font-ui-sm)] text-ink-3
                             group-hover:border-line-strong group-hover:bg-surface group-hover:text-ink
                             focus-visible:border-line-strong focus-visible:bg-surface focus-visible:text-ink"
                >
                  {t("results.select")}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
