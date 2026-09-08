"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { NumberField, SelectField, TextField } from "@/components/primitives/Field";
import { MultiSelectChips } from "@/components/primitives/MultiSelectChips";
import { emptyTimeMarginRule, type TimeMarginRule } from "@/lib/transfer";
import { useTransferCatalog } from "@/lib/transfer-store";

type LocationOption = { id: string; name: string };

/**
 * 2.4 Saat Marjları (Nokta) / 3.4 Saat Marjları (Harita) — belge "birebir
 * aynı kural motoru" diyor; `scope` ile ayrışan tek bileşen.
 */
export function TimeMarginRules({ scope, locations }: { scope: "point" | "zone"; locations: LocationOption[] }) {
  const { marginRules, vehicles, addMarginRule, updateMarginRule, removeMarginRule } = useTransferCatalog();
  const [editing, setEditing] = useState<TimeMarginRule | null>(null);

  const rows = marginRules.filter((rule) => rule.scope === scope);
  const locationName = (id: string | null) => (id ? locations.find((l) => l.id === id)?.name ?? "—" : "Tüm noktalar");

  const save = () => {
    if (!editing) return;
    const exists = rows.some((r) => r.id === editing.id);
    if (exists) updateMarginRule(editing.id, editing);
    else addMarginRule(editing);
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {rows.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {rows.map((rule) => (
            <li key={rule.id} className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-line px-3 py-2">
              <div className="min-w-0">
                <p className="text-[length:var(--font-ui)] text-ink">
                  {locationName(rule.startLocationId)} → {locationName(rule.endLocationId)}
                  <span className={`ms-2 tnum ${rule.percentPct >= 0 ? "text-margin-field" : "text-danger"}`}>
                    {rule.percentPct >= 0 ? "+" : ""}
                    {rule.percentPct}%
                  </span>
                </p>
                <p className="text-[length:var(--font-ui-sm)] text-ink-3">
                  {rule.startTime && rule.endTime ? `${rule.startTime}–${rule.endTime}` : "Her saat"}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button type="button" size="sm" onClick={() => setEditing(rule)}>
                  Düzenle
                </Button>
                <Button type="button" size="sm" variant="danger" onClick={() => removeMarginRule(rule.id)}>
                  Kaldır
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!editing ? (
        <Button type="button" size="sm" className="self-start" onClick={() => setEditing(emptyTimeMarginRule(crypto.randomUUID(), scope))}>
          + Saat marjı ekle
        </Button>
      ) : (
        <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Başlangıç" value={editing.startLocationId ?? ""} onChange={(e) => setEditing({ ...editing, startLocationId: e.target.value || null })}>
              <option value="">Tüm noktalar</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Bitiş" value={editing.endLocationId ?? ""} onChange={(e) => setEditing({ ...editing, endLocationId: e.target.value || null })}>
              <option value="">Tüm noktalar</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField
              label="Başlangıç Saati"
              type="time"
              value={editing.startTime ?? ""}
              onChange={(e) => setEditing({ ...editing, startTime: e.target.value || null })}
            />
            <TextField
              label="Bitiş Saati"
              type="time"
              value={editing.endTime ?? ""}
              onChange={(e) => setEditing({ ...editing, endTime: e.target.value || null })}
            />
            <NumberField
              label="Yüzde (%)"
              value={editing.percentPct}
              onChange={(e) => setEditing({ ...editing, percentPct: Number(e.target.value) })}
              hint="Pozitif = ek ücret, negatif = indirim"
            />
          </div>
          <div>
            <span className="mb-1.5 block text-[length:var(--font-ui-sm)] font-medium text-ink">
              Araçlar (boş = tüm araçlar)
            </span>
            <MultiSelectChips
              options={vehicles.map((v) => ({ id: v.id, label: v.title || "(Başlıksız)" }))}
              selectedIds={editing.vehicleIds}
              onToggle={(id) =>
                setEditing({
                  ...editing,
                  vehicleIds: editing.vehicleIds.includes(id)
                    ? editing.vehicleIds.filter((v) => v !== id)
                    : [...editing.vehicleIds, id],
                })
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => setEditing(null)}>
              Vazgeç
            </Button>
            <Button type="button" variant="primary" onClick={save}>
              Kaydet
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
