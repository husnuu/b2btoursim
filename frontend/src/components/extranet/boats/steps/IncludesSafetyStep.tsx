"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { NumberField, TextField } from "@/components/primitives/Field";
import { LanguageTabs } from "@/components/primitives/LanguageTabs";
import { translateTextToEnglish } from "@/lib/ai-mock";
import type { BoatTranslation } from "@/lib/boat";
import type { BoatStepProps } from "./shared";

const emptyTranslation = (): BoatTranslation => ({ title: "", description: "", whatToBring: "", includes: [], excludes: [], auto: false });

function TagListEditor({ label, items, onAdd, onRemove, placeholder }: { label: string; items: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const submit = () => {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft("");
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">{label}</span>
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
          placeholder={placeholder}
          className="h-9 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 text-[length:var(--font-ui)] text-ink outline-none placeholder:text-ink-3 focus:border-action"
        />
        <Button type="button" onClick={submit}>
          Ekle
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-line px-2.5 py-1.5">
              <span className="text-[length:var(--font-ui)] text-ink">{item}</span>
              <button type="button" onClick={() => onRemove(index)} aria-label={`${item} kaldır`} className="text-ink-3 hover:text-danger">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 3.5 Dahil Olanlar / Güvenlik Ekipmanları. */
export function IncludesSafetyStep({ boat, onChange }: BoatStepProps) {
  const [lang, setLang] = useState<"tr" | "en">("tr");
  const [translating, setTranslating] = useState(false);
  const translation = boat.translations.en;

  const patchTranslation = (patch: Partial<BoatTranslation>) =>
    onChange({ translations: { ...boat.translations, en: { ...(translation ?? emptyTranslation()), ...patch } } });

  const translateAll = () => {
    setTranslating(true);
    setTimeout(() => {
      patchTranslation({ includes: boat.includes.map(translateTextToEnglish), excludes: boat.excludes.map(translateTextToEnglish), auto: true });
      setTranslating(false);
    }, 400);
  };

  return (
    <div className="flex flex-col gap-6">
      <LanguageTabs lang={lang} onLangChange={setLang} hasTranslation={Boolean(translation)} translating={translating} onTranslate={translateAll} onClear={() => onChange({ translations: {} })} />

      {lang === "tr" ? (
        <>
          <TagListEditor label="Dahil Olanlar" items={boat.includes} placeholder="ör. Yakıt (kısa mesafe)" onAdd={(v) => onChange({ includes: [...boat.includes, v] })} onRemove={(i) => onChange({ includes: boat.includes.filter((_, idx) => idx !== i) })} />
          <TagListEditor label="Dahil Olmayanlar" items={boat.excludes} placeholder="ör. Liman ücretleri" onAdd={(v) => onChange({ excludes: [...boat.excludes, v] })} onRemove={(i) => onChange({ excludes: boat.excludes.filter((_, idx) => idx !== i) })} />
        </>
      ) : (
        <>
          <TagListEditor
            label="Dahil Olanlar (İngilizce)"
            items={translation?.includes ?? []}
            placeholder="e.g. Fuel (short distance)"
            onAdd={(v) => patchTranslation({ includes: [...(translation?.includes ?? []), v], auto: false })}
            onRemove={(i) => patchTranslation({ includes: (translation?.includes ?? []).filter((_, idx) => idx !== i), auto: false })}
          />
          <TagListEditor
            label="Dahil Olmayanlar (İngilizce)"
            items={translation?.excludes ?? []}
            placeholder="e.g. Marina fees"
            onAdd={(v) => patchTranslation({ excludes: [...(translation?.excludes ?? []), v], auto: false })}
            onRemove={(i) => patchTranslation({ excludes: (translation?.excludes ?? []).filter((_, idx) => idx !== i), auto: false })}
          />
        </>
      )}

      <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line p-3">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">Güvenlik Ekipmanları Beyanı</span>
        <p className="text-[length:var(--font-ui-xs)] text-ink-3">Denizcilik mevzuatına uyum için tedarikçi beyanıdır; bu prototip resmi bir denetim yapmaz.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField label="Can yeleği sayısı" min={0} value={boat.safetyEquipment.lifejacketCount} onChange={(e) => onChange({ safetyEquipment: { ...boat.safetyEquipment, lifejacketCount: Number(e.target.value) } })} />
          <label className="flex items-end gap-2 pb-2">
            <input type="checkbox" checked={boat.safetyEquipment.hasLifeRaft} onChange={(e) => onChange({ safetyEquipment: { ...boat.safetyEquipment, hasLifeRaft: e.target.checked } })} className="h-4 w-4 accent-[var(--action-primary)]" />
            <span className="text-[length:var(--font-ui)] text-ink">Can salı var</span>
          </label>
          <label className="flex items-end gap-2 pb-2">
            <input type="checkbox" checked={boat.safetyEquipment.hasFireExtinguisher} onChange={(e) => onChange({ safetyEquipment: { ...boat.safetyEquipment, hasFireExtinguisher: e.target.checked } })} className="h-4 w-4 accent-[var(--action-primary)]" />
            <span className="text-[length:var(--font-ui)] text-ink">Yangın söndürücü var</span>
          </label>
        </div>
        <TextField label="Ek not" value={boat.safetyEquipment.notes} onChange={(e) => onChange({ safetyEquipment: { ...boat.safetyEquipment, notes: e.target.value } })} />
      </div>
    </div>
  );
}
