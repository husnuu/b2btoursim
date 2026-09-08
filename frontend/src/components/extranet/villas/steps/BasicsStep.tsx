"use client";

import { useState } from "react";
import { NumberField, SelectField, TextAreaField, TextField } from "@/components/primitives/Field";
import { LanguageTabs } from "@/components/primitives/LanguageTabs";
import { translateTextToEnglish } from "@/lib/ai-mock";
import { slugify } from "@/lib/tour";
import type { VillaTranslation } from "@/lib/villa";
import type { VillaStepProps } from "./shared";

const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];
const emptyTranslation = (): VillaTranslation => ({ title: "", description: "", auto: false });

/** 3.1 Villa Adı ve Açıklama. */
export function BasicsStep({ villa, onChange }: VillaStepProps) {
  const [lang, setLang] = useState<"tr" | "en">("tr");
  const [translating, setTranslating] = useState(false);
  const translation = villa.translations.en;

  const patchTranslation = (patch: Partial<VillaTranslation>) =>
    onChange({ translations: { ...villa.translations, en: { ...(translation ?? emptyTranslation()), ...patch } } });

  const translateAll = () => {
    setTranslating(true);
    setTimeout(() => {
      patchTranslation({ title: translateTextToEnglish(villa.title), description: translateTextToEnglish(villa.description), auto: true });
      setTranslating(false);
    }, 400);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <LanguageTabs lang={lang} onLangChange={setLang} hasTranslation={Boolean(translation)} translating={translating} onTranslate={translateAll} onClear={() => onChange({ translations: {} })} />
        {lang === "tr" ? (
          <div className="flex flex-col gap-4">
            <TextField
              label="Başlık"
              required
              value={villa.title}
              onChange={(e) => {
                const title = e.target.value;
                const slugFollowsTitle = villa.slug === slugify(villa.title);
                onChange({ title, slug: slugFollowsTitle ? slugify(title) : villa.slug });
              }}
              placeholder="ör. Kalkan'da Deniz Manzaralı Lüks Villa"
            />
            <TextAreaField label="Villa Hakkında Genel Açıklama" rows={8} value={villa.description} onChange={(e) => onChange({ description: e.target.value })} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <TextField label="Başlık (İngilizce)" value={translation?.title ?? ""} onChange={(e) => patchTranslation({ title: e.target.value, auto: false })} />
            <TextAreaField label="Genel Açıklama (İngilizce)" rows={8} value={translation?.description ?? ""} onChange={(e) => patchTranslation({ description: e.target.value, auto: false })} />
          </div>
        )}
      </div>

      <TextField label="Slug" required value={villa.slug} onChange={(e) => onChange({ slug: slugify(e.target.value) })} />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Fiyat Para Birimi" hint="Değiştirmenin satışlar üzerinde anında etkisi olur." value={villa.priceCurrency} onChange={(e) => onChange({ priceCurrency: e.target.value })}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>
        <NumberField label="Gecelik Fiyat" min={0} value={villa.nightlyRate / 100} onChange={(e) => onChange({ nightlyRate: Math.round(Number(e.target.value) * 100) })} />
      </div>
    </div>
  );
}
