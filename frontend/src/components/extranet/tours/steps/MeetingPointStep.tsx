"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { NumberField, SelectField, TextField } from "@/components/primitives/Field";
import { useTourCatalog } from "@/lib/tour-store";
import type { StepProps } from "./shared";

/** 3.10 Buluşma ve Alış Noktaları — MVP alanları. */
export function MeetingPointStep({ draft, onChange }: StepProps) {
  const { meetingPoints, addMeetingPoint } = useTourCatalog();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", description: "" });

  const saveNewPoint = () => {
    if (!form.name.trim()) return;
    const created = addMeetingPoint(form);
    onChange({ meetingPointId: created.id });
    setForm({ name: "", address: "", description: "" });
    setAdding(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <SelectField
        label="Buluşma noktası"
        hint="Buluşma Noktaları kütüphanesinden seçim."
        value={draft.meetingPointId ?? ""}
        onChange={(e) => onChange({ meetingPointId: e.target.value || null })}
      >
        <option value="">Seçilmedi</option>
        {meetingPoints.map((point) => (
          <option key={point.id} value={point.id}>
            {point.name}
          </option>
        ))}
      </SelectField>

      {!adding ? (
        <Button type="button" size="sm" className="self-start" onClick={() => setAdding(true)}>
          + Yeni nokta ekle
        </Button>
      ) : (
        <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line p-3">
          <TextField
            label="Nokta adı"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            label="Adres / harita konumu"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <TextField
            label="Açıklama"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => setAdding(false)}>
              Vazgeç
            </Button>
            <Button type="button" variant="primary" onClick={saveNewPoint}>
              Kütüphaneye ekle ve seç
            </Button>
          </div>
        </div>
      )}

      <NumberField
        label="Buluşma saati kuralı"
        hint="Tur başlangıcından kaç dakika önce buluşulacağı."
        min={0}
        step={5}
        value={draft.meetingTimeMinutesBefore ?? ""}
        onChange={(e) =>
          onChange({
            meetingTimeMinutesBefore: e.target.value === "" ? null : Number(e.target.value),
          })
        }
      />

      <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line p-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.pickup.enabled}
            onChange={(e) => onChange({ pickup: { ...draft.pickup, enabled: e.target.checked } })}
            className="h-4 w-4 accent-[var(--action-primary)]"
          />
          <span className="text-[length:var(--font-ui)] text-ink">Otelden alış (pickup) hizmeti</span>
        </label>
        {draft.pickup.enabled && (
          <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
            <TextField
              label="Hizmet bölgeleri / oteller"
              value={draft.pickup.regions}
              onChange={(e) => onChange({ pickup: { ...draft.pickup, regions: e.target.value } })}
              placeholder="ör. Göreme, Ürgüp, Uçhisar"
            />
            <NumberField
              label="Ek ücret"
              min={0}
              value={draft.pickup.extraFee / 100}
              onChange={(e) =>
                onChange({ pickup: { ...draft.pickup, extraFee: Math.round(Number(e.target.value) * 100) } })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
