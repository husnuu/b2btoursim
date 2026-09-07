"use client";

import { useState, type ReactNode } from "react";
import { TextAreaField } from "@/components/primitives/Field";
import { LanguageTabs } from "@/components/primitives/LanguageTabs";
import { translateTextToEnglish } from "@/lib/ai-mock";
import type { TourDraft } from "@/lib/tour";
import { clearTranslation, patchTranslation } from "@/lib/translation";
import type { StepProps } from "./shared";

type TranslatableField = "knowBeforeYouGo" | "whatToBring";

/**
 * Bilinmesi Gerekenler (3.8) ve Yanında Ne Getirmeli (3.9) — tek çok
 * satırlı metin alanı + TR/EN çeviri sekmesi. `extra` slotu Bilinmesi
 * Gerekenler'in Zorluk Seviyesi alanı için kullanılır.
 */
export function RichTextStep({
  draft,
  onChange,
  field,
  label,
  hint,
  required,
  extra,
}: StepProps & {
  field: TranslatableField;
  label: string;
  hint?: string;
  required?: boolean;
  extra?: ReactNode;
}) {
  const [lang, setLang] = useState<"tr" | "en">("tr");
  const [translating, setTranslating] = useState(false);

  const translation = draft.translations.en;

  const translate = () => {
    setTranslating(true);
    setTimeout(() => {
      onChange(patchTranslation(draft, { [field]: translateTextToEnglish(draft[field]) }));
      setTranslating(false);
    }, 400);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <LanguageTabs
          lang={lang}
          onLangChange={setLang}
          hasTranslation={Boolean(translation)}
          translating={translating}
          onTranslate={translate}
          onClear={() => onChange(clearTranslation())}
        />
        {lang === "tr" ? (
          <TextAreaField
            label={label}
            hint={hint}
            required={required}
            rows={10}
            value={draft[field]}
            onChange={(e) => onChange({ [field]: e.target.value } as Partial<TourDraft>)}
          />
        ) : (
          <TextAreaField
            label={`${label} (İngilizce)`}
            rows={10}
            value={translation?.[field] ?? ""}
            onChange={(e) => onChange(patchTranslation(draft, { [field]: e.target.value, auto: false }))}
          />
        )}
      </div>
      {extra}
    </div>
  );
}
