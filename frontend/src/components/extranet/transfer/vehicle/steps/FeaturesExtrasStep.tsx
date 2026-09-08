"use client";

import { MultiSelectChips } from "@/components/primitives/MultiSelectChips";
import { useTransferCatalog } from "@/lib/transfer-store";
import type { VehicleStepProps } from "./shared";

/** 1.2 adım 3 — Özellikler ve Ekstralar. */
export function FeaturesExtrasStep({ vehicle, onChange }: VehicleStepProps) {
  const { features, extras, addFeature, addExtra } = useTransferCatalog();

  const toggleFeature = (id: string) => {
    onChange({
      featureIds: vehicle.featureIds.includes(id)
        ? vehicle.featureIds.filter((f) => f !== id)
        : [...vehicle.featureIds, id],
    });
  };

  const linkedExtraIds = vehicle.extraLinks.map((link) => link.extraId);
  const toggleExtra = (id: string) => {
    onChange({
      extraLinks: linkedExtraIds.includes(id)
        ? vehicle.extraLinks.filter((link) => link.extraId !== id)
        : [...vehicle.extraLinks, { extraId: id, required: false, sellPhase: "duringBooking" as const }],
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">
          Aracın desteklediği ekstralar
        </span>
        <MultiSelectChips
          options={extras.map((extra) => ({ id: extra.id, label: extra.name }))}
          selectedIds={linkedExtraIds}
          onToggle={toggleExtra}
          addPlaceholder="Yeni ekstra adı (Extra Ekle)"
          onAddNew={(name) => {
            const created = addExtra({ name, price: 0, currency: "TRY", type: "perBooking" });
            toggleExtra(created.id);
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">Araç özellikleri</span>
        <MultiSelectChips
          options={features.map((feature) => ({ id: feature.id, label: feature.name }))}
          selectedIds={vehicle.featureIds}
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
