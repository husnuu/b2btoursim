"use client";

import { useState } from "react";
import { createSubAgency } from "@/lib/agencies/actions";
import { t } from "@/lib/i18n";
import { Button } from "@/components/primitives/Button";
import { NumberField, SelectField, TextField } from "@/components/primitives/Field";
import { useToast } from "@/components/primitives/Toast";

const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];

/** Alt acente açma: ad, cari limit, vade. Bakiye defterden türer, girilmez. */
export function CreateAgencyForm() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", creditLimit: 0, paymentTermDays: 30, currency: "TRY" });
  const { notify } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const res = await createSubAgency({ ...f, creditLimit: Math.round(f.creditLimit * 100) });
    setBusy(false);
    if (!res.ok) {
      notify(`Açılamadı (${res.error}).`);
      return;
    }
    notify(`${f.name} açıldı.`);
    setOpen(false);
    setF({ name: "", creditLimit: 0, paymentTermDays: 30, currency: "TRY" });
  };

  if (!open) {
    return (
      <Button variant="primary" onClick={() => setOpen(true)}>
        {t("agencies.create")}
      </Button>
    );
  }
  return (
    <form onSubmit={submit} className="flex w-full flex-wrap items-end gap-3 rounded-[var(--radius-lg)] border border-line-strong bg-surface p-3">
      <div className="min-w-56 flex-1"><TextField label={t("agencies.col.name")} required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div className="w-40"><NumberField label={t("agencies.col.limit")} min={0} value={f.creditLimit} onChange={(e) => setF({ ...f, creditLimit: Number(e.target.value) || 0 })} /></div>
      <div className="w-28">
        <SelectField label="Para birimi" value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectField>
      </div>
      <div className="w-32"><NumberField label={t("agencies.col.term")} min={0} value={f.paymentTermDays} onChange={(e) => setF({ ...f, paymentTermDays: Number(e.target.value) || 0 })} /></div>
      <Button type="submit" variant="primary" disabled={busy || f.name.trim().length < 2}>{busy ? "Açılıyor" : t("agencies.create")}</Button>
      <Button type="button" onClick={() => setOpen(false)}>Vazgeç</Button>
    </form>
  );
}
