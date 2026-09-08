"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { TextAreaField } from "@/components/primitives/Field";
import { LanguageTabs } from "@/components/primitives/LanguageTabs";
import { generateFromPrompt, translateTextToEnglish, uniqueify } from "@/lib/ai-mock";
import type { BoatTranslation } from "@/lib/boat";
import type { BoatStepProps } from "./shared";

const emptyTranslation = (): BoatTranslation => ({ title: "", description: "", whatToBring: "", includes: [], excludes: [], auto: false });

/** 3.3 Açıklama ve Yanında Ne Getirmeli — Tur'daki DescriptionStep ile aynı AI davranışı. */
export function DescriptionStep({ boat, onChange }: BoatStepProps) {
  const [lang, setLang] = useState<"tr" | "en">("tr");
  const [translating, setTranslating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");

  const translation = boat.translations.en;

  const patchTranslation = (patch: Partial<BoatTranslation>) =>
    onChange({ translations: { ...boat.translations, en: { ...(translation ?? emptyTranslation()), ...patch } } });

  const translateAll = () => {
    setTranslating(true);
    setTimeout(() => {
      patchTranslation({ description: translateTextToEnglish(boat.description), whatToBring: translateTextToEnglish(boat.whatToBring), auto: true });
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
          onTranslate={translateAll}
          onClear={() => onChange({ translations: {} })}
        />
        {lang === "tr" ? (
          <TextAreaField
            label="Açıklama"
            required
            rows={8}
            value={boat.description}
            onChange={(e) => onChange({ description: e.target.value })}
            hint="Tekne deneyimini, uygun olduğu grup tipini (aile, kurumsal, kutlama) anlatan ana metin."
          />
        ) : (
          <TextAreaField label="Açıklama (İngilizce)" rows={8} value={translation?.description ?? ""} onChange={(e) => patchTranslation({ description: e.target.value, auto: false })} />
        )}
      </div>

      {lang === "tr" && (
        <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line p-3">
          <Button
            type="button"
            size="sm"
            className="self-start"
            disabled={generating || !boat.description.trim()}
            onClick={() => {
              setGenerating(true);
              setTimeout(() => {
                onChange({ description: uniqueify(boat.description) });
                setGenerating(false);
              }, 500);
            }}
          >
            {generating ? "Üretiliyor…" : "Yapay Zeka ile Benzersiz Hale Getirin"}
          </Button>
          <div className="flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="ör. aile dostu ve sakin bir gezi vurgusuyla yaz"
              className="h-8 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 text-[length:var(--font-ui-sm)] text-ink outline-none placeholder:text-ink-3 focus:border-action"
            />
            <Button
              type="button"
              size="sm"
              disabled={generating}
              onClick={() => {
                setGenerating(true);
                setTimeout(() => {
                  onChange({ description: generateFromPrompt(prompt, { title: boat.title, startLocation: "" }) });
                  setGenerating(false);
                }, 500);
              }}
            >
              {generating ? "Üretiliyor…" : "İsteğe Göre Üret"}
            </Button>
          </div>
        </div>
      )}

      {lang === "tr" ? (
        <TextAreaField
          label="Yanında Ne Getirmeli"
          rows={4}
          value={boat.whatToBring}
          onChange={(e) => onChange({ whatToBring: e.target.value })}
          hint="Güneş kremi, yedek kıyafet, deniz tutması ilacı gibi öneriler."
        />
      ) : (
        <TextAreaField label="Yanında Ne Getirmeli (İngilizce)" rows={4} value={translation?.whatToBring ?? ""} onChange={(e) => patchTranslation({ whatToBring: e.target.value, auto: false })} />
      )}
    </div>
  );
}
