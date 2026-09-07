"use client";

import { useRouter } from "next/navigation";
import { formatDuration, formatTime, t } from "@/lib/i18n";
import type { SearchResult } from "@/lib/types";
import { PriceTriad } from "@/components/primitives/PriceTriad";
import { SupplierMark } from "@/components/primitives/SupplierMark";

/**
 * Sonuç listesi — kart değil tablo (Bölüm 3.3).
 *
 * Satır yüksekliği 38px, ekranda 20+ satır. Her nitelik kendi mini
 * kolonunda: operatör bilgiyi tarayarak buluyor, orta noktayla
 * birleştirilmiş meta dizisini okuyarak değil.
 *
 * Klavye: satırlar odaklanabilir, Enter birincil eylemi tetikler.
 */
export function ResultTable({
  results,
  margins,
  onMarginChange,
  sort,
  onSortChange,
}: {
  results: SearchResult[];
  margins: Record<string, number>;
  onMarginChange: (resultId: string, pct: number) => void;
  sort: SortKey;
  onSortChange: (key: SortKey) => void;
}) {
  const router = useRouter();

  const open = (r: SearchResult) => router.push(`/extranet/urun/${r.productId}`);

  return (
    <table className="w-full border-collapse text-start font-dense">
      <caption className="sr-only">{t("results.marginHint")}</caption>
      <colgroup>
        <col className="w-8" />
        <col />
        <col className="w-16" />
        <col className="w-20" />
        <col className="w-20" />
        <col className="w-44" />
        <col className="w-14" />
        <col className="w-[19rem]" />
        <col className="w-16" />
      </colgroup>

      <thead>
        <tr className="border-b border-line-strong text-[length:var(--font-ui-xs)] text-ink-3">
          <th scope="col" className="p-0" />
          <th scope="col" className="py-1.5 ps-1 text-start font-normal">
            {t("results.col.product")}
          </th>
          <th scope="col" className="px-2 py-1.5 text-start font-normal">
            {t("results.col.time")}
          </th>
          <th scope="col" className="hidden px-2 py-1.5 text-start font-normal xl:table-cell">
            {t("results.col.duration")}
          </th>
          <th scope="col" className="hidden px-2 py-1.5 text-start font-normal xl:table-cell">
            {t("results.col.languages")}
          </th>
          <th scope="col" className="hidden px-2 py-1.5 text-start font-normal lg:table-cell">
            {t("results.col.cancellation")}
          </th>
          <th scope="col" className="px-2 py-1.5 text-start font-normal">
            {t("results.col.supplier")}
          </th>
          <th scope="col" className="py-1.5 pe-2 text-end font-normal">
            <div className="flex items-baseline justify-end gap-3">
              <SortHeader
                label={t("results.col.net")}
                width="6.5rem"
                active={false}
              />
              <SortHeader
                label={t("results.col.margin")}
                width="3.75rem"
                active={sort === "margin"}
                onClick={() => onSortChange("margin")}
              />
              <SortHeader
                label={t("results.col.sale")}
                width="7rem"
                active={sort === "sale"}
                onClick={() => onSortChange("sale")}
              />
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

              <td className="tnum px-2 text-[length:var(--font-ui)] text-ink-2">
                {formatTime(r.startsAt)}
              </td>

              <td className="tnum hidden px-2 text-[length:var(--font-ui-sm)] text-ink-2 xl:table-cell">
                {formatDuration(r.durationMinutes)}
              </td>

              <td className="hidden px-2 text-[length:var(--font-ui-sm)] text-ink-2 xl:table-cell">
                {r.languages.join(" ")}
              </td>

              <td className="hidden px-2 text-[length:var(--font-ui-sm)] lg:table-cell">
                {r.cancellation.type === "free" ? (
                  <span className="text-success">
                    {t("results.freeCancel", { hours: r.cancellation.hoursBefore })}
                  </span>
                ) : (
                  <span className="text-ink-3">{t("results.noCancel")}</span>
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
