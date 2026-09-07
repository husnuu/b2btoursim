"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { TextAreaField } from "@/components/primitives/Field";
import { LanguageTabs } from "@/components/primitives/LanguageTabs";
import { generateFromPrompt, translateTextToEnglish, uniqueify } from "@/lib/ai-mock";
import { clearTranslation, patchTranslation } from "@/lib/translation";
import type { StepProps } from "./shared";

/** 3.5 Tur Detayı (Açıklama) — AI destekli üretim + çoklu dil. */
export function DescriptionStep({ draft, onChange }: StepProps) {
  const [lang, setLang] = useState<"tr" | "en">("tr");
  const [translating, setTranslating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");

  const translation = draft.translations.en;

  const translateDescription = () => {
    setTranslating(true);
    setTimeout(() => {
      onChange(patchTranslation(draft, { description: translateTextToEnglish(draft.description) }));
      setTranslating(false);
    }, 400);
  };

  const runUniqueify = () => {
    setGenerating(true);
    setTimeout(() => {
      onChange({ description: uniqueify(draft.description) });
      setGenerating(false);
    }, 500);
  };

  const runGenerateFromPrompt = () => {
    setGenerating(true);
    setTimeout(() => {
      onChange({
        description: generateFromPrompt(prompt, {
          title: draft.title,
          startLocation: draft.startLocation,
        }),
      });
      setGenerating(false);
    }, 500);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <LanguageTabs
          lang={lang}
          onLangChange={setLang}
          hasTranslation={Boolean(translation)}
          translating={translating}
          onTranslate={translateDescription}
          onClear={() => onChange(clearTranslation())}
        />
        {lang === "tr" ? (
          <TextAreaField
            label="Açıklama"
            required
            rows={10}
            value={draft.description}
            onChange={(e) => onChange({ description: e.target.value })}
            hint="Müşteriye gösterilecek ana pazarlama metni."
          />
        ) : (
          <TextAreaField
            label="Açıklama (İngilizce)"
            rows={10}
            value={translation?.description ?? ""}
            onChange={(e) => onChange(patchTranslation(draft, { description: e.target.value, auto: false }))}
          />
        )}
      </div>

      {lang === "tr" && (
        <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line p-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={runUniqueify}
              disabled={generating || !draft.description.trim()}
            >
              {generating ? "Üretiliyor…" : "Yapay Zeka ile Benzersiz Hale Getirin"}
            </Button>
            <span className="text-[length:var(--font-ui-xs)] text-ink-3">
              Kopya içerik/SEO cezasından kaçınmak için mevcut metni yeniden yazar.
            </span>
          </div>
          <div className="flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="ör. daha macera odaklı yaz"
              className="h-8 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5
                         text-[length:var(--font-ui-sm)] text-ink outline-none placeholder:text-ink-3 focus:border-action"
            />
            <Button type="button" size="sm" onClick={runGenerateFromPrompt} disabled={generating}>
              {generating ? "Üretiliyor…" : "İsteğe Göre Üret"}
            </Button>
          </div>
        </div>
      )}

      <TextAreaField
        label="Ekstra Turlar (serbest not)"
        rows={3}
        value={draft.extraNotes}
        onChange={(e) => onChange({ extraNotes: e.target.value })}
        hint="Açıklamaya ek, isteğe bağlı tamamlayıcı bilgi metni."
      />
    </div>
  );
}
