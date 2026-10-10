"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { availability, type Availability } from "@/content/vitrin";

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const DAYS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const formatTr = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

const tone: Record<Availability, string> = {
  open: "hover:bg-pop-soft",
  few: "hover:bg-amber-soft",
  full: "text-ink/25 line-through",
  closed: "text-ink/25",
};

/** Ay görünümlü takvim; her gün örnek müsaitliğe göre işaretlenir. */
export function AvailabilityCalendar({ slug, value, onChange, available }: { slug: string; value: string; onChange: (v: string) => void; available?: string[] }) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const cells = useMemo(() => {
    const first = new Date(cursor);
    const offset = (first.getDay() + 6) % 7; // Pazartesi başlangıç
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: days }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
    ];
  }, [cursor]);

  const atStart = cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();
  const move = (d: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + d, 1));

  return (
    <div className="rounded-2xl border-[1.5px] border-ink/15 p-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => move(-1)} disabled={atStart} aria-label="Önceki ay" className="grid size-9 place-items-center rounded-lg hover:bg-mist disabled:opacity-25">
          <ChevronLeft className="size-4" />
        </button>
        <p key={cursor.toISOString()} className="tab-in font-bold" aria-live="polite">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </p>
        <button type="button" onClick={() => move(1)} aria-label="Sonraki ay" className="grid size-9 place-items-center rounded-lg hover:bg-mist">
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-7 text-center text-[11px] font-semibold text-ink-3">
        {DAYS.map((d) => <span key={d} className="py-1">{d}</span>)}
      </div>
      <div role="grid" aria-label="Tarih seçin" className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const key = iso(d);
          const past = d < today;
          const a: Availability = past ? "closed" : availability(slug, key, available);
          const disabled = past || a === "full" || a === "closed";
          const selected = value === key;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={`${formatTr(key)}${a === "few" ? ", son yerler" : a === "full" ? ", dolu" : ""}`}
              onClick={() => onChange(key)}
              className={`relative aspect-square rounded-lg text-sm font-semibold tabular-nums transition-colors ${
                selected ? "bg-ink text-white" : tone[a]
              } disabled:cursor-not-allowed`}
            >
              {d.getDate()}
              {!disabled && !selected && (
                <span className={`absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full ${a === "few" ? "bg-amber" : "bg-pop-deep"}`} />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-[12px] text-ink-3">
        <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-pop-deep" /> Müsait</span>
        <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-amber" /> Son yerler</span>
        <span className="flex items-center gap-1.5"><s>12</s> Dolu</span>
      </div>
    </div>
  );
}
