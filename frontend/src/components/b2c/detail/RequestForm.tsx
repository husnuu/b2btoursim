"use client";

import { Suspense, useId, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatMoney, t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { kalemEtiketi, kalemKey } from "@/lib/storefront/kalem-etiket";
import { kalemler, toplam, type Secim } from "@/lib/storefront/kalemler";
import { placeStorefrontOrder, type OrderKind } from "@/lib/storefront/order";
import { addDays, nightsBetween, timeSlots } from "@/lib/storefront/tarih";
import { Button } from "@/components/primitives/Button";
import { DateField } from "../DateField";

/**
 * Tur dışındaki modüllerin talep kutusu (VITRIN.md §4.7). Sepet yok:
 * tekne/villa/transfer/vize tek kalemdir ve tarih ister; doğrudan talep
 * açılır, onay sayfasına gider.
 *
 * Tahmini tutar `kalemler()`den ve yalnız BİLGİ: gerçek tutar sunucuda
 * (veritabanı fonksiyonu) hesaplanır; istemci fiyat göndermez.
 *
 * Tarih `DateField` (yerel girdi yok), saat 30 dakikalık liste. Doğrulama
 * gönderimde; bir kez hata veren alan düzeltilirken anında yeniden
 * denetlenir. Hata metni label dışında, `aria-describedby` ile bağlı.
 * Kahraman aramasının parametreleri (tarih, giris, cikis, saat, kisi,
 * nereden, nereye) alanları ön-doldurur.
 */
type Captain = { captainFee: number | null; captainUnit: "saatlik" | "gunluk"; captainOption: "kaptanli" | "kaptansiz" | "herIkisi" };
type Pricing =
  | ({ model: "hourly"; rate: number; minHours: number; tiers: { afterHours: number; discountPct: number }[] } & Captain)
  | ({ model: "multiday"; unitPrice: number; minUnits: number; unit?: "gece" | "gun" } & Captain)
  | ({ model: "perPerson"; price: number; minGroup: number } & Captain)
  | { model: "nightly"; rate: number; minNights: number; capacity: number }
  | { model: "transferHourly"; rate: number; seats: number }
  | { model: "transferQuote"; seats: number }
  | { model: "visa"; price: number };

type Props = { kind: OrderKind; refKey: string; title: string; currency: string; pricing: Pricing };

const input =
  "h-10 w-full rounded-[var(--radius)] border bg-surface px-2.5 text-[length:var(--font-ui)] text-ink outline-none placeholder:text-ink-3 focus:border-action";

export function RequestForm(props: Props) {
  return (
    <Suspense fallback={null}>
      <RequestFormInner {...props} />
    </Suspense>
  );
}

function RequestFormInner({ kind, refKey, title, currency, pricing }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<MessageKey | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [f, setF] = useState(() => ({
    fromDate: params.get("tarih") || params.get("giris") || "",
    fromTime: params.get("saat") || "10:00",
    toDate: params.get("cikis") || "",
    toTime: "18:00",
    hours: 4,
    from: params.get("nereden") || "",
    to: params.get("nereye") || "",
    guests: Math.max(1, Number(params.get("kisi")) || 2),
    captain: "kaptanli" as "kaptanli" | "kaptansiz",
    name: "",
    email: "",
    phone: "",
  }));

  const showRange = kind === "boat" || kind === "villa";
  const showTime = kind === "boat";

  const validate = (v: typeof f): Record<string, string> => {
    const e: Record<string, string> = {};
    if (showRange) {
      if (!v.fromDate || !v.toDate) e.dates = t("b2c.request.dateRequired");
      else if (kind === "villa" ? v.toDate <= v.fromDate : `${v.toDate}T${v.toTime}` <= `${v.fromDate}T${v.fromTime}`) e.dates = t("b2c.request.rangeInvalid");
    }
    if (kind === "transfer") {
      if (!v.fromDate) e.dates = t("b2c.request.dateRequired");
      if (pricing.model === "transferQuote" && (!v.from.trim() || !v.to.trim())) e.route = t("b2c.request.routeRequired");
    }
    if (v.name.trim().length < 2) e.name = t("b2c.request.nameRequired");
    if (!/^\S+@\S+\.\S+$/.test(v.email)) e.email = t("checkout.invalidEmail");
    return e;
  };

  // Bir kez hata veren alan düzeltilirken anında yeniden denetlenir; diğerleri gönderimde.
  const set = (patch: Partial<typeof f>) =>
    setF((prev) => {
      const next = { ...prev, ...patch };
      if (Object.keys(errors).length) {
        const fresh = validate(next);
        setErrors((cur) => Object.fromEntries(Object.entries(cur).map(([k]) => [k, fresh[k]]).filter(([, msg]) => !!msg)));
      }
      return next;
    });

  const secim = useMemo<Secim | null>(() => {
    const captain = (p: Captain): { ucret: number; birim: "saatlik" | "gunluk" } | null => {
      const on = p.captainOption !== "kaptansiz" && (p.captainOption === "kaptanli" || f.captain === "kaptanli");
      return on && p.captainFee ? { ucret: p.captainFee, birim: p.captainUnit } : null;
    };
    const hours = f.fromDate && f.toDate ? Math.max(0, (new Date(`${f.toDate}T${f.toTime}`).getTime() - new Date(`${f.fromDate}T${f.fromTime}`).getTime()) / 36e5) : 0;
    switch (pricing.model) {
      case "hourly":
        return { kind: "tekne", model: "saatlik", saatlik: pricing.rate, saat: Math.round(hours * 2) / 2, kademeler: pricing.tiers, kaptan: captain(pricing) };
      case "multiday":
        return { kind: "tekne", model: "cokGunlu", birimFiyat: pricing.unitPrice, birim: pricing.unit ?? "gece", adet: Math.max(0, Math.ceil(hours / 24)), kaptan: captain(pricing) };
      case "perPerson":
        return { kind: "tekne", model: "kisiBasi", birimFiyat: pricing.price, kisi: f.guests, kaptan: captain(pricing) };
      case "nightly":
        return { kind: "villa", gecelik: pricing.rate, gece: nightsBetween(f.fromDate, f.toDate) };
      case "transferHourly":
        return { kind: "transfer", saatlik: pricing.rate, saat: f.hours };
      case "transferQuote":
        return { kind: "transfer", saatlik: null, saat: 0 };
      case "visa":
        return { kind: "vize", birimFiyat: pricing.price, kisi: f.guests };
    }
  }, [f, pricing]);
  const lines = secim ? kalemler(secim) : [];
  const estimate = secim ? toplam(secim) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setServerError(null);
    const detail: Record<string, string | number | null> =
      kind === "boat"
        ? { from_date: f.fromDate, from_time: f.fromTime, to_date: f.toDate, to_time: f.toTime, captain: "captainOption" in pricing && pricing.captainOption === "herIkisi" ? f.captain : "captainOption" in pricing ? pricing.captainOption : "kaptansiz" }
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
      setServerError(t(key) === key ? "b2c.orderError.generic" : key);
      return;
    }
    router.push(`/magaza/onay/${res.ref}`);
  };

  const minNote =
    pricing.model === "hourly" ? `En az ${pricing.minHours} saat` :
    pricing.model === "multiday" ? `En az ${pricing.minUnits} ${pricing.unit === "gun" ? "gün" : "gece"}` :
    pricing.model === "nightly" ? `En az ${pricing.minNights} gece` : undefined;

  return (
    <form onSubmit={submit} noValidate aria-label={`${t("b2c.request.title")}: ${title}`} className="rounded-[var(--radius-lg)] border-2 border-ink/10 bg-surface p-6 shadow-[var(--shadow-lift)]">
      <h2 className="text-2xl font-extrabold tracking-tight text-ink">{t("b2c.request.title")}</h2>
      <p className="mt-1 text-[length:var(--font-ui-sm)] text-ink-2">{t("b2c.request.lead")}</p>

      <div className="mt-4 grid gap-3">
        {showRange && (
          <Group error={errors.dates}>
            {(describedBy) => (
              <div className="grid grid-cols-2 gap-2" aria-describedby={describedBy}>
                <DateField label={kind === "villa" ? t("b2c.request.checkIn") : t("b2c.request.from")} value={f.fromDate} onChange={(v) => set({ fromDate: v, toDate: f.toDate && f.toDate <= v && kind === "villa" ? addDays(v, 1) : f.toDate })} />
                <DateField label={kind === "villa" ? t("b2c.request.checkOut") : t("b2c.request.to")} value={f.toDate} onChange={(v) => set({ toDate: v })} min={f.fromDate ? (kind === "villa" ? addDays(f.fromDate, 1) : f.fromDate) : undefined} minNote={minNote} />
                {showTime && (
                  <>
                    <TimeSelect label={t("b2c.request.time")} value={f.fromTime} onChange={(v) => set({ fromTime: v })} />
                    <TimeSelect label={t("b2c.request.time")} value={f.toTime} onChange={(v) => set({ toTime: v })} />
                  </>
                )}
              </div>
            )}
          </Group>
        )}
        {kind === "transfer" && (
          <>
            <Group error={errors.dates}>
              {(describedBy) => (
                <div className="grid grid-cols-2 gap-2" aria-describedby={describedBy}>
                  <DateField label={t("b2c.request.date")} value={f.fromDate} onChange={(v) => set({ fromDate: v })} />
                  <TimeSelect label={t("b2c.request.time")} value={f.fromTime} onChange={(v) => set({ fromTime: v })} />
                </div>
              )}
            </Group>
            {pricing.model === "transferHourly" ? (
              <Field label={t("b2c.request.hours")}>
                {(id) => <input id={id} type="number" min={1} max={24} className={`tnum ${input} border-line-strong`} value={f.hours} onChange={(e) => set({ hours: Math.min(24, Math.max(1, Number(e.target.value) || 1)) })} />}
              </Field>
            ) : (
              <Group error={errors.route} label={t("b2c.request.route")}>
                {(describedBy) => (
                  <div className="grid grid-cols-2 gap-2">
                    <input aria-label="Nereden" aria-describedby={describedBy} aria-invalid={errors.route ? true : undefined} placeholder="Nereden" className={`${input} ${errors.route ? "border-danger" : "border-line-strong"}`} value={f.from} onChange={(e) => set({ from: e.target.value })} />
                    <input aria-label="Nereye" aria-describedby={describedBy} aria-invalid={errors.route ? true : undefined} placeholder="Nereye" className={`${input} ${errors.route ? "border-danger" : "border-line-strong"}`} value={f.to} onChange={(e) => set({ to: e.target.value })} />
                  </div>
                )}
              </Group>
            )}
          </>
        )}
        <Field label={t("b2c.request.guests")}>
          {(id) => <input id={id} type="number" min={1} max={99} className={`tnum ${input} border-line-strong`} value={f.guests} onChange={(e) => set({ guests: Math.max(1, Number(e.target.value) || 1) })} />}
        </Field>
        {kind === "boat" && "captainOption" in pricing && pricing.captainOption === "herIkisi" && (
          <Field label={t("b2c.request.captain")}>
            {(id) => (
              <select id={id} className={`${input} border-line-strong`} value={f.captain} onChange={(e) => set({ captain: e.target.value as "kaptanli" | "kaptansiz" })}>
                <option value="kaptanli">{t("b2c.request.captain.kaptanli")}</option>
                <option value="kaptansiz">{t("b2c.request.captain.kaptansiz")}</option>
              </select>
            )}
          </Field>
        )}

        <dl className="flex flex-col gap-1 border-t border-line pt-3">
          {lines.map((k) => (
            <div key={kalemKey(k)} className="flex justify-between text-[length:var(--font-ui-sm)] text-ink-2">
              <dt>{kalemEtiketi(k, currency)}</dt>
              <dd className="tnum">{formatMoney(k.tutar, currency)}</dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between pt-1">
            <dt className="text-[length:var(--font-ui-sm)] text-ink-2">{t("b2c.request.estimate")}</dt>
            <dd className="tnum text-2xl font-extrabold tracking-tight text-ink" aria-live="polite">
              {estimate != null && estimate > 0 ? formatMoney(estimate, currency) : <span className="text-[length:var(--font-ui-sm)] font-normal text-ink-2">{t("b2c.request.quote")}</span>}
            </dd>
          </div>
        </dl>

        <Field label={t("b2c.request.name")} error={errors.name}>
          {(id, describedBy) => <input id={id} autoComplete="name" aria-describedby={describedBy} aria-invalid={errors.name ? true : undefined} className={`${input} ${errors.name ? "border-danger" : "border-line-strong"}`} value={f.name} onChange={(e) => set({ name: e.target.value })} />}
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("b2c.request.email")} error={errors.email}>
            {(id, describedBy) => <input id={id} type="email" autoComplete="email" aria-describedby={describedBy} aria-invalid={errors.email ? true : undefined} className={`${input} ${errors.email ? "border-danger" : "border-line-strong"}`} value={f.email} onChange={(e) => set({ email: e.target.value })} />}
          </Field>
          <Field label={t("b2c.request.phone")}>
            {(id) => <input id={id} type="tel" autoComplete="tel" className={`tnum ${input} border-line-strong`} value={f.phone} onChange={(e) => set({ phone: e.target.value })} />}
          </Field>
        </div>

        {serverError && <p role="alert" className="text-[length:var(--font-ui-sm)] text-danger">✕ {t(serverError)}</p>}
        <Button type="submit" variant="primary" size="lg" disabled={busy} className="w-full font-dense font-semibold">
          {busy ? t("b2c.request.sending") : t("b2c.request.submit")}
        </Button>
      </div>
    </form>
  );
}

function TimeSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1 text-[length:var(--font-ui-sm)] text-ink-2">{label}</label>
      <select id={id} className={`tnum ${input} border-line-strong`} value={value} onChange={(e) => onChange(e.target.value)}>
        {timeSlots(0, 23).map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}

/** Etiket + girdi + hata; hata `<label>` DIŞINDA, girdiye `aria-describedby` ile bağlı. */
function Field({ label, error, children }: { label: string; error?: string; children: (id: string, describedBy: string | undefined) => React.ReactNode }) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1 text-[length:var(--font-ui-sm)] text-ink-2">{label}</label>
      {children(id, error ? errId : undefined)}
      {error && <p id={errId} className="mt-1 text-[length:var(--font-ui-sm)] text-danger">{error}</p>}
    </div>
  );
}

/** Birden çok girdiyi tek hatayla saran grup (tarih aralığı, güzergah). */
function Group({ label, error, children }: { label?: string; error?: string; children: (describedBy: string | undefined) => React.ReactNode }) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <fieldset>
      {label && <legend className="mb-1 text-[length:var(--font-ui-sm)] text-ink-2">{label}</legend>}
      {children(error ? errId : undefined)}
      {error && <p id={errId} role="alert" className="mt-1 text-[length:var(--font-ui-sm)] text-danger">{error}</p>}
    </fieldset>
  );
}
