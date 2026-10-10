"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  WEEKDAYS,
  MONTHS,
  addDays,
  dateLong,
  dateShort,
  daysInMonth,
  firstWeekdayOffset,
  monthTitle,
  parseDate,
  toISO,
  todayIstanbul,
} from "@/lib/storefront/tarih";
import { IconCalendar, IconChevronLeft, IconChevronRight } from "./icons";

/**
 * Türkçe tarih seçici (VITRIN.md §4.7, referans §5). Yerel `<input type="date">`
 * yerine: tarayıcı diline göre `mm/dd/yyyy` çıkmasın, geçmiş tarih
 * engellenebilsin, "çıkış girişten sonra" kuralı zorlanabilsin.
 *
 * Takvim YALNIZ açıkken render edilir; `new Date()` sunucuda çalışmaz,
 * hidrasyon uyuşmazlığı olmaz. `name` verilirse gizli input ile forma
 * katılır (GET arama formları). `mode="gecmis"` doğum tarihi gibi alanlar
 * için: ay ve yıl doğrudan seçilir, ileri tarih kapalı.
 */
export function DateField({
  label,
  value,
  onChange,
  name,
  min,
  max,
  minNote,
  bare = false,
  mode = "gelecek",
  disabled = false,
  /** Yalnız bu günler seçilebilsin (kalkış takvimi). */
  allowed,
  placeholder = "Tarih seçin",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  name?: string;
  min?: string;
  max?: string;
  minNote?: string;
  bare?: boolean;
  mode?: "gelecek" | "gecmis";
  disabled?: boolean;
  allowed?: Set<string> | string[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const shell = bare
    ? "w-full bg-transparent text-start"
    : "h-10 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 text-start focus:border-action";

  return (
    <div ref={wrap} className={`relative ${className}`}>
      <label htmlFor={id} className={bare ? "sr-only" : "mb-1 block text-[length:var(--font-ui-sm)] text-ink-2"}>
        {label}
      </label>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`tnum flex items-center gap-2 text-[length:var(--font-ui)] outline-none disabled:cursor-not-allowed disabled:opacity-60 ${shell} ${
          value ? "text-ink" : "text-ink-3"
        }`}
      >
        {!bare && <IconCalendar size={14} className="shrink-0 text-ink-3" />}
        <span className="truncate">{value ? dateShort(value) : placeholder}</span>
      </button>
      {name && <input type="hidden" name={name} value={value} />}
      {minNote && !bare && <p className="mt-1 text-[length:var(--font-ui-xs)] text-ink-3">{minNote}</p>}

      {open && (
        <Calendar
          value={value}
          min={min}
          max={max}
          mode={mode}
          allowed={allowed ? new Set(allowed) : null}
          onPick={(iso) => {
            onChange(iso);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Calendar({
  value,
  min,
  max,
  mode,
  allowed,
  onPick,
}: {
  value: string;
  min?: string;
  max?: string;
  mode: "gelecek" | "gecmis";
  allowed: Set<string> | null;
  onPick: (iso: string) => void;
}) {
  // Bugün yalnız burada okunur: takvim açıkken, istemcide.
  const today = todayIstanbul();
  const lo = mode === "gelecek" ? (min && min > today ? min : min ?? today) : min ?? addDays(today, -101 * 365);
  const hi = mode === "gecmis" ? (max && max < today ? max : today) : max ?? null;
  const start = parseDate(value) ?? parseDate(lo) ?? parseDate(today)!;
  const [view, setView] = useState({ y: start.y, m: start.m });

  const [alignRight, setAlignRight] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Dar kolonda ekran dışına taşarsa sağa yasla.
    const el = popRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.right > window.innerWidth - 8) setAlignRight(true);
  }, []);

  const total = daysInMonth(view.y, view.m);
  const offset = firstWeekdayOffset(view.y, view.m);
  const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => toISO({ y: view.y, m: view.m, d: i + 1 }))];
  while (cells.length % 7) cells.push(null);

  const prev = () => setView((v) => (v.m === 1 ? { y: v.y - 1, m: 12 } : { y: v.y, m: v.m - 1 }));
  const next = () => setView((v) => (v.m === 12 ? { y: v.y + 1, m: 1 } : { y: v.y, m: v.m + 1 }));
  const years = mode === "gecmis"
    ? Array.from({ length: 101 }, (_, i) => Number(today.slice(0, 4)) - i)
    : Array.from({ length: 3 }, (_, i) => Number(today.slice(0, 4)) + i);

  const selectable = (iso: string) => {
    if (iso < lo) return false;
    if (hi && iso > hi) return false;
    if (allowed && !allowed.has(iso)) return false;
    return true;
  };

  return (
    <div
      ref={popRef}
      role="dialog"
      aria-label={monthTitle(view.y, view.m)}
      className={`absolute z-40 mt-1.5 w-[19rem] rounded-[var(--radius-lg)] border border-line bg-surface p-3 shadow-[var(--shadow-lift)] ${alignRight ? "end-0" : "start-0"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={prev} aria-label="Önceki ay" className="grid h-8 w-8 place-items-center rounded-full text-ink-2 hover:bg-sunken hover:text-ink">
          <IconChevronLeft />
        </button>
        {mode === "gecmis" ? (
          <span className="flex gap-1">
            <select aria-label="Ay" value={view.m} onChange={(e) => setView((v) => ({ ...v, m: Number(e.target.value) }))} className="h-8 rounded-[var(--radius)] border border-line bg-surface px-1 text-[length:var(--font-ui-sm)] text-ink">
              {MONTHS.map((mn, i) => (
                <option key={mn} value={i + 1}>{mn}</option>
              ))}
            </select>
            <select aria-label="Yıl" value={view.y} onChange={(e) => setView((v) => ({ ...v, y: Number(e.target.value) }))} className="tnum h-8 rounded-[var(--radius)] border border-line bg-surface px-1 text-[length:var(--font-ui-sm)] text-ink">
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </span>
        ) : (
          <span className="font-dense text-[length:var(--font-ui)] font-semibold text-ink">{monthTitle(view.y, view.m)}</span>
        )}
        <button type="button" onClick={next} aria-label="Sonraki ay" className="grid h-8 w-8 place-items-center rounded-full text-ink-2 hover:bg-sunken hover:text-ink">
          <IconChevronRight />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 text-center text-[11.5px] font-semibold text-ink-3">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1">{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((iso, i) =>
          iso ? (
            <button
              key={iso}
              type="button"
              disabled={!selectable(iso)}
              aria-label={dateLong(iso)}
              aria-pressed={iso === value}
              onClick={() => onPick(iso)}
              className={`tnum mx-auto grid h-9 w-9 place-items-center rounded-full text-[length:var(--font-ui-sm)] ${
                iso === value
                  ? "bg-action font-semibold text-on-action"
                  : iso === today
                    ? "font-semibold text-action hover:bg-action-tint"
                    : "text-ink hover:bg-sunken"
              } disabled:cursor-not-allowed disabled:text-ink-3/60 disabled:hover:bg-transparent`}
            >
              {Number(iso.slice(8, 10))}
            </button>
          ) : (
            <span key={`b${i}`} />
          ),
        )}
      </div>
    </div>
  );
}
