"use client";

import { useState } from "react";
import { formatMoney, t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import type { PricingModel } from "@/lib/marketplace";
import { useMarketplace } from "@/lib/marketplace-store";
import { Button } from "@/components/primitives/Button";
import { useToast } from "@/components/primitives/Toast";

/**
 * Pazaryeri kurulum sihirbazı — Spesifikasyon Bölüm 2 (6 adım).
 *
 * Adımlar gerçek bir sıra olduğu için numaralandırma meşru; platformdaki
 * diğer sihirbazlarla (Tur Oluşturma, Kiracı Onboarding) aynı desen.
 *
 * Bölüm 2.4 "Fiyatlandırma" adımı referans üründe gözlemlenmemiş, doküman
 * alan setini öneri olarak vermiş — burada o öneri uygulandı.
 *
 * Sözleşme metninde (2.5) referans üründen bir sapma var: oradaki üç maddeye
 * **dördüncü olarak para akışı** eklendi. Platform tahsilat yapmadığı için
 * bunun sözleşmede yazılı olması gerekiyor, yoksa acente parayı platformdan
 * bekler.
 */
const STEPS: MessageKey[] = [
  "mp.setup.s1",
  "mp.setup.s2",
  "mp.setup.s3",
  "mp.setup.s4",
  "mp.setup.s5",
  "mp.setup.s6",
];

const COUNTRIES = ["Türkiye", "Yunanistan", "Kuzey Kıbrıs"];
const CITIES: Record<string, string[]> = {
  Türkiye: ["Nevşehir", "İstanbul", "İzmir", "Antalya", "Muğla", "Trabzon"],
  Yunanistan: ["Atina", "Selanik", "Rodos"],
  "Kuzey Kıbrıs": ["Girne", "Lefkoşa"],
};

export function MarketplaceSetup() {
  const mp = useMarketplace();
  const { notify } = useToast();
  const [step, setStep] = useState(0);

  const p = mp.profile;
  const [form, setForm] = useState({
    country: p?.country ?? "Türkiye",
    city: p?.city ?? "Nevşehir",
    description: p?.description ?? "",
    contactEmail: p?.contactEmail ?? "",
    contactPhone: p?.contactPhone ?? "",
    model: (p?.defaultPricing.model ?? "komisyon") as PricingModel,
    commissionPct: p?.defaultPricing.commissionPct ?? 15,
    netAmount: Math.round((p?.defaultPricing.netAmount ?? 0) / 100),
    accepted: Boolean(p?.setupCompletedAt),
    isVisible: p?.isVisible ?? true,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canAdvance =
    step === 1
      ? Boolean(form.country && form.city)
      : step === 2
        ? form.description.trim().length > 10
        : step === 4
          ? form.accepted
          : true;

  const save = () => {
    mp.saveProfile({
      agencyId: mp.agencyId,
      country: form.country,
      city: form.city,
      description: form.description,
      contactEmail: form.contactEmail || null,
      contactPhone: form.contactPhone || null,
      defaultPricing: {
        id: "pr-default",
        model: form.model,
        commissionPct: form.model === "komisyon" ? form.commissionPct : null,
        netAmount: form.model === "netFiyat" ? form.netAmount * 100 : null,
        currency: mp.currency,
      },
      isVisible: form.isVisible,
      setupCompletedAt: p?.setupCompletedAt ?? new Date().toISOString(),
    });
    notify(t("mp.setup.saved"));
  };

  return (
    <div className="max-w-3xl">
      <h2 className="font-dense text-base font-medium text-ink">
        {t("mp.setup.title")}
      </h2>

      <ol className="mt-4 flex gap-px overflow-hidden rounded-[var(--radius)] border border-line-strong bg-line">
        {STEPS.map((s, i) => {
          const state = i === step ? "current" : i < step ? "done" : "todo";
          return (
            <li
              key={s}
              aria-current={state === "current" ? "step" : undefined}
              className={`flex flex-1 items-center gap-1.5 px-2 py-1.5 text-[length:var(--font-ui-sm)] ${
                state === "current"
                  ? "bg-surface font-medium text-ink"
                  : state === "done"
                    ? "bg-surface text-ink-2"
                    : "bg-sunken text-ink-3"
              }`}
            >
              <span
                aria-hidden="true"
                className={`tnum inline-grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[length:var(--font-ui-xs)] ${
                  state === "todo" ? "border-line-strong text-ink-3" : "border-ink text-ink"
                }`}
              >
                {state === "done" ? "✓" : i + 1}
              </span>
              <span className="truncate">{t(s)}</span>
            </li>
          );
        })}
      </ol>

      <p className="mt-2 text-[length:var(--font-ui-sm)] text-ink-3">
        {t("mp.setup.step", { current: step + 1, total: STEPS.length })}
      </p>

      <div className="mt-5 rounded-[var(--radius-lg)] border border-line-strong bg-surface p-5">
        {step === 0 && (
          <>
            <h3 className="font-dense text-lg font-medium text-ink">
              {t("mp.setup.welcome")}
            </h3>
            <p className="mt-2 max-w-[64ch] leading-relaxed text-ink-2">
              {t("mp.setup.welcomeBody")}
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {(["mp.setup.b1", "mp.setup.b2", "mp.setup.b3", "mp.setup.b4"] as MessageKey[]).map(
                (k) => (
                  <li key={k} className="flex gap-2 text-ink-2">
                    <span aria-hidden="true" className="text-success">✓</span>
                    {t(k)}
                  </li>
                ),
              )}
            </ul>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-ink-2">{t("mp.setup.locationLead")}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Select
                label={t("mp.setup.country")}
                value={form.country}
                options={COUNTRIES}
                onChange={(v) => {
                  set("country", v);
                  set("city", CITIES[v][0]);
                }}
              />
              <Select
                label={t("mp.setup.city")}
                value={form.city}
                options={CITIES[form.country] ?? []}
                onChange={(v) => set("city", v)}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-ink-2">{t("mp.setup.profileLead")}</p>
            <label className="mt-4 flex flex-col gap-1.5">
              <span className="text-[length:var(--font-ui-sm)] text-ink-2">
                {t("mp.setup.description")}
              </span>
              <textarea
                rows={4}
                value={form.description}
                placeholder={t("mp.setup.descriptionHint")}
                onChange={(e) => set("description", e.target.value)}
                className="rounded-[var(--radius)] border border-line-strong bg-surface p-2.5
                           text-[length:var(--font-ui)] leading-relaxed text-ink outline-none
                           placeholder:text-ink-3 focus:border-action"
              />
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Text
                label={t("mp.setup.contactEmail")}
                type="email"
                value={form.contactEmail}
                onChange={(v) => set("contactEmail", v)}
              />
              <Text
                label={t("mp.setup.contactPhone")}
                type="tel"
                value={form.contactPhone}
                onChange={(v) => set("contactPhone", v)}
              />
            </div>
            <p className="mt-2 text-[length:var(--font-ui-sm)] text-ink-3">
              {t("mp.setup.contactHint")}
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-ink-2">{t("mp.setup.pricingLead")}</p>
            <fieldset className="mt-4 flex flex-col gap-2">
              <legend className="sr-only">{t("mp.pricing.model")}</legend>
              {(["komisyon", "netFiyat"] as const).map((m) => (
                <label
                  key={m}
                  className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius)] border p-3 transition-colors ${
                    form.model === m
                      ? "border-ink bg-action-tint"
                      : "border-line-strong hover:border-ink-3"
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    checked={form.model === m}
                    onChange={() => set("model", m)}
                    className="mt-1 h-4 w-4 accent-[var(--action-primary)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="font-dense text-[length:calc(var(--font-ui)*1.1)] font-medium text-ink">
                      {t(m === "komisyon" ? "mp.pricing.komisyon" : "mp.pricing.netFiyat")}
                    </span>
                    <span className="mt-1 block max-w-[60ch] text-[length:var(--font-ui-sm)] text-ink-2">
                      {t(m === "komisyon" ? "mp.pricing.komisyonHint" : "mp.pricing.netFiyatHint")}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="mt-4 max-w-xs">
              {form.model === "komisyon" ? (
                <Text
                  label={t("mp.pricing.commissionPct")}
                  value={String(form.commissionPct)}
                  onChange={(v) =>
                    set("commissionPct", Math.min(90, Math.max(0, Number(v.replace(/\D/g, "")) || 0)))
                  }
                />
              ) : (
                <Text
                  label={t("mp.pricing.netAmount")}
                  value={String(form.netAmount)}
                  onChange={(v) => set("netAmount", Number(v.replace(/\D/g, "")) || 0)}
                />
              )}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h3 className="font-dense text-lg font-medium text-ink">
              {t("mp.setup.termsTitle")}
            </h3>
            <p className="mt-1 text-ink-2">{t("mp.setup.termsLead")}</p>
            <ul className="mt-4 flex flex-col gap-3 border-s-2 border-warning ps-4">
              {(["mp.setup.t1", "mp.setup.t2", "mp.setup.t3", "mp.setup.t4"] as MessageKey[]).map(
                (k) => (
                  <li key={k} className="max-w-[68ch] leading-relaxed text-ink-2">
                    {t(k)}
                  </li>
                ),
              )}
            </ul>
            <label className="mt-5 flex items-start gap-2.5">
              <input
                type="checkbox"
                checked={form.accepted}
                onChange={(e) => set("accepted", e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--action-primary)]"
              />
              <span className="text-ink">{t("mp.setup.accept")}</span>
            </label>
          </>
        )}

        {step === 5 && (
          <>
            <h3 className="font-dense text-lg font-medium text-ink">
              {t("mp.setup.doneTitle")}
            </h3>
            <p className="mt-1 text-ink-2">{t("mp.setup.doneLead")}</p>
            <dl className="mt-4 grid grid-cols-[10rem_1fr] gap-x-6 gap-y-2 font-dense text-[length:var(--font-ui)]">
              <dt className="text-ink-3">{t("mp.setup.s2")}</dt>
              <dd className="text-ink">{form.city}, {form.country}</dd>
              <dt className="text-ink-3">{t("mp.setup.description")}</dt>
              <dd className="max-w-[54ch] text-ink">{form.description || "—"}</dd>
              <dt className="text-ink-3">{t("mp.setup.contactEmail")}</dt>
              <dd className="text-ink">{form.contactEmail || "Şirket ayarlarındaki iletişim"}</dd>
              <dt className="text-ink-3">{t("mp.pricing.model")}</dt>
              <dd className="tnum text-ink">
                {t(form.model === "komisyon" ? "mp.pricing.komisyon" : "mp.pricing.netFiyat")}
                {" — "}
                {form.model === "komisyon"
                  ? `%${form.commissionPct}`
                  : formatMoney(form.netAmount * 100, mp.currency)}
              </dd>
            </dl>

            <label className="mt-5 flex items-start gap-2.5 border-t border-line pt-4">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={(e) => set("isVisible", e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--action-primary)]"
              />
              <span>
                <span className="text-ink">{t("mp.setup.visibility")}</span>
                <span className="mt-0.5 block max-w-[64ch] text-[length:var(--font-ui-sm)] text-ink-2">
                  {t("mp.setup.visibilityHint")}
                </span>
              </span>
            </label>
          </>
        )}
      </div>

      <div className="mt-5 flex justify-between">
        <Button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          {t("mp.setup.back")}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button variant="primary" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
            {t("mp.setup.next")}
          </Button>
        ) : (
          <Button variant="primary" onClick={save}>
            {t("mp.setup.activate")}
          </Button>
        )}
      </div>
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[length:var(--font-ui-sm)] text-ink-2">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-[var(--radius)] border border-line-strong bg-surface px-2.5
                   text-[length:var(--font-ui)] text-ink outline-none focus:border-action"
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[length:var(--font-ui-sm)] text-ink-2">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-[var(--radius)] border border-line-strong bg-surface px-2
                   text-[length:var(--font-ui)] text-ink outline-none focus:border-action"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
