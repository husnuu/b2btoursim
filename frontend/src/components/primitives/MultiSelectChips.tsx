"use client";

import { useState } from "react";
import { Button } from "./Button";

export type ChipOption = { id: string; label: string };

/**
 * Çip tabanlı çoklu seçim + satır içi "yeni ekle" — Tur Oluştur
 * sihirbazındaki Etiket seçicisinin genellenmiş hali. Araç özellikleri,
 * araç ekstraları ve popüler rota araç seçiminde tekrar kullanılır.
 */
export function MultiSelectChips({
  options,
  selectedIds,
  onToggle,
  onAddNew,
  addPlaceholder = "Yeni ekle",
}: {
  options: ChipOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onAddNew?: (label: string) => void;
  addPlaceholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const submit = () => {
    const value = draft.trim();
    if (!value || !onAddNew) return;
    onAddNew(value);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const on = selectedIds.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToggle(option.id)}
              className={`rounded-full border px-3 py-1 text-[length:var(--font-ui-sm)] ${
                on
                  ? "border-action bg-action text-on-action"
                  : "border-line-strong bg-surface text-ink-2 hover:border-ink-3"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {onAddNew && (
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={addPlaceholder}
            className="h-8 w-full max-w-xs rounded-[var(--radius)] border border-line-strong bg-surface px-2.5
                       text-[length:var(--font-ui-sm)] text-ink outline-none placeholder:text-ink-3 focus:border-action"
          />
          <Button type="button" size="sm" onClick={submit}>
            Ekle
          </Button>
        </div>
      )}
    </div>
  );
}
