"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { LanguageTabs } from "@/components/primitives/LanguageTabs";
import { translateTextToEnglish } from "@/lib/ai-mock";
import type { TourDraft } from "@/lib/tour";
import { clearTranslation, patchTranslation } from "@/lib/translation";
import type { StepProps } from "./shared";

function TagListEditor({
  label,
  items,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
}) {
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
          className="h-9 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5
                     text-[length:var(--font-ui)] text-ink outline-none placeholder:text-ink-3 focus:border-action"
        />
        <Button type="button" onClick={submit}>
          Ekle
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-line px-2.5 py-1.5"
            >
              <span className="text-[length:var(--font-ui)] text-ink">{item}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`${item} kaldır`}
                className="text-ink-3 hover:text-danger"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 3.7 Dahil Olanlar / Dahil Olmayanlar */
export function IncludesExcludesStep({ draft, onChange }: StepProps) {
  const [lang, setLang] = useState<"tr" | "en">("tr");
  const [translating, setTranslating] = useState(false);
  const translation = draft.translations.en;

  const listPatch = (field: "includes" | "excludes", next: string[]) =>
    onChange({ [field]: next } as Partial<TourDraft>);

  const translationListPatch = (field: "includes" | "excludes", next: string[]) =>
    onChange(patchTranslation(draft, { [field]: next, auto: false }));

  const translateAll = () => {
    setTranslating(true);
    setTimeout(() => {
      onChange(
        patchTranslation(draft, {
          includes: draft.includes.map(translateTextToEnglish),
          excludes: draft.excludes.map(translateTextToEnglish),
        }),
      );
      setTranslating(false);
    }, 400);
  };

  return (
    <div className="flex flex-col gap-6">
      <LanguageTabs
        lang={lang}
        onLangChange={setLang}
        hasTranslation={Boolean(translation)}
        translating={translating}
        onTranslate={translateAll}
        onClear={() => onChange(clearTranslation())}
      />
      {lang === "tr" ? (
        <>
          <TagListEditor
            label="Dahil Olanlar"
            items={draft.includes}
            placeholder="ör. Rehberlik"
            onAdd={(value) => listPatch("includes", [...draft.includes, value])}
            onRemove={(index) => listPatch("includes", draft.includes.filter((_, i) => i !== index))}
          />
          <TagListEditor
            label="Dahil Olmayanlar"
            items={draft.excludes}
            placeholder="ör. Kişisel harcamalar"
            onAdd={(value) => listPatch("excludes", [...draft.excludes, value])}
            onRemove={(index) => listPatch("excludes", draft.excludes.filter((_, i) => i !== index))}
          />
        </>
      ) : (
        <>
          <TagListEditor
            label="Dahil Olanlar (İngilizce)"
            items={translation?.includes ?? []}
            placeholder="e.g. Guiding"
            onAdd={(value) => translationListPatch("includes", [...(translation?.includes ?? []), value])}
            onRemove={(index) =>
              translationListPatch("includes", (translation?.includes ?? []).filter((_, i) => i !== index))
            }
          />
          <TagListEditor
            label="Dahil Olmayanlar (İngilizce)"
            items={translation?.excludes ?? []}
            placeholder="e.g. Personal expenses"
            onAdd={(value) => translationListPatch("excludes", [...(translation?.excludes ?? []), value])}
            onRemove={(index) =>
              translationListPatch("excludes", (translation?.excludes ?? []).filter((_, i) => i !== index))
            }
          />
        </>
      )}
    </div>
  );
}
