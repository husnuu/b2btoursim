"use client";

import { useState } from "react";
import { CalendarDays, Clock, Globe, MapPin, Search, Users } from "lucide-react";
import { t } from "@/lib/i18n";
import type { KartKind } from "@/lib/storefront/kart";
import { addDays, timeSlots } from "@/lib/storefront/tarih";
import { DateField } from "./DateField";

export type SearchTab = { kind: KartKind; label: string; href: string };

/**
 * Sekmeli arama kartı (VITRIN.md §4.2, Seyyah vitrin `HeroSearch`): beyaz
 * büyük köşeli kart, üstte sekmeler, altta ayraçlı alanlar, sağda koyu
 * "Ara" düğmesi. Sekmeler = açık VE içeriği olan modül bölümleri; menüyle
 * aynı kural. Tek modüllü acentede sekme çubuğu çizilmez.
 *
 * Her sekme kendi liste sayfasına GET gönderir; parametreler URL'de kalır.
 * Önizlemede alanlar `disabled`, `action` yok.
 */
export function HeroSearch({ tabs, preview }: { tabs: SearchTab[]; preview: boolean }) {
  const [active, setActive] = useState<KartKind>(tabs[0]?.kind ?? "tur");
  const tab = tabs.find((x) => x.kind === active) ?? tabs[0];
  const [d1, setD1] = useState("");
  const [d2, setD2] = useState("");
  if (!tab) return null;

  const field =
    "flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius)] px-4 py-2.5 transition-colors hover:bg-sunken focus-within:bg-sunken";
  const label = "block text-[11px] font-bold tracking-wide text-ink-3 uppercase";
  const input = "w-full bg-transparent font-semibold text-ink outline-none placeholder:font-medium placeholder:text-ink-3";

  const text = (name: string, placeholder: string, Icon: typeof MapPin, lbl: string) => (
    <label className={field}>
      <Icon className="size-5 shrink-0 text-ink" />
      <span className="min-w-0 flex-1">
        <span className={label}>{lbl}</span>
        <input name={name} disabled={preview} placeholder={placeholder} className={input} />
      </span>
    </label>
  );
  const date = (name: string, lbl: string, value: string, set: (v: string) => void, min?: string) => (
    <div className={field}>
      <CalendarDays className="size-5 shrink-0 text-ink" />
      <span className="min-w-0 flex-1">
        <span className={label}>{lbl}</span>
        <DateField label={lbl} value={value} onChange={set} name={name} min={min} bare disabled={preview} placeholder={t("b2c.selectDate")} className="font-semibold" />
      </span>
    </div>
  );
  const pax = (
    <label className={field}>
      <Users className="size-5 shrink-0 text-ink" />
      <span className="min-w-0 flex-1">
        <span className={label}>{t("b2c.search.who")}</span>
        <select name="kisi" defaultValue="2" disabled={preview} className={`${input} cursor-pointer appearance-none`}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
            <option key={n} value={n}>
              {t("b2c.searchPaxCount", { count: n })}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
  const time = (
    <label className={field}>
      <Clock className="size-5 shrink-0 text-ink" />
      <span className="min-w-0 flex-1">
        <span className={label}>{t("b2c.request.time")}</span>
        <select name="saat" defaultValue="10:00" disabled={preview} className={`${input} tnum cursor-pointer appearance-none`}>
          {timeSlots().map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </span>
    </label>
  );

  let fields: React.ReactNode;
  switch (tab.kind) {
    case "tur":
      fields = (
        <>
          {text("nereye", t("b2c.searchPlaceholder"), MapPin, t("b2c.search.where"))}
          {date("tarih", t("b2c.search.when"), d1, setD1)}
          {pax}
        </>
      );
      break;
    case "transfer":
      fields = (
        <>
          {text("nereden", "Havalimanı, otel…", MapPin, t("b2c.request.from"))}
          {text("nereye", "Otel, şehir…", MapPin, t("b2c.request.to"))}
          {date("tarih", t("b2c.search.when"), d1, setD1)}
          {time}
        </>
      );
      break;
    case "tekne":
      fields = (
        <>
          {date("tarih", t("b2c.search.when"), d1, setD1)}
          {pax}
        </>
      );
      break;
    case "villa":
      fields = (
        <>
          {date("giris", t("b2c.request.checkIn"), d1, (v) => {
            setD1(v);
            if (d2 && d2 <= v) setD2(addDays(v, 1));
          })}
          {date("cikis", t("b2c.request.checkOut"), d2, setD2, d1 ? addDays(d1, 1) : undefined)}
          {pax}
        </>
      );
      break;
    case "vize":
      fields = <>{text("ulke", t("b2c.search.country"), Globe, t("b2c.search.country"))}</>;
      break;
  }

  return (
    <div className="pointer-events-auto w-full rounded-[var(--radius-lg)] bg-surface p-2 text-ink shadow-[var(--shadow-float)]">
      {tabs.length > 1 && (
        <div role="tablist" aria-label={t("b2c.search.tabs")} className="flex gap-1 overflow-x-auto p-1 [scrollbar-width:none]">
          {tabs.map((x) => (
            <button
              key={x.kind}
              type="button"
              role="tab"
              aria-selected={x.kind === active}
              onClick={() => setActive(x.kind)}
              className={`relative shrink-0 rounded-[var(--radius)] px-4 py-2 text-sm font-bold transition-colors ${
                x.kind === active ? "bg-highlight text-on-highlight" : "text-ink-2 hover:bg-sunken"
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>
      )}
      <form
        key={tab.kind}
        role="search"
        action={preview ? undefined : tab.href}
        className="mt-1 flex flex-col gap-1 md:flex-row md:items-center md:divide-x md:divide-line"
      >
        {fields}
        <div className="p-1 md:ps-2">
          <button
            type="submit"
            disabled={preview}
            className="magnetic flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-inverse px-7 font-bold text-ink-inverse transition-colors hover:bg-inverse-raised disabled:pointer-events-none md:w-auto"
          >
            <Search className="size-5" /> {t("b2c.search.go")}
          </button>
        </div>
      </form>
    </div>
  );
}
