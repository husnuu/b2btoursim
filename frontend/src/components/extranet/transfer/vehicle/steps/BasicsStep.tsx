"use client";

import { useState } from "react";
import { NumberField, SelectField, TextAreaField, TextField } from "@/components/primitives/Field";
import { LanguageTabs } from "@/components/primitives/LanguageTabs";
import { translateTextToEnglish } from "@/lib/ai-mock";
import type { VehicleType } from "@/lib/transfer";
import type { VehicleStepProps } from "./shared";

/** 1.2 adım 2 — Başlık, Açıklama ve Kapasite. */
export function BasicsStep({ vehicle, onChange }: VehicleStepProps) {
  const [lang, setLang] = useState<"tr" | "en">("tr");
  const [translating, setTranslating] = useState(false);
  const translation = vehicle.translations.en;

  const translate = () => {
    setTranslating(true);
    setTimeout(() => {
      onChange({
        translations: {
          ...vehicle.translations,
          en: {
            title: translateTextToEnglish(vehicle.title),
            description: translateTextToEnglish(vehicle.description),
            auto: true,
          },
        },
      });
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
          onClear={() => onChange({ translations: {} })}
        />
        {lang === "tr" ? (
          <div className="flex flex-col gap-4">
            <TextField
              label="Araç Başlığı"
              required
              value={vehicle.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="ör. VIP Mercedes Maybach Private"
            />
            <TextAreaField
              label="Araç Açıklaması"
              rows={6}
              value={vehicle.description}
              onChange={(e) => onChange({ description: e.target.value })}
              hint="Aracın temel özellikleri, konfor seviyesi ve hangi tür misafirlere uygun olduğu."
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <TextField
              label="Araç Başlığı (İngilizce)"
              value={translation?.title ?? ""}
              onChange={(e) =>
                onChange({
                  translations: {
                    ...vehicle.translations,
                    en: {
                      title: e.target.value,
                      description: translation?.description ?? "",
                      auto: false,
                    },
                  },
                })
              }
            />
            <TextAreaField
              label="Araç Açıklaması (İngilizce)"
              rows={6}
              value={translation?.description ?? ""}
              onChange={(e) =>
                onChange({
                  translations: {
                    ...vehicle.translations,
                    en: {
                      title: translation?.title ?? "",
                      description: e.target.value,
                      auto: false,
                    },
                  },
                })
              }
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          label="Araç Tipi"
          hint="Bu seçim fiyatlandırma adımındaki hesap mantığını belirler."
          value={vehicle.vehicleType}
          onChange={(e) => onChange({ vehicleType: e.target.value as VehicleType })}
        >
          <option value="private">Private (araç başına fiyatlandırma)</option>
          <option value="shuttle">Shuttle (kişi başı fiyatlandırma)</option>
        </SelectField>
        <NumberField
          label="Koltuk Sayısı"
          min={1}
          value={vehicle.seatCapacity}
          onChange={(e) => onChange({ seatCapacity: Number(e.target.value) })}
        />
        <NumberField
          label="Bagaj Kapasitesi"
          min={0}
          value={vehicle.luggageCapacity}
          onChange={(e) => onChange({ luggageCapacity: Number(e.target.value) })}
        />
      </div>

      {vehicle.pricingModel === "saatlikKiralama" && (
        <NumberField
          label="Saatlik ücret"
          required
          min={0}
          value={(vehicle.hourlyRate ?? 0) / 100}
          onChange={(e) => onChange({ hourlyRate: Math.round(Number(e.target.value) * 100) })}
          hint="Saatlik ücreti olmayan araç, kiralama aramasında listelenmez."
          className="max-w-xs"
        />
      )}
    </div>
  );
}
