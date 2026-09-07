"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { SelectField, TextField } from "@/components/primitives/Field";
import type { CustomerInfoField } from "@/lib/tour";
import type { StepProps } from "./shared";

const TYPE_LABELS: Record<CustomerInfoField["type"], string> = {
  text: "Metin",
  date: "Tarih",
  file: "Dosya yükleme",
  select: "Açılır liste",
};

/** 5.3 Müşteriden İstenecek Bilgiler — form builder. */
export function CustomerInfoStep({ draft, onChange }: StepProps) {
  const [form, setForm] = useState<Omit<CustomerInfoField, "id">>({
    label: "",
    type: "text",
    required: true,
    scope: "bookingOwner",
  });

  const addField = () => {
    if (!form.label.trim()) return;
    const field: CustomerInfoField = { ...form, id: crypto.randomUUID() };
    onChange({ customerInfoFields: [...draft.customerInfoFields, field] });
    setForm({ label: "", type: "text", required: true, scope: "bookingOwner" });
  };

  const removeField = (id: string) => {
    onChange({ customerInfoFields: draft.customerInfoFields.filter((f) => f.id !== id) });
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[length:var(--font-ui-sm)] text-ink-3">
        Örnek kullanım: pasaport numarası, doğum tarihi, diyet kısıtlaması,
        acil durum iletişim bilgisi.
      </p>

      {draft.customerInfoFields.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {draft.customerInfoFields.map((field) => (
            <li
              key={field.id}
              className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-line px-3 py-2"
            >
              <span className="text-[length:var(--font-ui)] text-ink">
                {field.label}
                <span className="ms-2 text-[length:var(--font-ui-sm)] text-ink-3">
                  {TYPE_LABELS[field.type]} ·{" "}
                  {field.scope === "bookingOwner" ? "Sadece rezervasyon sahibi" : "Her katılımcı için ayrı ayrı"}
                  {field.required ? " · zorunlu" : ""}
                </span>
              </span>
              <Button type="button" size="sm" variant="danger" onClick={() => removeField(field.id)}>
                Kaldır
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 rounded-[var(--radius-lg)] border border-line p-3 sm:grid-cols-2">
        <TextField
          label="Alan adı"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="ör. Pasaport numarası"
        />
        <SelectField
          label="Alan tipi"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as CustomerInfoField["type"] })}
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Kapsam"
          value={form.scope}
          onChange={(e) => setForm({ ...form, scope: e.target.value as CustomerInfoField["scope"] })}
        >
          <option value="bookingOwner">Sadece rezervasyon sahibi</option>
          <option value="eachParticipant">Her katılımcı için ayrı ayrı</option>
        </SelectField>
        <label className="flex items-center gap-2 self-end pb-2">
          <input
            type="checkbox"
            checked={form.required}
            onChange={(e) => setForm({ ...form, required: e.target.checked })}
            className="h-4 w-4 accent-[var(--action-primary)]"
          />
          <span className="text-[length:var(--font-ui)] text-ink">Zorunlu</span>
        </label>
        <Button type="button" variant="primary" className="self-start sm:col-span-2" onClick={addField}>
          Alan tanımı ekle
        </Button>
      </div>
    </div>
  );
}
