"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { NumberField, SelectField, TextField } from "@/components/primitives/Field";
import { formatMoney } from "@/lib/i18n";
import { useTourCatalog } from "@/lib/tour-store";
import type { ExtraLink } from "@/lib/tour";
import type { StepProps } from "./shared";

/** 5.5 Tur Ekstraları — kütüphaneden seçip bu ürüne bağlama. */
export function ExtrasStep({ draft, onChange }: StepProps) {
  const { extras, addTourExtra } = useTourCatalog();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", price: 0, type: "perPerson" as "perPerson" | "perBooking" });

  const linked = (extraId: string) => draft.extraLinks.find((link) => link.extraId === extraId);

  const toggle = (extraId: string) => {
    if (linked(extraId)) {
      onChange({ extraLinks: draft.extraLinks.filter((link) => link.extraId !== extraId) });
    } else {
      const link: ExtraLink = { extraId, required: false, sellPhase: "duringBooking" };
      onChange({ extraLinks: [...draft.extraLinks, link] });
    }
  };

  const updateLink = (extraId: string, patch: Partial<ExtraLink>) => {
    onChange({
      extraLinks: draft.extraLinks.map((link) => (link.extraId === extraId ? { ...link, ...patch } : link)),
    });
  };

  const saveNewExtra = () => {
    if (!form.name.trim()) return;
    const created = addTourExtra({
      name: form.name,
      price: Math.round(form.price * 100),
      currency: draft.pricingCurrency,
      type: form.type,
    });
    onChange({ extraLinks: [...draft.extraLinks, { extraId: created.id, required: false, sellPhase: "duringBooking" }] });
    setForm({ name: "", price: 0, type: "perPerson" });
    setAdding(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {extras.map((extra) => {
        const link = linked(extra.id);
        return (
          <div key={extra.id} className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-line p-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(link)}
                onChange={() => toggle(extra.id)}
                className="h-4 w-4 accent-[var(--action-primary)]"
              />
              <span className="flex-1 text-[length:var(--font-ui)] text-ink">{extra.name}</span>
              <span className="tnum text-[length:var(--font-ui-sm)] text-ink-3">
                {formatMoney(extra.price, extra.currency)}
                {extra.type === "perPerson" ? " / kişi" : " / rezervasyon"}
              </span>
            </label>
            {link && (
              <div className="ms-6 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={link.required}
                    onChange={(e) => updateLink(extra.id, { required: e.target.checked })}
                    className="h-4 w-4 accent-[var(--action-primary)]"
                  />
                  <span className="text-[length:var(--font-ui-sm)] text-ink-2">Zorunlu</span>
                </label>
                <SelectField
                  label="Satış zamanı"
                  value={link.sellPhase}
                  onChange={(e) => updateLink(extra.id, { sellPhase: e.target.value as ExtraLink["sellPhase"] })}
                  className="w-56"
                >
                  <option value="duringBooking">Rezervasyon sırasında</option>
                  <option value="afterBooking">Rezervasyon sonrasında</option>
                </SelectField>
              </div>
            )}
          </div>
        );
      })}

      {!adding ? (
        <Button type="button" size="sm" className="self-start" onClick={() => setAdding(true)}>
          + Yeni ekstra ekle
        </Button>
      ) : (
        <div className="grid gap-3 rounded-[var(--radius-lg)] border border-line p-3 sm:grid-cols-3">
          <TextField
            label="Ad"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <NumberField
            label="Fiyat"
            min={0}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />
          <SelectField
            label="Tip"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as "perPerson" | "perBooking" })}
          >
            <option value="perPerson">Kişi başı</option>
            <option value="perBooking">Rezervasyon başı</option>
          </SelectField>
          <div className="flex gap-2 sm:col-span-3">
            <Button type="button" onClick={() => setAdding(false)}>
              Vazgeç
            </Button>
            <Button type="button" variant="primary" onClick={saveNewExtra}>
              Kütüphaneye ekle ve bağla
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
