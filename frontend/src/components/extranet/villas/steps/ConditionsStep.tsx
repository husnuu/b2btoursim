import { TextField } from "@/components/primitives/Field";
import type { VillaStepProps } from "./shared";

/** 4.2 Villa İle İlgili Koşulları Belirtin. */
export function ConditionsStep({ villa, onChange }: VillaStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="En Erken Check-in Saati" type="time" value={villa.checkInTime} onChange={(e) => onChange({ checkInTime: e.target.value })} />
        <TextField label="En Geç Check-out Saati" type="time" value={villa.checkOutTime} onChange={(e) => onChange({ checkOutTime: e.target.value })} />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input type="radio" name="petsAllowed" checked={!villa.petsAllowed} onChange={() => onChange({ petsAllowed: false })} className="h-4 w-4 accent-[var(--action-primary)]" />
          <span className="text-[length:var(--font-ui)] text-ink">Evcil Hayvan Kabul: Hayır</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="petsAllowed" checked={villa.petsAllowed} onChange={() => onChange({ petsAllowed: true })} className="h-4 w-4 accent-[var(--action-primary)]" />
          <span className="text-[length:var(--font-ui)] text-ink">Evcil Hayvan Kabul: Evet</span>
        </label>
      </div>
    </div>
  );
}
