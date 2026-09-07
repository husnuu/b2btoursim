"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { LanguageTabs } from "@/components/primitives/LanguageTabs";
import { SelectField, TextField } from "@/components/primitives/Field";
import { translateTextToEnglish } from "@/lib/ai-mock";
import { slugify, type ProgramType, type TourKind } from "@/lib/tour";
import { clearTranslation, patchTranslation } from "@/lib/translation";
import { useTourCatalog } from "@/lib/tour-store";
import type { StepProps } from "./shared";

const TOUR_KINDS: { value: TourKind; label: string }[] = [
  { value: "gunubirlik", label: "Günübirlik" },
  { value: "cokGunlu", label: "Çok Günlü" },
  { value: "ozel", label: "Özel Tur" },
  { value: "konaklamali", label: "Konaklamalı" },
];

const PROGRAM_TYPES: { value: ProgramType; label: string }[] = [
  { value: "tur", label: "Tur" },
  { value: "aktivite", label: "Aktivite" },
  { value: "transfer", label: "Transfer" },
  { value: "bilet", label: "Bilet" },
];

const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];

/** 3.1 Başlık ve Tür — MVP + FAZ2 + FAZ3 alanları. */
export function BasicsStep({ draft, onChange }: StepProps) {
  const { tags, addTourTag } = useTourCatalog();
  const [lang, setLang] = useState<"tr" | "en">("tr");
  const [translating, setTranslating] = useState(false);
  const [newTag, setNewTag] = useState("");

  const translation = draft.translations.en;

  const translateTitle = () => {
    setTranslating(true);
    setTimeout(() => {
      onChange(patchTranslation(draft, { title: translateTextToEnglish(draft.title) }));
      setTranslating(false);
    }, 400);
  };

  const toggleTag = (id: string) => {
    onChange({
      tagIds: draft.tagIds.includes(id)
        ? draft.tagIds.filter((t) => t !== id)
        : [...draft.tagIds, id],
    });
  };

  const addTag = () => {
    const name = newTag.trim();
    if (!name) return;
    const created = addTourTag({ name });
    onChange({ tagIds: [...draft.tagIds, created.id] });
    setNewTag("");
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <LanguageTabs
          lang={lang}
          onLangChange={setLang}
          hasTranslation={Boolean(translation)}
          translating={translating}
          onTranslate={translateTitle}
          onClear={() => onChange(clearTranslation())}
        />
        {lang === "tr" ? (
          <TextField
            label="Başlık"
            required
            value={draft.title}
            onChange={(e) => {
              const title = e.target.value;
              const slugFollowsTitle = draft.slug === slugify(draft.title);
              onChange({
                title,
                slug: slugFollowsTitle ? slugify(title) : draft.slug,
              });
            }}
            placeholder="Kapadokya sıcak hava balonu — gün doğumu"
          />
        ) : (
          <TextField
            label="Başlık (İngilizce)"
            value={translation?.title ?? ""}
            onChange={(e) => onChange(patchTranslation(draft, { title: e.target.value, auto: false }))}
            placeholder="Cappadocia hot air balloon — sunrise"
          />
        )}
      </div>

      <TextField
        label="Slug"
        hint="URL parçası; başlıktan otomatik türetilir, elle düzenlenebilir."
        required
        value={draft.slug}
        onChange={(e) => onChange({ slug: slugify(e.target.value) })}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Ürün Türü"
          hint="Kategori ile birlikte filtrelemede kullanılır."
          value={draft.tourKind ?? ""}
          onChange={(e) => onChange({ tourKind: (e.target.value || null) as TourKind | null })}
        >
          <option value="">Seçilmedi</option>
          {TOUR_KINDS.map((kind) => (
            <option key={kind.value} value={kind.value}>
              {kind.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Program Tipi"
          hint="Ürünün hangi paket tipinde satıldığını işaretler; boş bırakılabilir."
          value={draft.programType ?? ""}
          onChange={(e) => onChange({ programType: (e.target.value || null) as ProgramType | null })}
        >
          <option value="">Seçilmedi</option>
          {PROGRAM_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">Etiket</span>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const on = draft.tagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`rounded-full border px-3 py-1 text-[length:var(--font-ui-sm)] ${
                  on
                    ? "border-action bg-action text-on-action"
                    : "border-line-strong bg-surface text-ink-2 hover:border-ink-3"
                }`}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Yeni etiket adı"
            className="h-8 w-full max-w-xs rounded-[var(--radius)] border border-line-strong bg-surface px-2.5
                       text-[length:var(--font-ui-sm)] text-ink outline-none placeholder:text-ink-3 focus:border-action"
          />
          <Button type="button" size="sm" onClick={addTag}>
            Ekle
          </Button>
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={draft.showOnWebsite}
          onChange={(e) => onChange({ showOnWebsite: e.target.checked })}
          className="h-4 w-4 accent-[var(--action-primary)]"
        />
        <span className="text-[length:var(--font-ui)] text-ink">
          Web sitesinde göster
        </span>
      </label>
      <p className="-mt-3 text-[length:var(--font-ui-sm)] text-ink-3">
        Kapalıyken ürün yalnızca dahili/B2B kanaldan satılabilir, B2C
        vitrinde görünmez.
      </p>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={draft.askForPrice}
          onChange={(e) => onChange({ askForPrice: e.target.checked })}
          className="h-4 w-4 accent-[var(--action-primary)]"
        />
        <span className="text-[length:var(--font-ui)] text-ink">Fiyat Sor</span>
      </label>
      <p className="-mt-3 text-[length:var(--font-ui-sm)] text-ink-3">
        Açıkken fiyat gizlenir, &quot;Fiyat Teklifi İste&quot; akışına
        yönlendirir (B2B özel fiyatlı ürünler için).
      </p>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={draft.forcedCurrency}
          onChange={(e) => onChange({ forcedCurrency: e.target.checked })}
          className="h-4 w-4 accent-[var(--action-primary)]"
        />
        <span className="text-[length:var(--font-ui)] text-ink">Zorunlu Para Birimi</span>
      </label>
      <p className="-mt-3 text-[length:var(--font-ui-sm)] text-ink-3">
        Açıldığında müşterinin görüntüleme para birimini değiştirmesi
        engellenir; fiyat her zaman aşağıdaki para biriminde sabit kalır.
      </p>

      <SelectField
        label="Etiket Fiyatı Para Birimi"
        hint="Bu ürüne özel satış para birimi; tenant varsayılanını geçersiz kılar."
        value={draft.listCurrencyOverride ?? ""}
        onChange={(e) => onChange({ listCurrencyOverride: e.target.value || null })}
      >
        <option value="">Tenant varsayılanı</option>
        {CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </SelectField>
    </div>
  );
}
