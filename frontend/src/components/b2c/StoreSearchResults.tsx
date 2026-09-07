"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TOUR_RESULTS } from "@/data/mock";
import { t } from "@/lib/i18n";
import { salePrice, type SearchResult } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { FilterChipBar, type ChipDef } from "@/components/primitives/FilterChipBar";
import { EmptyState } from "@/components/primitives/States";

/**
 * Tüketici arama sonuçları.
 *
 * Extranet'in tablosuyla aynı veri, tamamen farklı sunum: kart ızgarası,
 * comfortable yoğunluk, tek fiyat. Tedarikçi kimliği ve net fiyat burada
 * hiçbir koşulda görünmez — aynı üründen birden fazla tedarikçi varsa
 * müşteriye yalnız en ucuzu gösterilir.
 */
const RETAIL_MARGIN = 22;

const CHIPS: ChipDef[] = [
  { id: "morning", label: "filters.morning" },
  { id: "afternoon", label: "filters.afternoon" },
  { id: "freeCancel", label: "filters.freeCancel" },
  { id: "turkish", label: "filters.turkish" },
];

type Sort = "recommended" | "priceAsc" | "rating";

export function StoreSearchResults() {
  const params = useSearchParams();
  const destination = params.get("nereye") ?? "Kapadokya";
  const [active, setActive] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("recommended");

  const results = useMemo(() => {
    // Aynı ürünün en ucuz tedarikçisi — müşteri tedarikçi seçmez.
    const cheapest = new Map<string, SearchResult>();
    for (const r of TOUR_RESULTS) {
      const cur = cheapest.get(r.productId);
      if (!cur || r.net < cur.net) cheapest.set(r.productId, r);
    }

    let list = [...cheapest.values()].filter((r) =>
      active.every((id) => {
        const hour = new Date(r.startsAt).getUTCHours();
        if (id === "morning") return hour < 12;
        if (id === "afternoon") return hour >= 12;
        if (id === "freeCancel") return r.cancellation.type === "free";
        if (id === "turkish") return r.languages.includes("TR");
        return true;
      }),
    );

    if (sort === "priceAsc") {
      list = list.sort(
        (a, b) => salePrice(a.net, RETAIL_MARGIN) - salePrice(b.net, RETAIL_MARGIN),
      );
    } else if (sort === "rating") {
      list = list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return list;
  }, [active, sort]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="font-dense text-[clamp(1.8rem,3.4vw,2.6rem)] font-semibold leading-[1.02] tracking-[-0.015em] text-ink">
        {t("b2c.searchTitle", { destination })}
      </h1>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
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
        <label className="flex items-center gap-2 text-[length:var(--font-ui-sm)] text-ink-2">
          {t("b2c.sort")}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-9 rounded-[var(--radius)] border border-line-strong bg-surface px-2
                       text-[length:var(--font-ui)] text-ink outline-none focus:border-action"
          >
            <option value="recommended">{t("b2c.sort.recommended")}</option>
            <option value="priceAsc">{t("b2c.sort.priceAsc")}</option>
            <option value="rating">{t("b2c.sort.rating")}</option>
          </select>
        </label>
      </div>

      <p className="tnum mt-4 text-[length:var(--font-ui-sm)] text-ink-2">
        {t("b2c.resultCount", { count: results.length })}
      </p>

      {results.length === 0 ? (
        <EmptyState title={t("results.emptyTitle")} body={t("results.emptyBody")} />
      ) : (
        <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r, i) => (
            <ProductCard key={r.id} result={r} urgent={i === 0 && (r.remaining ?? 99) <= 6} />
          ))}
        </div>
      )}
    </div>
  );
}
