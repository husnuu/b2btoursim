"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { expandedBookings } from "@/data/mock";
import { formatMoney, formatShortDate, t } from "@/lib/i18n";
import {
  bookingQuantity,
  marginAmount,
  primaryItem,
  salePrice,
  type Booking,
} from "@/lib/types";
import { BOOKING_STATUSES } from "@/lib/booking-status";
import { useVirtualRows } from "@/lib/use-virtual-rows";
import { useSearchHotkey } from "@/lib/use-shortcuts";
import { StatusBadge } from "@/components/primitives/StatusBadge";
import { SupplierMark } from "@/components/primitives/SupplierMark";
import { FilterChipBar, type ChipDef } from "@/components/primitives/FilterChipBar";
import { EmptyState } from "@/components/primitives/States";

const ROW_H = 38;
const ALL = expandedBookings(500);

type SortField = "ref" | "customer" | "travelDate" | "status" | "sale";

const STATUS_CHIPS: ChipDef[] = [
  { id: "pending", label: "status.pending" },
  { id: "confirmed", label: "status.confirmed" },
  { id: "partiallyCancelled", label: "status.partiallyCancelled" },
  { id: "cancelled", label: "status.cancelled" },
  { id: "completed", label: "status.completed" },
];

/** Bir rezervasyonun satış toplamı — liste ve sıralama tek kaynaktan. */
function saleTotal(b: Booking): number {
  return b.items.reduce(
    (s, i) => s + salePrice(i.unitPrice, i.marginPct) * i.quantity,
    0,
  );
}
function netTotal(b: Booking): number {
  return b.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
}
function marginTotal(b: Booking): number {
  return b.items.reduce(
    (s, i) => s + marginAmount(i.unitPrice, i.marginPct) * i.quantity,
    0,
  );
}

