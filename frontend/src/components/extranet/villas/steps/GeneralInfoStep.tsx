"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { NumberField, SelectField, TextField } from "@/components/primitives/Field";
import { MultiSelectChips } from "@/components/primitives/MultiSelectChips";
import { useVillaCatalog } from "@/lib/villa-store";
import type { DistanceUnit, PoiDistance } from "@/lib/villa";
import type { VillaStepProps } from "./shared";

/** 4.1 Villa Genel Bilgileri — genişletilebilir mesafe listesi (Tasarım Notu §4.1). */
export function GeneralInfoStep({ villa, onChange }: VillaStepProps) {
  const { features, addFeature } = useVillaCatalog();
  const [newPoiLabel, setNewPoiLabel] = useState("");

  const updatePoi = (id: string, patch: Partial<PoiDistance>) =>
    onChange({ poiDistances: villa.poiDistances.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const removePoi = (id: string) => onChange({ poiDistances: villa.poiDistances.filter((p) => p.id !== id) });
  const addPoi = () => {
    const label = newPoiLabel.trim();
    if (!label) return;
    onChange({ poiDistances: [...villa.poiDistances, { id: crypto.randomUUID(), label, distance: 0, unit: "km" }] });
    setNewPoiLabel("");
  };

  const toggleFeature = (id: string) => onChange({ featureIds: villa.featureIds.includes(id) ? villa.featureIds.filter((f) => f !== id) : [...villa.featureIds, id] });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">Mesafe Bilgileri</span>
        {villa.poiDistances.map((poi) => (
          <div key={poi.id} className="grid items-end gap-2 sm:grid-cols-[1fr_6rem_6rem_auto]">
            <TextField label="Nokta" value={poi.label} onChange={(e) => updatePoi(poi.id, { label: e.target.value })} />
            <NumberField label="Mesafe" min={0} value={poi.distance} onChange={(e) => updatePoi(poi.id, { distance: Number(e.target.value) })} />
            <SelectField label="Birim" value={poi.unit} onChange={(e) => updatePoi(poi.id, { unit: e.target.value as DistanceUnit })}>
              <option value="m">m</option>
              <option value="km">km</option>
            </SelectField>
            <Button type="button" variant="danger" onClick={() => removePoi(poi.id)}>
              Kaldır
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <input value={newPoiLabel} onChange={(e) => setNewPoiLabel(e.target.value)} placeholder='ör. "En yakın plaj kulübü"' className="h-8 w-full max-w-xs rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 text-[length:var(--font-ui-sm)] text-ink outline-none placeholder:text-ink-3 focus:border-action" />
          <Button type="button" size="sm" onClick={addPoi}>
            Yeni nokta ekle
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Kapasite" required min={1} value={villa.capacity} onChange={(e) => onChange({ capacity: Number(e.target.value) })} hint="Azami misafir sayısı." />
        <NumberField label="Villa Boyutu (m²)" min={0} value={villa.sizeM2 ?? ""} onChange={(e) => onChange({ sizeM2: e.target.value === "" ? null : Number(e.target.value) })} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">Lütfen villa özelliklerini işaretleyiniz</span>
        <MultiSelectChips
          options={features.map((f) => ({ id: f.id, label: f.name }))}
          selectedIds={villa.featureIds}
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
