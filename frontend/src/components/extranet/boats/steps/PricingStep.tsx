"use client";

import { Button } from "@/components/primitives/Button";
import { NumberField, SelectField } from "@/components/primitives/Field";
import type { HourlyTier, PricingModel } from "@/lib/boat";
import type { BoatStepProps } from "./shared";

const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];

const MODELS: { value: PricingModel; label: string; body: string }[] = [
  { value: "saatlik", label: "Saatlik", body: "Tek günlük geziler için; süreye göre kademeli fiyat/indirim." },
  { value: "cokGunlu", label: "Çok Günlü", body: "Gecelemeli/gecelemesiz uzun süreli kiralamalar; gün/gece başına ücret." },
  { value: "kisiBasi", label: "Kişi Başı", body: "Grup büyüklüğüne göre kişi başı fiyatlandırma (paylaşımlı tekne turları)." },
];

/** 4.2 Fiyatlandırma Modeli. */
export function PricingStep({ boat, onChange }: BoatStepProps) {
  const addTier = () => {
    const tier: HourlyTier = { id: crypto.randomUUID(), afterHours: 4, discountPct: 10 };
    onChange({ hourlyTiers: [...boat.hourlyTiers, tier] });
  };
  const updateTier = (id: string, patch: Partial<HourlyTier>) =>
    onChange({ hourlyTiers: boat.hourlyTiers.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  const removeTier = (id: string) => onChange({ hourlyTiers: boat.hourlyTiers.filter((t) => t.id !== id) });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {MODELS.map((model) => (
          <label key={model.value} className={`flex flex-col gap-0.5 rounded-[var(--radius)] border px-3 py-2 ${boat.pricingModel === model.value ? "border-action bg-action-tint" : "border-line hover:border-ink-3"}`}>
            <span className="flex items-center gap-2">
              <input type="radio" name="pricingModel" checked={boat.pricingModel === model.value} onChange={() => onChange({ pricingModel: model.value })} className="h-4 w-4 accent-[var(--action-primary)]" />
              <span className="text-[length:var(--font-ui)] font-medium text-ink">{model.label}</span>
            </span>
            <span className="ms-6 text-[length:var(--font-ui-sm)] text-ink-3">{model.body}</span>
          </label>
        ))}
      </div>

      <SelectField label="Fiyat Para Birimi" value={boat.currency} onChange={(e) => onChange({ currency: e.target.value })} className="max-w-xs">
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </SelectField>

      {boat.pricingModel === "saatlik" && (
        <div className="flex flex-col gap-3">
          <NumberField label="Saatlik ücret" min={0} value={(boat.hourlyRate ?? 0) / 100} onChange={(e) => onChange({ hourlyRate: Math.round(Number(e.target.value) * 100) })} className="max-w-xs" />
          <div className="flex items-center justify-between">
            <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">Süreye göre kademeli indirim</span>
            <Button type="button" size="sm" onClick={addTier}>
              Kademe ekle
            </Button>
          </div>
          {boat.hourlyTiers.map((tier) => (
            <div key={tier.id} className="grid items-end gap-2 sm:grid-cols-[8rem_8rem_auto]">
              <NumberField label="Şu saatten sonra" min={0} value={tier.afterHours} onChange={(e) => updateTier(tier.id, { afterHours: Number(e.target.value) })} />
              <NumberField label="İndirim %" min={0} max={100} value={tier.discountPct} onChange={(e) => updateTier(tier.id, { discountPct: Number(e.target.value) })} />
              <Button type="button" variant="danger" onClick={() => removeTier(tier.id)}>
                Kaldır
              </Button>
            </div>
          ))}
        </div>
      )}

      {boat.pricingModel === "cokGunlu" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Birim" value={boat.multiDay.unit} onChange={(e) => onChange({ multiDay: { ...boat.multiDay, unit: e.target.value as "gece" | "gun" } })}>
            <option value="gece">Gece</option>
            <option value="gun">Gün</option>
          </SelectField>
          <NumberField label="Birim fiyat" min={0} value={boat.multiDay.unitPrice / 100} onChange={(e) => onChange({ multiDay: { ...boat.multiDay, unitPrice: Math.round(Number(e.target.value) * 100) } })} />
          <NumberField label="Minimum süre" min={1} value={boat.multiDay.minUnits} onChange={(e) => onChange({ multiDay: { ...boat.multiDay, minUnits: Number(e.target.value) } })} />
          <NumberField label="Azami süre" min={1} value={boat.multiDay.maxUnits} onChange={(e) => onChange({ multiDay: { ...boat.multiDay, maxUnits: Number(e.target.value) } })} />
        </div>
      )}

      {boat.pricingModel === "kisiBasi" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label="Kişi başı fiyat" min={0} value={boat.perPerson.pricePerPerson / 100} onChange={(e) => onChange({ perPerson: { ...boat.perPerson, pricePerPerson: Math.round(Number(e.target.value) * 100) } })} />
          <NumberField label="Minimum grup büyüklüğü" min={1} value={boat.perPerson.minGroupSize} onChange={(e) => onChange({ perPerson: { ...boat.perPerson, minGroupSize: Number(e.target.value) } })} />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="Minimum Kiralama Süresi (saat)" min={0} value={boat.minRentalHours} onChange={(e) => onChange({ minRentalHours: Number(e.target.value) })} />
        <NumberField label="Güvenlik Depozitosu" min={0} value={boat.securityDeposit / 100} onChange={(e) => onChange({ securityDeposit: Math.round(Number(e.target.value) * 100) })} hint="Hasar durumunda tahsil edilebilecek azami tutar." />
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={boat.fuelPolicyIncluded} onChange={(e) => onChange({ fuelPolicyIncluded: e.target.checked })} className="h-4 w-4 accent-[var(--action-primary)]" />
        <span className="text-[length:var(--font-ui)] text-ink">Yakıt fiyata dahil</span>
      </label>
      <p className="-mt-3 text-[length:var(--font-ui-sm)] text-ink-3">Kapalıyken dolu-dolu teslim (yakıt hariç) uygulanır.</p>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={boat.weatherCancellationEnabled} onChange={(e) => onChange({ weatherCancellationEnabled: e.target.checked })} className="h-4 w-4 accent-[var(--action-primary)]" />
        <span className="text-[length:var(--font-ui)] text-ink">Hava Durumu İptal Kuralı — fırtına/kötü havada ücretsiz iptal/erteleme</span>
      </label>
    </div>
  );
}
