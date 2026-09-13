"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { placeStorefrontOrder, type OrderKind } from "@/lib/storefront/order";
import { Button } from "@/components/primitives/Button";

/**
 * Tur dışındaki modüllerin talep kutusu. Sepet yok: tekne/villa/transfer
 * tek kalemdir ve tarih ister; doğrudan talep açılır, onay sayfasına gider.
 *
 * Tahmini tutar burada yalnız BİLGİ: gerçek tutar sunucuda (veritabanı
 * fonksiyonu) hesaplanır; istemci fiyat göndermez.
 */
type Pricing =
  | { model: "hourly"; rate: number; minHours: number; tiers: { afterHours: number; discountPct: number }[]; captainFee: number | null; captainUnit: "saatlik" | "gunluk"; captainOption: "kaptanli" | "kaptansiz" | "herIkisi" }
  | { model: "multiday"; unitPrice: number; minUnits: number; captainFee: number | null; captainUnit: "saatlik" | "gunluk"; captainOption: "kaptanli" | "kaptansiz" | "herIkisi" }
  | { model: "perPerson"; price: number; minGroup: number; captainFee: number | null; captainUnit: "saatlik" | "gunluk"; captainOption: "kaptanli" | "kaptansiz" | "herIkisi" }
  | { model: "nightly"; rate: number; minNights: number; capacity: number }
  | { model: "transferHourly"; rate: number; seats: number }
  | { model: "transferQuote"; seats: number }
  | { model: "visa"; price: number };

const input =
  "h-10 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 " +
  "text-[length:var(--font-ui)] text-ink outline-none focus:border-action";

