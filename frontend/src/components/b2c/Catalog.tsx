"use client";

import { useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchX, SlidersHorizontal, X } from "lucide-react";
import { t } from "@/lib/i18n";
import type { KartUrun } from "@/lib/storefront/kart";
import { matches, readSelection, readSort, sortItems, type FilterDef, type SortKey } from "@/lib/storefront/katalog";
import { UrunKarti } from "./UrunKarti";
import { StayCard } from "@/components/vitrin/StayCard";

/**
 * Katalog iskeleti (VITRIN.md §4.3, Seyyah `SearchResults`): masaüstünde
 * sol filtre paneli (büyük harfli grup başlıkları, sayılı seçenek
 * düğmeleri), dar ekranda alttan açılan `<dialog>` sayfası; üstte sonuç
 * sayısı, sıralama ve kaldırılabilir aktif filtre çipleri; kartlar sırayla
 * belirir.
 *
 * Filtre durumu URL'de (`?kategori=a,b&iptal=1&sirala=fiyat`): bağlantı
 * paylaşılabilir, geri tuşu çalışır. Önizlemede yerel durum.
 */
export function Catalog({ items, filters, preview = false }: { items: KartUrun[]; filters: FilterDef[]; preview?: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [local, setLocal] = useState<{ sel: Record<string, string[]>; sort: SortKey }>({ sel: {}, sort: "onerilen" });
  const sheet = useRef<HTMLDialogElement>(null);

  const sel = preview ? local.sel : readSelection(params, filters);
  const sort = preview ? local.sort : readSort(params);

  const commit = (nextSel: Record<string, string[]>, nextSort: SortKey) => {
    if (preview) {
      setLocal({ sel: nextSel, sort: nextSort });
      return;
    }
    const q = new URLSearchParams(params.toString());
    for (const d of filters) {
      const v = nextSel[d.id] ?? [];
      if (v.length) q.set(d.id, v.join(","));
      else q.delete(d.id);
    }
    if (nextSort === "onerilen") q.delete("sirala");
    else q.set("sirala", nextSort);
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const toggle = (facet: string, value: string) => {
    const cur = sel[facet] ?? [];
    const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
    commit({ ...sel, [facet]: next }, sort);
  };
  const clear = () => commit({}, sort);

  const active = filters.flatMap((f) => (sel[f.id] ?? []).map((v) => ({ facet: f.id, value: v, label: f.options.find((o) => o.value === v)?.label ?? v })));
  const results = useMemo(() => sortItems(items.filter((it) => matches(it, sel)), sort), [items, sel, sort]);

  const panel = (
    <div className="flex flex-col gap-7">
      {filters.map((f) => (
        <fieldset key={f.id}>
          <legend className="mb-3 text-sm font-bold tracking-wide text-ink uppercase">{f.label}</legend>
          <div className="flex flex-col gap-1">
            {f.options.map((o) => {
              const on = (sel[f.id] ?? []).includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(f.id, o.value)}
                  className={`flex items-center justify-between gap-3 rounded-[var(--radius)] px-3 py-2.5 text-left font-semibold transition-colors ${
                    on ? "bg-inverse text-ink-inverse" : "text-ink hover:bg-sunken"
                  }`}
                >
                  {o.label}
                  <span className={`tnum rounded-full px-2 text-xs ${on ? "bg-highlight text-on-highlight" : "bg-sunken text-ink-3"}`}>{o.count}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      {active.length > 0 && (
        <button type="button" onClick={clear} className="self-start font-semibold text-ink underline underline-offset-4">
          {t("b2c.catalog.clearAll")}
        </button>
      )}
    </div>
  );

  return (
    <div className={filters.length ? "grid gap-10 lg:grid-cols-[280px_1fr]" : ""}>
      {filters.length > 0 && (
        <aside className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-h)+1.5rem)] max-h-[calc(100vh-var(--header-h)-3rem)] overflow-y-auto pr-2 pb-6">{panel}</div>
        </aside>
      )}

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          {filters.length > 0 && (
            <button
              type="button"
              onClick={() => sheet.current?.showModal()}
              className="flex items-center gap-2 rounded-[var(--radius)] border-[1.5px] border-ink px-4 py-2.5 font-semibold text-ink lg:hidden"
            >
              <SlidersHorizontal className="size-4" /> {t("b2c.catalog.filters")}
              {active.length > 0 && <span className="tnum rounded-full bg-highlight px-2 text-xs text-on-highlight">{active.length}</span>}
            </button>
          )}
          <p className="tnum text-ink-3" aria-live="polite">{t("b2c.list.count", { count: results.length })}</p>
          <label className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden text-ink-3 sm:inline">{t("b2c.sort")}</span>
            <select
              value={sort}
              onChange={(e) => commit(sel, e.target.value as SortKey)}
              className="h-11 rounded-[var(--radius)] border-[1.5px] border-line-strong bg-surface px-3 font-semibold text-ink outline-none focus:border-ink"
            >
              <option value="onerilen">{t("b2c.sort.recommended")}</option>
              <option value="fiyat">{t("b2c.sort.priceAsc")}</option>
              <option value="ad">{t("b2c.sort.name")}</option>
            </select>
          </label>
        </div>

        {active.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {active.map((a) => (
              <button
                key={`${a.facet}:${a.value}`}
                type="button"
                onClick={() => toggle(a.facet, a.value)}
                className="tab-in flex items-center gap-1.5 rounded-full bg-highlight px-3 py-1 text-sm font-semibold text-on-highlight"
              >
                {a.label} <X className="size-3.5" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        {results.length && results.every((it) => it.stay) ? (
          // Villa listesi: ETS tarzı yatay kartlar, tek kolon.
          <ul className="mt-6 flex flex-col gap-5">
            {results.map((it, i) => (
              <li key={it.id} className="tab-in" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                <StayCard id={it.id} href={it.href} title={it.title} image={it.photo?.url ?? null} tone={it.tone} stay={it.stay!} nightly={it.price} currency={it.currency} />
              </li>
            ))}
          </ul>
        ) : results.length ? (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((it, i) => (
              <li key={it.id} className="tab-in" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                <UrunKarti item={it} preview={preview} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-16 flex flex-col items-center text-center">
            <span className="grid size-20 place-items-center rounded-full bg-sunken text-ink"><SearchX className="size-9" /></span>
            <h2 className="mt-5 text-2xl font-bold text-ink">{t("results.emptyTitle")}</h2>
            <p className="mt-2 max-w-sm text-ink-3">{t("results.emptyBody")}</p>
            {active.length > 0 && (
              <button type="button" onClick={clear} className="mt-6 rounded-[var(--radius)] bg-inverse px-6 py-3 font-semibold text-ink-inverse">
                {t("b2c.catalog.showAll")}
              </button>
            )}
          </div>
        )}
      </div>

      {filters.length > 0 && (
        <dialog
          ref={sheet}
          aria-label={t("b2c.catalog.filters")}
          onClick={(e) => e.target === e.currentTarget && sheet.current?.close()}
          className="mt-auto mb-0 max-h-[88dvh] w-full max-w-none rounded-t-[var(--radius-xl)] bg-surface p-0 text-ink lg:hidden"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-4">
            <p className="text-lg font-extrabold">{t("b2c.catalog.filters")}</p>
            <button type="button" onClick={() => sheet.current?.close()} aria-label={t("common.close")} className="grid size-10 place-items-center rounded-full bg-sunken">
              <X className="size-5" />
            </button>
          </div>
          <div className="px-5 py-6">{panel}</div>
          <div className="sticky bottom-0 border-t border-line bg-surface p-4">
            <button type="button" onClick={() => sheet.current?.close()} className="h-13 w-full rounded-[var(--radius)] bg-inverse font-bold text-ink-inverse">
              {t("b2c.catalog.showResults", { count: results.length })}
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
