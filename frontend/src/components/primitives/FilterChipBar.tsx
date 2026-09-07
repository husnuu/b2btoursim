"use client";

import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

export type ChipDef = { id: string; label: MessageKey; count?: number };

/**
 * MVP filtre yüzeyi: yatay çip şeridi (Bölüm 4). Faz 2'de masaüstü için
 * dikey sidebar eklenir, mobilde bu şerit kalır.
 *
 * Aynı bileşen iki yoğunlukta da çalışır; ölçek token'dan gelir.
 */
export function FilterChipBar({
  chips,
  active,
  onToggle,
  onClear,
}: {
  chips: ChipDef[];
  active: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => {
        const on = active.includes(chip.id);
        return (
          <button
            key={chip.id}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(chip.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1
                        text-[length:var(--font-ui-sm)] transition-colors ${
                          on
                            ? "border-action bg-action text-on-action"
                            : "border-line-strong bg-surface text-ink-2 hover:border-ink-3 hover:text-ink"
                        }`}
          >
            {t(chip.label)}
            {chip.count !== undefined && (
              <span className={`tnum ${on ? "opacity-75" : "text-ink-3"}`}>{chip.count}</span>
            )}
          </button>
        );
      })}
      {active.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="ms-1 rounded-[var(--radius)] px-2 py-1 text-[length:var(--font-ui-sm)]
                     text-ink-3 underline decoration-line-strong underline-offset-2 hover:text-ink"
        >
          {t("filters.clear")}
        </button>
      )}
    </div>
  );
}
