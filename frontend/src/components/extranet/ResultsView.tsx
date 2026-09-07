"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatDate, t } from "@/lib/i18n";
import { salePrice, marginAmount, type SearchResult } from "@/lib/types";
import { useSupplierSearch } from "@/lib/use-supplier-search";
import { SearchBar } from "./SearchBar";
import { SearchTabs } from "./SearchTabs";
import { SupplierStatusStrip } from "./SupplierStatusStrip";
import { ResultTable, type SortKey } from "./ResultTable";
import { FilterChipBar, type ChipDef } from "@/components/primitives/FilterChipBar";
import { ResultRowSkeleton } from "@/components/primitives/Skeleton";
import { EmptyState } from "@/components/primitives/States";

const CHIPS: ChipDef[] = [
  { id: "morning", label: "filters.morning" },
  { id: "afternoon", label: "filters.afternoon" },
  { id: "freeCancel", label: "filters.freeCancel" },
  { id: "instant", label: "filters.instant" },
  { id: "turkish", label: "filters.turkish" },
];

function matches(r: SearchResult, active: string[]): boolean {
  return active.every((id) => {
    const hour = new Date(r.startsAt).getUTCHours();
    switch (id) {
      case "morning":
        return hour < 12;
      case "afternoon":
        return hour >= 12;
      case "freeCancel":
        return r.cancellation.type === "free";
      case "instant":
        return r.instantConfirm;
      case "turkish":
        return r.languages.includes("TR");
      default:
        return true;
    }
  });
}

export function ResultsView() {
  const params = useSearchParams();
  const destination = params.get("nereye") ?? "Kapadokya";
  const date = params.get("tarih") ?? "2026-09-18";

  return (
    // Yeni arama = yeni sorgu. Bileşen `key` ile yeniden monte edilir,
    // böylece önceki aramanın sonuçları ve tedarikçi durumu sızmaz.
    <ResultsList
      key={`${destination}|${date}`}
      destination={destination}
      date={date}
    />
  );
}

function ResultsList({
  destination,
  date,
}: {
  destination: string;
  date: string;
}) {
  const { results, progress, retry } = useSupplierSearch();
  const [margins, setMargins] = useState<Record<string, number>>({});
  const [active, setActive] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("sale");

  const marginOf = (r: SearchResult) => margins[r.id] ?? r.defaultMarginPct;

  const visible = useMemo(() => {
    const filtered = results.filter((r) => matches(r, active));
    return [...filtered].sort((a, b) =>
      sort === "sale"
        ? salePrice(a.net, marginOf(a)) - salePrice(b.net, marginOf(b))
        : marginAmount(b.net, marginOf(b)) - marginAmount(a.net, marginOf(a)),
    );
    // marginOf, margins'e bağlı — bağımlılık listesi bilinçli olarak margins.
  }, [results, active, sort, margins]); // eslint-disable-line react-hooks/exhaustive-deps

  const stillWaiting = progress.some((p) => p.state === "pending");

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-line bg-surface px-[var(--pad-x)] py-3">
        <div className="mb-3 border-b border-line">
          <SearchTabs active="tur" />
        </div>
        <SearchBar defaultDestination={destination} defaultDate={date} />
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
          <ResultTable
            results={visible}
            margins={margins}
            onMarginChange={(id, pct) =>
              setMargins((prev) => ({ ...prev, [id]: pct }))
            }
            sort={sort}
            onSortChange={setSort}
          />
        )}

        {/* Sonuçlar geldikçe akıyor; bekleyen tedarikçiler için iskelet
            listenin altında durur, gelen sonuçlar gizlenmez. */}
        {stillWaiting && <ResultRowSkeleton rows={visible.length ? 3 : 6} />}

        {!stillWaiting && visible.length === 0 && (
          <EmptyState
            title={t("results.emptyTitle")}
            body={t("results.emptyBody")}
          />
        )}
      </div>
    </div>
  );
}
