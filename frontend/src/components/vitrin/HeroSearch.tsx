"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Minus, Plus, Search, Users } from "lucide-react";
import type { CategoryKey } from "@/content/vitrin";
import { useVitrin } from "./VitrinProvider";

const TAB_LABEL: Record<CategoryKey, string> = { tur: "Turlar", tekne: "Tekne & Yat", transfer: "Transfer", feribot: "Feribot", kultur: "Kültür", konaklama: "Konaklama", vize: "Vize" };

/** Sekmeli arama kartı: kategori + destinasyon + tarih + kişi → arama sayfası. */
export function HeroSearch() {
  const router = useRouter();
  const { destinations, categories } = useVitrin();
  const tabs: { key: CategoryKey | ""; label: string }[] = [{ key: "", label: "Tüm deneyimler" }, ...categories.map((c) => ({ key: c.key, label: TAB_LABEL[c.key] }))];
  const [tab, setTab] = useState<CategoryKey | "">("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(2);
  const [guestOpen, setGuestOpen] = useState(false);
  const guestRef = useRef<HTMLDivElement>(null);
  const [min, setMin] = useState("");

  useEffect(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bugünün tarihi yalnızca istemcide bilinir
    setMin(d.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (!guestOpen) return;
    const close = (e: MouseEvent) => !guestRef.current?.contains(e.target as Node) && setGuestOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [guestOpen]);

  const submit = () => {
    const q = new URLSearchParams();
    if (tab) q.set("kategori", tab);
    if (city) q.set("sehir", city);
    if (date) q.set("tarih", date);
    q.set("kisi", String(guests));
    router.push(`/magaza/ara?${q}`);
  };

  const field = "flex min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-2.5 transition-colors hover:bg-mist focus-within:bg-mist";
  const label = "block text-[11px] font-bold tracking-wide text-ink-3 uppercase";

  return (
    <div className="rounded-[22px] bg-white p-2 shadow-[var(--shadow-lift)]">
      <div role="tablist" aria-label="Deneyim türü" className="flex gap-1 overflow-x-auto p-1 [scrollbar-width:none]">
        {tabs.map((t) => (
          <button
            key={t.label}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`relative shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${tab === t.key ? "bg-pop" : "text-ink-2 hover:bg-mist"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mt-1 flex flex-col gap-1 md:flex-row md:items-center md:divide-x md:divide-line"
      >
        <label className={field}>
          <MapPin className="size-5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className={label}>Nereye</span>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full cursor-pointer appearance-none bg-transparent font-semibold outline-none">
              <option value="">Tüm Türkiye</option>
              {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
            </select>
          </span>
        </label>
        <label className={field}>
          <CalendarDays className="size-5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className={label}>Ne zaman</span>
            <input type="date" min={min} value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent font-semibold outline-none" />
          </span>
        </label>
        <div ref={guestRef} className={`${field} relative`}>
          <Users className="size-5 shrink-0" />
          <button type="button" aria-expanded={guestOpen} onClick={() => setGuestOpen((o) => !o)} className="min-w-0 flex-1 text-left">
            <span className={label}>Kaç kişi</span>
            <span className="block font-semibold">{guests} kişi</span>
          </button>
          {guestOpen && (
            <div className="menu-in absolute top-full left-0 z-30 mt-2 flex w-64 items-center justify-between rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-ink/5">
              <span className="font-semibold">Misafir</span>
              <span className="flex items-center gap-3">
                <button type="button" aria-label="Azalt" disabled={guests <= 1} onClick={() => setGuests((g) => g - 1)} className="grid size-9 place-items-center rounded-lg border-[1.5px] border-ink/15 disabled:opacity-30"><Minus className="size-4" /></button>
                <span className="w-5 text-center font-bold tabular-nums">{guests}</span>
                <button type="button" aria-label="Artır" disabled={guests >= 20} onClick={() => setGuests((g) => g + 1)} className="grid size-9 place-items-center rounded-lg bg-ink text-white disabled:opacity-30"><Plus className="size-4" /></button>
              </span>
            </div>
          )}
        </div>
        <div className="p-1 md:pl-2">
          <button type="submit" className="magnetic flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-ink px-7 font-bold text-white transition-colors hover:bg-ink-2 md:w-auto">
            <Search className="size-5" /> Ara
          </button>
        </div>
      </form>
    </div>
  );
}
