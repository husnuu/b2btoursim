"use client";

import { NumberField, TextField } from "@/components/primitives/Field";
import { MultiSelectChips } from "@/components/primitives/MultiSelectChips";
import { useBoatCatalog } from "@/lib/boat-store";
import type { BoatStepProps } from "./shared";

/** 3.2 Teknik Özellikler. */
export function TechnicalSpecsStep({ boat, onChange }: BoatStepProps) {
  const { features, addFeature } = useBoatCatalog();

  const toggleFeature = (id: string) => {
    onChange({
      featureIds: boat.featureIds.includes(id) ? boat.featureIds.filter((f) => f !== id) : [...boat.featureIds, id],
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Marka / Model" value={boat.brandModel} onChange={(e) => onChange({ brandModel: e.target.value })} />
        <NumberField
          label="Üretim Yılı"
          min={1950}
          value={boat.buildYear ?? ""}
          onChange={(e) => onChange({ buildYear: e.target.value === "" ? null : Number(e.target.value) })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Uzunluk (metre)"
          min={0}
          step={0.1}
          value={boat.lengthMeters ?? ""}
          onChange={(e) => onChange({ lengthMeters: e.target.value === "" ? null : Number(e.target.value) })}
          hint="Arama filtrelerinde kullanılır."
        />
        <TextField label="Motor Bilgisi" value={boat.engineInfo} onChange={(e) => onChange({ engineInfo: e.target.value })} placeholder="ör. 2 × 300 HP dizel" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Kabin Sayısı" min={0} value={boat.cabinCount} onChange={(e) => onChange({ cabinCount: Number(e.target.value) })} />
        <NumberField label="Yatak Sayısı" min={0} value={boat.bedCount} onChange={(e) => onChange({ bedCount: Number(e.target.value) })} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">Tekne Özellikleri</span>
        <MultiSelectChips
          options={features.map((f) => ({ id: f.id, label: f.name }))}
          selectedIds={boat.featureIds}
          onToggle={toggleFeature}
          addPlaceholder="Yeni özellik adı"
          onAddNew={(name) => {
            const created = addFeature({ name });
            toggleFeature(created.id);
          }}
        />
      </div>
    </div>
  );
}
