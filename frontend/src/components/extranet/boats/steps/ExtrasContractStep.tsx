"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { NumberField, SelectField, TextAreaField, TextField } from "@/components/primitives/Field";
import { formatMoney } from "@/lib/i18n";
import { useBoatCatalog } from "@/lib/boat-store";
import type { ExtraLink } from "@/lib/tour";
import type { BoatStepProps } from "./shared";

/** 5.4 Tekne Ekstraları ve Sözleşme. */
export function ExtrasContractStep({ boat, onChange }: BoatStepProps) {
  const { extras, addExtra } = useBoatCatalog();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", price: 0, type: "perBooking" as "perPerson" | "perBooking" });
  const [contractText, setContractText] = useState(boat.contract?.text ?? "");

  const linked = (extraId: string) => boat.extraLinks.find((l) => l.extraId === extraId);
  const toggleExtra = (extraId: string) => {
    if (linked(extraId)) {
      onChange({ extraLinks: boat.extraLinks.filter((l) => l.extraId !== extraId) });
    } else {
      const link: ExtraLink = { extraId, required: false, sellPhase: "duringBooking" };
      onChange({ extraLinks: [...boat.extraLinks, link] });
    }
  };

  const saveExtra = () => {
    if (!form.name.trim()) return;
    const created = addExtra({ name: form.name, price: Math.round(form.price * 100), currency: boat.currency, type: form.type });
    onChange({ extraLinks: [...boat.extraLinks, { extraId: created.id, required: false, sellPhase: "duringBooking" }] });
    setForm({ name: "", price: 0, type: "perBooking" });
    setAdding(false);
  };

  const contractDirty = contractText !== (boat.contract?.text ?? "");
  const saveContract = () => {
    onChange({ contract: { text: contractText, version: (boat.contract?.version ?? 0) + 1, updatedAt: new Date().toISOString() } });
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-[length:var(--font-ui-sm)] font-medium text-ink">Tekne Ekstraları</h2>
        {extras.map((extra) => (
          <label key={extra.id} className="flex items-center gap-2 rounded-[var(--radius)] border border-line px-3 py-2">
            <input type="checkbox" checked={Boolean(linked(extra.id))} onChange={() => toggleExtra(extra.id)} className="h-4 w-4 accent-[var(--action-primary)]" />
            <span className="flex-1 text-[length:var(--font-ui)] text-ink">{extra.name}</span>
            <span className="tnum text-[length:var(--font-ui-sm)] text-ink-3">{formatMoney(extra.price, extra.currency)}</span>
          </label>
        ))}
        {!adding ? (
          <Button type="button" size="sm" className="self-start" onClick={() => setAdding(true)}>
            + Yeni ekstra ekle
          </Button>
        ) : (
          <div className="grid gap-3 rounded-[var(--radius-lg)] border border-line p-3 sm:grid-cols-3">
            <TextField label="Ad" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <NumberField label="Fiyat" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            <SelectField label="Tip" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "perPerson" | "perBooking" })}>
              <option value="perBooking">Rezervasyon başı</option>
              <option value="perPerson">Kişi başı</option>
            </SelectField>
            <div className="flex gap-2 sm:col-span-3">
              <Button type="button" onClick={() => setAdding(false)}>
                Vazgeç
              </Button>
              <Button type="button" variant="primary" onClick={saveExtra}>
                Kütüphaneye ekle ve bağla
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[length:var(--font-ui-sm)] font-medium text-ink">Sözleşme</h2>
        <p className="text-[length:var(--font-ui-sm)] text-ink-3">
          Güvenlik depozitosu şartları ve hasar değerlendirme süreci burada açıkça belirtilmelidir.
        </p>
        <TextAreaField label="Hizmet şartları / sorumluluk reddi metni" rows={10} value={contractText} onChange={(e) => setContractText(e.target.value)} />
        <div className="flex items-center gap-3">
          <Button type="button" variant="primary" onClick={saveContract} disabled={!contractDirty}>
            Kaydet (yeni versiyon)
          </Button>
          {boat.contract && (
            <span className="tnum text-[length:var(--font-ui-sm)] text-ink-3">v{boat.contract.version}</span>
          )}
        </div>
      </section>
    </div>
  );
}