export function BookingsTable() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [sort, setSort] = useState<{ field: SortField; dir: 1 | -1 }>({
    field: "ref",
    dir: -1,
  });
  const searchRef = useRef<HTMLInputElement>(null);
  useSearchHotkey(searchRef);

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    let list = ALL;

    if (statuses.length) list = list.filter((b) => statuses.includes(b.status));
    if (q) {
      list = list.filter(
        (b) =>
          b.ref.toLocaleLowerCase("tr").includes(q) ||
          b.customer.fullName.toLocaleLowerCase("tr").includes(q) ||
          primaryItem(b).title.toLocaleLowerCase("tr").includes(q),
      );
    }

    const key = (b: Booking) => {
      switch (sort.field) {
        case "sale":
          return saleTotal(b);
        case "status":
          return BOOKING_STATUSES.indexOf(b.status);
        case "travelDate":
          return b.travelDate;
        case "customer":
          return b.customer.fullName;
        default:
          return b.ref;
      }
    };

    return [...list].sort((a, b) => {
      const ka = key(a);
      const kb = key(b);
      if (typeof ka === "number" && typeof kb === "number")
        return (ka - kb) * sort.dir;
      return String(ka).localeCompare(String(kb), "tr") * sort.dir;
    });
  }, [query, statuses, sort]);

  const toggleSort = (field: SortField) =>
    setSort((prev) =>
      prev.field === field
        ? { field, dir: (prev.dir * -1) as 1 | -1 }
        : { field, dir: 1 },
    );

  const { ref, range, padTop, padBottom } = useVirtualRows({
    count: rows.length,
    rowHeight: ROW_H,
  });

  const open = (b: Booking) => router.push(`/extranet/rezervasyonlar/${b.ref}`);

  const onRowKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, b: Booking) => {
    if (e.key === "Enter") {
      e.preventDefault();
      open(b);
      return;
    }
    const move = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!move) return;
    e.preventDefault();
    const siblings = Array.from(
      e.currentTarget.parentElement?.querySelectorAll<HTMLDivElement>(
        '[role="row"][tabindex]',
      ) ?? [],
    );
    siblings[siblings.indexOf(e.currentTarget) + move]?.focus();
  };

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col bg-surface">
      <div className="flex flex-wrap items-center gap-4 border-b border-line px-[var(--pad-x)] py-2.5">
        <h1 className="font-dense text-base font-medium text-ink">
          {t("bookings.title")}
        </h1>
        <label className="flex-1 sm:max-w-sm">
          <span className="sr-only">{t("bookings.search")}</span>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("bookings.search")}
            className="h-8 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5
                       text-[length:var(--font-ui)] text-ink outline-none
                       placeholder:text-ink-3 focus:border-action"
          />
        </label>
        <FilterChipBar
          chips={STATUS_CHIPS}
          active={statuses}
          onToggle={(id) =>
            setStatuses((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
            )
          }
          onClear={() => setStatuses([])}
        />
        <p className="tnum ms-auto text-[length:var(--font-ui-sm)] text-ink-3">
          {t("bookings.rowCount", { count: rows.length })}
        </p>
      </div>

      <div
        role="grid"
        aria-rowcount={rows.length}
        aria-label={t("bookings.title")}
        className="flex min-h-0 flex-1 flex-col font-dense"
      >
        <div
          role="row"
          className="flex shrink-0 items-center gap-[var(--gap)] border-b border-line-strong
                     px-[var(--pad-x)] py-1.5 pe-[calc(var(--pad-x)+0.5rem)]
                     text-[length:var(--font-ui-xs)] text-ink-3"
        >
          <SortableHeader className="w-24" label={t("bookings.col.ref")} field="ref" sort={sort} onSort={toggleSort} />
          <SortableHeader className="w-40" label={t("bookings.col.lead")} field="customer" sort={sort} onSort={toggleSort} />
          <span role="columnheader" className="min-w-0 flex-1">
            {t("bookings.col.product")}
          </span>
          <SortableHeader className="w-20 justify-end" label={t("bookings.col.travelDate")} field="travelDate" sort={sort} onSort={toggleSort} />
          <span role="columnheader" className="w-12">{t("bookings.col.supplier")}</span>
          <SortableHeader className="w-28" label={t("bookings.col.status")} field="status" sort={sort} onSort={toggleSort} />
          <span role="columnheader" className="w-24 text-end">{t("bookings.col.net")}</span>
          <span role="columnheader" className="w-20 text-end">{t("bookings.col.margin")}</span>
          <SortableHeader className="w-28 justify-end" label={t("bookings.col.sale")} field="sale" sort={sort} onSort={toggleSort} />
        </div>

        {rows.length === 0 ? (
          <EmptyState title={t("bookings.emptyTitle")} body={t("bookings.emptyBody")} />
        ) : (
          <div ref={ref} className="min-h-0 flex-1 overflow-y-auto">
            <div style={{ height: padTop }} aria-hidden="true" />
            {rows.slice(range.start, range.end).map((b, i) => (
              <div
                key={b.id}
                role="row"
                aria-rowindex={range.start + i + 1}
                tabIndex={0}
                onKeyDown={(e) => onRowKeyDown(e, b)}
                onClick={() => open(b)}
                style={{ height: ROW_H }}
                className="flex cursor-pointer items-center gap-[var(--gap)] border-b border-line
                           px-[var(--pad-x)] pe-[calc(var(--pad-x)+0.5rem)]
                           hover:bg-action-tint focus:bg-action-tint focus:outline-none
                           focus-visible:shadow-[inset_2px_0_0_0_var(--action-primary)]"
              >
                <span role="gridcell" className="tnum w-24 text-[length:var(--font-ui)] text-ink">
                  {b.ref}
                </span>
                <span role="gridcell" className="w-40 truncate text-[length:var(--font-ui)] text-ink">
                  {b.customer.fullName}
                </span>
                <span role="gridcell" className="min-w-0 flex-1 truncate text-[length:var(--font-ui)] text-ink-2">
                  {primaryItem(b).title}
                </span>
                <span role="gridcell" className="tnum w-20 text-end text-[length:var(--font-ui-sm)] text-ink-2">
                  {formatShortDate(b.travelDate)}
                </span>
                <span role="gridcell" className="w-12">
                  <SupplierMark supplier={b.supplier} />
                </span>
                <span role="gridcell" className="w-28">
                  <StatusBadge status={b.status} />
                </span>
                <span role="gridcell" className="tnum w-24 text-end text-[length:var(--font-ui-sm)] text-ink-3">
                  {formatMoney(netTotal(b))}
                </span>
                <span role="gridcell" className="tnum w-20 text-end text-[length:var(--font-ui-sm)] text-margin-field">
                  {formatMoney(marginTotal(b))}
                </span>
                <span role="gridcell" className="tnum w-28 text-end text-[length:calc(var(--font-ui)*1.05)] font-semibold text-ink">
                  {formatMoney(saleTotal(b))}
                  <span className="sr-only"> — {bookingQuantity(b)} kişi</span>
                </span>
              </div>
            ))}
            <div style={{ height: padBottom }} aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

/** Sıralanabilir kolon başlığı. Yön oku sadece aktif kolonda görünür. */
function SortableHeader({
  label,
  field,
  sort,
  onSort,
  className = "",
}: {
  label: string;
  field: SortField;
  sort: { field: SortField; dir: 1 | -1 };
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const active = sort.field === field;
  return (
    <span
      role="columnheader"
      aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
      className={className}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`flex w-full items-center gap-1 ${
          className.includes("justify-end") ? "justify-end" : ""
        } ${active ? "font-medium text-ink" : "hover:text-ink"}`}
      >
        {label}
        <span aria-hidden="true" className={active ? "text-action" : "invisible"}>
          {sort.dir === 1 ? "↑" : "↓"}
        </span>
      </button>
    </span>
  );
}
