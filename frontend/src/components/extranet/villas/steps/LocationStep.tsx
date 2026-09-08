import { NumberField, TextField } from "@/components/primitives/Field";
import { MultiSelectChips } from "@/components/primitives/MultiSelectChips";
import { useVillaCatalog } from "@/lib/villa-store";
import type { VillaStepProps } from "./shared";

/** 3.3 Lokasyon ve İletişim. */
export function LocationStep({ villa, onChange }: VillaStepProps) {
  const { regions, addRegion } = useVillaCatalog();

  const toggleRegion = (id: string) => {
    onChange({ regionIds: villa.regionIds.includes(id) ? villa.regionIds.filter((r) => r !== id) : [...villa.regionIds, id] });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Villanın Bulunduğu İl" value={villa.province} onChange={(e) => onChange({ province: e.target.value })} placeholder="İl aramaya başlayın" />
        <TextField label="Villanın Bulunduğu İlçe" value={villa.district} onChange={(e) => onChange({ district: e.target.value })} />
      </div>

      <TextField label="Villanızın Açık Adresi" value={villa.addressDetail} onChange={(e) => onChange({ addressDetail: e.target.value })} hint="Müşteriye check-in öncesi paylaşılır, aramada tam gösterilmez." />

      <div className="flex flex-col gap-2">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">
          Bölgeler<span className="ms-0.5 text-danger">*</span>
        </span>
        <MultiSelectChips
          options={regions.map((r) => ({ id: r.id, label: r.name }))}
          selectedIds={villa.regionIds}
          onToggle={toggleRegion}
          addPlaceholder='ör. "Kalkan Merkez"'
          onAddNew={(name) => {
            const created = addRegion({ name });
            toggleRegion(created.id);
          }}
        />
      </div>

      <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-line p-3">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">Harita Konumu</span>
        <p className="text-[length:var(--font-ui-xs)] text-ink-3">Bu prototipte etkileşimli harita widget&apos;ı yok; enlem/boylamı elle girin.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label="Enlem" step={0.0001} value={villa.mapLat ?? ""} onChange={(e) => onChange({ mapLat: e.target.value === "" ? null : Number(e.target.value) })} />
          <NumberField label="Boylam" step={0.0001} value={villa.mapLng ?? ""} onChange={(e) => onChange({ mapLng: e.target.value === "" ? null : Number(e.target.value) })} />
        </div>
      </div>
    </div>
  );
}
