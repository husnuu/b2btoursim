"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { NumberField, SelectField, TextField } from "@/components/primitives/Field";
import { LanguageTabs } from "@/components/primitives/LanguageTabs";
import { translateTextToEnglish } from "@/lib/ai-mock";
import { slugify } from "@/lib/tour";
import { useBoatCatalog } from "@/lib/boat-store";
import type { BoatStepProps } from "./shared";

/** 3.1 Başlık ve Kategori. */
export function BasicsStep({ boat, onChange }: BoatStepProps) {
  const { categories, marinaPoints, addCategory, addMarinaPoint } = useBoatCatalog();
  const [lang, setLang] = useState<"tr" | "en">("tr");
  const [translating, setTranslating] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [addingMarina, setAddingMarina] = useState(false);
  const [newMarina, setNewMarina] = useState({ name: "", address: "", description: "" });

  const translation = boat.translations.en;

  const translateTitle = () => {
    setTranslating(true);
    setTimeout(() => {
      onChange({
        translations: { ...boat.translations, en: { ...(translation ?? { title: "", description: "", whatToBring: "", includes: [], excludes: [], auto: false }), title: translateTextToEnglish(boat.title), auto: true } },
      });
      setTranslating(false);
    }, 400);
  };

  const saveCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    const created = addCategory({ title: name, slug: slugify(name) });
    onChange({ categoryId: created.id });
    setNewCategory("");
    setAddingCategory(false);
  };

  const saveMarina = () => {
    if (!newMarina.name.trim()) return;
    const created = addMarinaPoint(newMarina);
    onChange({ mainMarinaId: created.id });
    setNewMarina({ name: "", address: "", description: "" });
    setAddingMarina(false);
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
          onClear={() => onChange({ translations: {} })}
        />
        {lang === "tr" ? (
          <TextField
            label="Başlık"
            required
            value={boat.title}
            onChange={(e) => {
              const title = e.target.value;
              const slugFollowsTitle = boat.slug === slugify(boat.title);
              onChange({ title, slug: slugFollowsTitle ? slugify(title) : boat.slug });
            }}
            hint="20-80 karakter arası önerilir."
            placeholder="ör. 45ft Lüks Gulet — Kaptanlı"
          />
        ) : (
          <TextField
            label="Başlık (İngilizce)"
            value={translation?.title ?? ""}
            onChange={(e) =>
              onChange({
                translations: { ...boat.translations, en: { ...(translation ?? { title: "", description: "", whatToBring: "", includes: [], excludes: [], auto: false }), title: e.target.value, auto: false } },
              })
            }
          />
        )}
      </div>

      <TextField label="Slug" required value={boat.slug} onChange={(e) => onChange({ slug: slugify(e.target.value) })} />
      <TextField
        label="Dahili Kısa Ad"
        value={boat.internalShortName}
        onChange={(e) => onChange({ internalShortName: e.target.value })}
        hint="Yalnızca filo yönetiminde görünür, müşteriye gösterilmez."
      />

      <div className="flex flex-col gap-2">
        <SelectField
          label="Kategori"
          required
          value={boat.categoryId ?? ""}
          onChange={(e) => onChange({ categoryId: e.target.value || null })}
        >
          <option value="">Seçilmedi</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </SelectField>
        {!addingCategory ? (
          <Button type="button" size="sm" className="self-start" onClick={() => setAddingCategory(true)}>
            + Yeni kategori
          </Button>
        ) : (
          <div className="flex gap-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="h-8 w-full max-w-xs rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 text-[length:var(--font-ui-sm)] text-ink outline-none focus:border-action"
            />
            <Button type="button" size="sm" onClick={saveCategory}>
              Ekle
            </Button>
          </div>
        )}
      </div>

      <NumberField
        label="Kapasite (Yasal)"
        required
        min={1}
        value={boat.legalCapacity}
        onChange={(e) => onChange({ legalCapacity: Number(e.target.value) })}
        hint="Ruhsatlı azami yolcu sayısı — tedarikçi beyanına dayanır, bu prototip resmi bir denizcilik otoritesi kaydı doğrulamaz."
        className="max-w-xs"
      />

      <div className="flex flex-col gap-2">
        <SelectField
          label="Konum (Ana Marina)"
          required
          value={boat.mainMarinaId ?? ""}
          onChange={(e) => onChange({ mainMarinaId: e.target.value || null })}
        >
          <option value="">Seçilmedi</option>
          {marinaPoints.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectField>
        {!addingMarina ? (
          <Button type="button" size="sm" className="self-start" onClick={() => setAddingMarina(true)}>
            + Yeni marina
          </Button>
        ) : (
          <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-line p-3">
            <TextField label="Marina adı" value={newMarina.name} onChange={(e) => setNewMarina({ ...newMarina, name: e.target.value })} />
            <TextField label="Adres" value={newMarina.address} onChange={(e) => setNewMarina({ ...newMarina, address: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setAddingMarina(false)}>
                Vazgeç
              </Button>
              <Button type="button" variant="primary" onClick={saveMarina}>
                Kaydet
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