function today(offset = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function RequestForm({
  kind,
  refKey,
  title,
  currency,
  pricing,
}: {
  kind: OrderKind;
  /** Tur/tekne/villa: slug; araç/vize: id. */
  refKey: string;
  title: string;
  currency: string;
  pricing: Pricing;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [f, setF] = useState({
    fromDate: today(1), fromTime: "10:00", toDate: today(kind === "boat" ? 1 : 3), toTime: "18:00",
    hours: 4, from: "", to: "", guests: 2, captain: "kaptanli" as "kaptanli" | "kaptansiz",
    name: "", email: "", phone: "",
  });
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));

  const estimate = useMemo(() => {
    const hours = Math.max(0, (new Date(`${f.toDate}T${f.toTime}`).getTime() - new Date(`${f.fromDate}T${f.fromTime}`).getTime()) / 36e5);
    const days = Math.max(1, Math.ceil(hours / 24));
    const captainOn = "captainOption" in pricing && pricing.captainOption !== "kaptansiz" && (pricing.captainOption === "kaptanli" || f.captain === "kaptanli");
    const captain = captainOn && "captainFee" in pricing && pricing.captainFee ? (pricing.captainUnit === "saatlik" ? pricing.captainFee * hours : pricing.captainFee * days) : 0;
    switch (pricing.model) {
      case "hourly": {
        const pct = pricing.tiers.filter((x) => x.afterHours <= hours).reduce((m, x) => Math.max(m, x.discountPct), 0);
        return hours > 0 ? Math.round(pricing.rate * hours * (1 - pct / 100) + captain) : null;
      }
      case "multiday": return pricing.unitPrice * days + captain;
      case "perPerson": return pricing.price * f.guests + captain;
      case "nightly": {
        const nights = Math.round((new Date(f.toDate).getTime() - new Date(f.fromDate).getTime()) / 864e5);
        return nights > 0 ? pricing.rate * nights : null;
      }
      case "transferHourly": return pricing.rate * f.hours;
      case "transferQuote": return null;
      case "visa": return pricing.price * f.guests;
    }
  }, [f, pricing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const detail: Record<string, string | number | null> =
      kind === "boat"
        ? { from_date: f.fromDate, from_time: f.fromTime, to_date: f.toDate, to_time: f.toTime, captain: "captainOption" in pricing && pricing.captainOption === "herIkisi" ? f.captain : ("captainOption" in pricing ? pricing.captainOption : "kaptansiz") }
        : kind === "villa"
          ? { check_in: f.fromDate, check_out: f.toDate }
          : kind === "transfer"
            ? { date: f.fromDate, time: f.fromTime, hours: pricing.model === "transferHourly" ? f.hours : 0, from: f.from, to: f.to }
            : {};
    const res = await placeStorefrontOrder({
      customer: { fullName: f.name, email: f.email, phone: f.phone },
      lines: [{ kind, slug: kind === "transfer" || kind === "visa" ? undefined : refKey, id: kind === "transfer" || kind === "visa" ? refKey : undefined, adults: f.guests, children: 0, detail }],
    });
    setBusy(false);
    if (!res.ok) {
      const key = `b2c.orderError.${res.error}` as MessageKey;
      setError(t(key) === key ? "b2c.orderError.generic" : key);
      return;
    }
    router.push(`/magaza/onay/${res.ref}`);
  };

  const showRange = kind === "boat" || kind === "villa";
  const showTime = kind === "boat";

  return (
    <form onSubmit={submit} aria-label={`${t("b2c.request.title")}: ${title}`} className="rounded-[var(--radius-lg)] border border-line-strong bg-surface p-5">
      <h2 className="font-dense text-lg font-medium text-ink">{t("b2c.request.title")}</h2>
      <p className="mt-1 text-[length:var(--font-ui-sm)] text-ink-2">{t("b2c.request.lead")}</p>

      <div className="mt-4 grid gap-3">
        {showRange && (
          <div className="grid grid-cols-2 gap-2">
            <Field label={kind === "villa" ? t("b2c.request.checkIn") : t("b2c.request.from")}>
              <input type="date" required className={input} value={f.fromDate} min={today(0)} onChange={(e) => set({ fromDate: e.target.value })} />
            </Field>
            <Field label={kind === "villa" ? t("b2c.request.checkOut") : t("b2c.request.to")}>
              <input type="date" required className={input} value={f.toDate} min={f.fromDate} onChange={(e) => set({ toDate: e.target.value })} />
            </Field>
            {showTime && (
              <>
                <Field label={t("b2c.request.time")}>
                  <input type="time" className={input} value={f.fromTime} onChange={(e) => set({ fromTime: e.target.value })} />
                </Field>
                <Field label={t("b2c.request.time")}>
                  <input type="time" className={input} value={f.toTime} onChange={(e) => set({ toTime: e.target.value })} />
                </Field>
              </>
            )}
          </div>
        )}
        {kind === "transfer" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t("b2c.request.date")}>
                <input type="date" required className={input} value={f.fromDate} min={today(0)} onChange={(e) => set({ fromDate: e.target.value })} />
              </Field>
              <Field label={t("b2c.request.time")}>
                <input type="time" className={input} value={f.fromTime} onChange={(e) => set({ fromTime: e.target.value })} />
              </Field>
            </div>
            {pricing.model === "transferHourly" ? (
              <Field label={t("b2c.request.hours")}>
                <input type="number" min={1} max={24} className={input} value={f.hours} onChange={(e) => set({ hours: Number(e.target.value) || 1 })} />
              </Field>
            ) : (
              <Field label={t("b2c.request.route")}>
                <div className="grid grid-cols-2 gap-2">
                  <input required placeholder="Nereden" className={input} value={f.from} onChange={(e) => set({ from: e.target.value })} />
                  <input required placeholder="Nereye" className={input} value={f.to} onChange={(e) => set({ to: e.target.value })} />
                </div>
              </Field>
            )}
          </>
        )}
        <Field label={t("b2c.request.guests")}>
          <input type="number" min={1} max={99} className={input} value={f.guests} onChange={(e) => set({ guests: Math.max(1, Number(e.target.value) || 1) })} />
        </Field>
        {kind === "boat" && "captainOption" in pricing && pricing.captainOption === "herIkisi" && (
          <Field label={t("b2c.request.captain")}>
            <select className={input} value={f.captain} onChange={(e) => set({ captain: e.target.value as "kaptanli" | "kaptansiz" })}>
              <option value="kaptanli">{t("b2c.request.captain.kaptanli")}</option>
              <option value="kaptansiz">{t("b2c.request.captain.kaptansiz")}</option>
            </select>
          </Field>
        )}

        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("b2c.request.estimate")}</span>
          <span className="tnum text-2xl font-semibold text-ink">
            {estimate != null && estimate > 0 ? formatMoney(estimate, currency) : <span className="text-[length:var(--font-ui-sm)] font-normal text-ink-2">{t("b2c.request.quote")}</span>}
          </span>
        </div>

        <Field label={t("b2c.request.name")}>
          <input required autoComplete="name" className={input} value={f.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("b2c.request.email")}>
            <input type="email" required autoComplete="email" className={input} value={f.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label={t("b2c.request.phone")}>
            <input type="tel" autoComplete="tel" className={input} value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
        </div>

        {error && <p role="alert" className="text-[length:var(--font-ui-sm)] text-danger">✕ {t(error)}</p>}
        <Button type="submit" variant="primary" size="lg" disabled={busy} className="w-full">
          {busy ? t("b2c.request.sending") : t("b2c.request.submit")}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[length:var(--font-ui-sm)] text-ink-2">{label}</span>
      {children}
    </label>
  );
}
