"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { NumberField, SelectField, TextField } from "@/components/primitives/Field";
import { useVillaCatalog } from "@/lib/villa-store";
import type { VillaStepProps } from "./shared";

const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];

/** 3.2 Kategori ve Fiyat Ayarları. */
export function CategoryPricingStep({ villa, onChange }: VillaStepProps) {
  const { categories, addCategory } = useVillaCatalog();
  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const saveCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    const created = addCategory({ title: name });
    onChange({ categoryId: created.id });
    setNewCategory("");
    setAdding(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <SelectField label="Kategori" hint="Bu villanın websitenizde hangi kategoride listeleneceğini seçin." value={villa.categoryId ?? ""} onChange={(e) => onChange({ categoryId: e.target.value || null })}>
          <option value="">Seçilmedi</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </SelectField>
        {!adding ? (
          <Button type="button" size="sm" className="self-start" onClick={() => setAdding(true)}>
            + Kategori ekle
          </Button>
        ) : (
          <div className="flex gap-2">
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="h-8 w-full max-w-xs rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 text-[length:var(--font-ui-sm)] text-ink outline-none focus:border-action" />
            <Button type="button" size="sm" onClick={saveCategory}>
              Ekle
            </Button>
          </div>
        )}
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={villa.askForPrice} onChange={(e) => onChange({ askForPrice: e.target.checked })} className="h-4 w-4 accent-[var(--action-primary)]" />
        <span className="text-[length:var(--font-ui)] text-ink">Fiyat Sor</span>
      </label>
      <p className="-mt-3 text-[length:var(--font-ui-sm)] text-ink-3">Açıldığında villa fiyatı vitrinde gösterilmez; müşteri &quot;fiyat teklifi iste&quot; akışına yönlendirilir.</p>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={villa.forcedCurrency} onChange={(e) => onChange({ forcedCurrency: e.target.checked })} className="h-4 w-4 accent-[var(--action-primary)]" />
        <span className="text-[length:var(--font-ui)] text-ink">Zorunlu Para Birimi</span>
      </label>
      <p className="-mt-3 text-[length:var(--font-ui-sm)] text-ink-3">Açıldığında müşterinin görüntülediği para birimini değiştirmesine izin verilmez.</p>

      <TextField label="Kültür ve Turizm Bakanlığı Belge No" value={villa.tourismLicenseNo} onChange={(e) => onChange({ tourismLicenseNo: e.target.value })} hint="Zorunlu değildir; yasal uyum/güven göstergesi olarak vitrinde gösterilebilir." />

      <div className="grid gap-3 rounded-[var(--radius-lg)] border border-line p-3 sm:grid-cols-2">
        <SelectField label="Etiket Fiyat Para Birimi" value={villa.listCurrencyOverride ?? ""} onChange={(e) => onChange({ listCurrencyOverride: e.target.value || null })}>
          <option value="">Yok</option>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>
        <NumberField label="Etiket Fiyatı" min={0} value={(villa.listPrice ?? 0) / 100} onChange={(e) => onChange({ listPrice: Math.round(Number(e.target.value) * 100) })} disabled={!villa.listCurrencyOverride} />
        <p className="text-[length:var(--font-ui-xs)] text-ink-3 sm:col-span-2">
          Yalnızca pazarlama amaçlı; döviz kuru dalgalanmalarından etkilenmez, nihai fiyatlandırmayı/POS&apos;u etkilemez.
        </p>
      </div>
    </div>
  );
}
