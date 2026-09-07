"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatDate, t } from "@/lib/i18n";
import { salePrice, type SearchResult } from "@/lib/types";
import { useSupplierSearch } from "@/lib/use-supplier-search";
import { SearchBar } from "./SearchBar";
import { SearchTabs } from "./SearchTabs";
import { SupplierStatusStrip } from "./SupplierStatusStrip";
import { HotelResultTable } from "./HotelResultTable";
import { FilterChipBar, type ChipDef } from "@/components/primitives/FilterChipBar";
import { ResultRowSkeleton } from "@/components/primitives/Skeleton";
import { EmptyState } from "@/components/primitives/States";

const CHIPS: ChipDef[] = [
  { id: "breakfast", label: "hotel.board.breakfast" },
  { id: "freeCancel", label: "filters.freeCancel" },
  { id: "instant", label: "filters.instant" },
  { id: "five", label: "hotel.col.stars" },
];

function matches(r: SearchResult, active: string[]): boolean {
  return active.every((id) => {
    switch (id) {
      case "breakfast":
        return r.board !== "room_only";
      case "freeCancel":
        return r.cancellation.type === "free";
      case "instant":
        return r.instantConfirm;
      case "five":
        return (r.stars ?? 0) >= 5;
      default:
        return true;
    }
  });
}

export function HotelResultsView() {
  const params = useSearchParams();
  const destination = params.get("nereye") ?? "Kapadokya";
  const date = params.get("tarih") ?? "2026-10-12";

  return (
    <HotelResultsList key={`${destination}|${date}`} destination={destination} date={date} />
  );
}

function HotelResultsList({
  destination,
  date,
}: {
  destination: string;
  date: string;
}) {
  const { results, progress, retry } = useSupplierSearch("hotel");
  const [margins, setMargins] = useState<Record<string, number>>({});
  const [active, setActive] = useState<string[]>([]);

  const visible = useMemo(() => {
    const marginOf = (r: SearchResult) => margins[r.id] ?? r.defaultMarginPct;
    return results
      .filter((r) => matches(r, active))
      .sort((a, b) => salePrice(a.net, marginOf(a)) - salePrice(b.net, marginOf(b)));
  }, [results, active, margins]);

  const stillWaiting = progress.some((p) => p.state === "pending");

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-line bg-surface px-[var(--pad-x)] py-3">
        <div className="mb-3 border-b border-line">
          <SearchTabs active="otel" />
        </div>
        <SearchBar kind="hotel" defaultDestination={destination} defaultDate={date} />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-dense text-base font-medium text-ink">
            {t("results.heading", {
              destination,
              date: formatDate(`${date}T00:00:00.000Z`),
            })}
          </h1>
          <FilterChipBar
            chips={CHIPS}
            active={active}
            onToggle={(id) =>
              setActive((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
              )
            }
            onClear={() => setActive([])}
          />
        </div>
      </div>

      <SupplierStatusStrip progress={progress} onRetry={retry} />

      <div className="flex-1 bg-surface">
        {visible.length > 0 && (
          <HotelResultTable
            results={visible}
            margins={margins}
            onMarginChange={(id, pct) => setMargins((prev) => ({ ...prev, [id]: pct }))}
          />
        )}
        {stillWaiting && <ResultRowSkeleton rows={visible.length ? 3 : 6} />}
        {!stillWaiting && visible.length === 0 && (
          <EmptyState title={t("results.emptyTitle")} body={t("results.emptyBody")} />
        )}
      </div>
    </div>
  );
}
