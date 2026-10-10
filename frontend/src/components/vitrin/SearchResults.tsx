"use client";

import { useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, SearchX, SlidersHorizontal, Users, X } from "lucide-react";
import { fromPrice, tl, type CategoryKey } from "@/content/vitrin";
import { useVitrin } from "./VitrinProvider";
import { formatTr } from "./AvailabilityCalendar";
import { ProductCard } from "./ProductCard";
import { StayCard } from "./StayCard";
import { useFavorites } from "./Favorites";

const norm = (s: string) => s.toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "");

function Toggle({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-2.5">
      <span className="font-medium">{label}</span>
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-ink/15 transition-colors peer-checked:bg-ink peer-focus-visible:ring-2 peer-focus-visible:ring-pop after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

export function SearchResults() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { ids } = useFavorites();
  const { destinations, products, categories: vCategories, destName } = useVitrin();
  const PRICE_MAX = Math.max(1000, Math.ceil(Math.max(0, ...products.map((p) => fromPrice(p) ?? 0)) / 1000) * 1000);
  const sheet = useRef<HTMLDialogElement>(null);

  const q = sp.get("q") ?? "";
  const kategori = (sp.get("kategori") ?? "") as CategoryKey | "";
  const sehir = sp.get("sehir") ?? "";
  const sirala = sp.get("sirala") ?? "onerilen";
  const iptal = sp.get("iptal") === "1";
  const aninda = sp.get("aninda") === "1";
  const firsat = sp.get("firsat") === "1";
  const fav = sp.get("favoriler") === "1";
  const tarih = sp.get("tarih") ?? "";
  const kisi = sp.get("kisi") ?? "";
  const maxPrice = Number(sp.get("enfazla")) || PRICE_MAX;

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const base = useMemo(() => {
    const n = norm(q);
    return products.filter(
      (p) =>
        (!n || norm(`${p.title} ${p.summary} ${destName(p.city)}`).includes(n)) &&
        (!sehir || p.city === sehir) &&
        (!iptal || p.freeCancel) &&
        (!aninda || p.instant) &&
        (!firsat || p.oldPrice) &&
        (!fav || ids.includes(p.slug)) &&
        (fromPrice(p) ?? 0) <= maxPrice,
    );
  }, [q, sehir, iptal, aninda, firsat, fav, ids, maxPrice, products, destName]);

  const list = useMemo(() => {
    const r = base.filter((p) => !kategori || p.category === kategori);
    if (sirala === "artan") r.sort((a, b) => (fromPrice(a) ?? Infinity) - (fromPrice(b) ?? Infinity));
    if (sirala === "azalan") r.sort((a, b) => (fromPrice(b) ?? 0) - (fromPrice(a) ?? 0));
    return r;
  }, [base, kategori, sirala]);

  const title = fav
    ? "Favorileriniz"
    : sehir
      ? `${destName(sehir)} deneyimleri`
      : kategori
        ? vCategories.find((c) => c.key === kategori)?.label ?? "Tüm deneyimler"
        : firsat
          ? "Fırsatlar"
          : q
            ? `“${q}” için sonuçlar`
            : "Tüm deneyimler";

  const active = [
    q && { k: "q", label: `“${q}”` },
    sehir && { k: "sehir", label: destName(sehir) },
    iptal && { k: "iptal", label: "Ücretsiz iptal" },
    aninda && { k: "aninda", label: "Anında onay" },
    firsat && { k: "firsat", label: "Fırsatlar" },
    fav && { k: "favoriler", label: "Favoriler" },
    maxPrice < PRICE_MAX && { k: "enfazla", label: `En fazla ${tl(maxPrice)}` },
  ].filter(Boolean) as { k: string; label: string }[];


  const panel = (
    <div className="flex flex-col gap-7">
      <fieldset>
        <legend className="mb-3 text-sm font-bold tracking-wide uppercase">Kategori</legend>
        <div className="flex flex-col gap-1">
          {[{ key: "", label: "Tümü" }, ...vCategories].map((c) => {
            const n = c.key ? base.filter((p) => p.category === c.key).length : base.length;
            const on = kategori === c.key;
            return (
              <button
                key={c.label}
                type="button"
                aria-pressed={on}
                onClick={() => set("kategori", c.key || null)}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left font-semibold transition-colors ${on ? "bg-ink text-white" : "hover:bg-mist"}`}
              >
                {c.label}
                <span className={`rounded-full px-2 text-xs tabular-nums ${on ? "bg-pop text-ink" : "bg-mist text-ink-3"}`}>{n}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="block">
        <span className="mb-3 block text-sm font-bold tracking-wide uppercase">Destinasyon</span>
        <select value={sehir} onChange={(e) => set("sehir", e.target.value || null)} className="h-12 w-full rounded-xl border-[1.5px] border-ink/15 bg-white px-3 font-semibold">
          <option value="">Tüm destinasyonlar</option>
          {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 flex items-baseline justify-between text-sm font-bold tracking-wide uppercase">
          Fiyat <span className="text-base normal-case tabular-nums">en fazla {tl(maxPrice)}</span>
        </span>
        <input
          type="range"
          min={500}
          max={PRICE_MAX}
          step={500}
          value={maxPrice}
          onChange={(e) => set("enfazla", Number(e.target.value) >= PRICE_MAX ? null : e.target.value)}
          className="w-full accent-ink"
        />
        <span className="flex justify-between text-xs text-ink-3 tabular-nums"><span>{tl(500)}</span><span>{tl(PRICE_MAX)}</span></span>
      </label>

      <div className="divide-y divide-line border-y border-line">
        <Toggle onChange={(c) => set("iptal", c ? "1" : null)} on={iptal} label="Ücretsiz iptal" />
        <Toggle onChange={(c) => set("aninda", c ? "1" : null)} on={aninda} label="Anında onay" />
        <Toggle onChange={(c) => set("firsat", c ? "1" : null)} on={firsat} label="Yalnızca fırsatlar" />
      </div>

      {active.length > 0 && (
        <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className="self-start font-semibold underline underline-offset-4">
          Tüm filtreleri temizle
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1320px] px-5 pt-8">
      <h1 key={title} className="tab-in text-[2rem] font-extrabold tracking-tight sm:text-5xl">{title}</h1>
      {(tarih || kisi) && (
        <p className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
          {tarih && <span className="flex items-center gap-1.5 rounded-full bg-mist px-3 py-1"><CalendarDays className="size-4" /> {formatTr(tarih)}</span>}
          {kisi && <span className="flex items-center gap-1.5 rounded-full bg-mist px-3 py-1"><Users className="size-4" /> {kisi} kişi</span>}
        </p>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 pb-6">{panel}</div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => sheet.current?.showModal()} className="flex items-center gap-2 rounded-xl border-[1.5px] border-ink px-4 py-2.5 font-semibold lg:hidden">
              <SlidersHorizontal className="size-4" /> Filtreler {active.length > 0 && <span className="rounded-full bg-pop px-2 text-xs">{active.length}</span>}
            </button>
            <p className="text-ink-3" aria-live="polite">{list.length} deneyim</p>
            <label className="ml-auto flex items-center gap-2 text-sm">
              <span className="hidden text-ink-3 sm:inline">Sırala</span>
              <select value={sirala} onChange={(e) => set("sirala", e.target.value === "onerilen" ? null : e.target.value)} className="h-11 rounded-xl border-[1.5px] border-ink/15 bg-white px-3 font-semibold">
                <option value="onerilen">Önerilen</option>
                <option value="artan">Fiyat: düşükten yükseğe</option>
                <option value="azalan">Fiyat: yüksekten düşüğe</option>
              </select>
            </label>
          </div>

          {active.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {active.map((a) => (
                <button key={a.k} type="button" onClick={() => set(a.k, null)} className="tab-in flex items-center gap-1.5 rounded-full bg-pop px-3 py-1 text-sm font-semibold">
                  {a.label} <X className="size-3.5" />
                </button>
              ))}
            </div>
          )}

          {list.length && list.every((p) => p.stay) ? (
            // Yalnız konaklama listeleniyorsa ETS tarzı yatay kartlar, tek kolon.
            <ul className="mt-6 flex flex-col gap-5">
              {list.map((p, i) => (
                <li key={p.slug} className="tab-in" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                  <StayCard id={p.slug} href={p.href ?? `/magaza/urun/${p.slug}`} title={p.title} image={p.image} stay={p.stay!} nightly={fromPrice(p) != null ? fromPrice(p)! * 100 : null} currency="TRY" />
                </li>
              ))}
            </ul>
          ) : list.length ? (
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((p, i) => (
                <li key={p.slug} className="tab-in" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                  <ProductCard p={p} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-16 flex flex-col items-center text-center">
              <span className="grid size-20 place-items-center rounded-full bg-mist"><SearchX className="size-9" /></span>
              <h2 className="mt-5 text-2xl font-bold">{fav ? "Henüz favoriniz yok" : "Sonuç bulunamadı"}</h2>
              <p className="mt-2 max-w-sm text-ink-3">
                {fav ? "Beğendiğiniz deneyimlerdeki kalp simgesine dokunarak burada toplayabilirsiniz." : "Filtreleri değiştirerek ya da farklı bir arama yaparak tekrar deneyin."}
              </p>
              <button type="button" onClick={() => router.replace(pathname)} className="mt-6 rounded-xl bg-ink px-6 py-3 font-semibold text-white">
                Tüm deneyimleri göster
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobil filtre penceresi */}
      <dialog
        ref={sheet}
        aria-label="Filtreler"
        onClick={(e) => e.target === e.currentTarget && sheet.current?.close()}
        className="mt-auto mb-0 max-h-[88dvh] w-full max-w-none rounded-t-[28px] bg-white p-0 lg:hidden"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <p className="text-lg font-extrabold">Filtreler</p>
          <button type="button" onClick={() => sheet.current?.close()} aria-label="Kapat" className="grid size-10 place-items-center rounded-full bg-mist"><X className="size-5" /></button>
        </div>
        <div className="px-5 py-6">{panel}</div>
        <div className="sticky bottom-0 border-t border-line bg-white p-4">
          <button type="button" onClick={() => sheet.current?.close()} className="h-13 w-full rounded-xl bg-ink font-bold text-white">
            {list.length} deneyimi göster
          </button>
        </div>
      </dialog>
    </div>
  );
}
