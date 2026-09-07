"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANS } from "@/data/mock";
import { formatMoney, formatNumber, t } from "@/lib/i18n";
import { Button, ButtonLink } from "@/components/primitives/Button";

/**
 * Kiracı onboarding sihirbazı — Sitemap Bölüm 1 (MVP).
 *
 * Bağlam dokümanı Bölüm 5: Süper Admin'in geri kalanı iç araç estetiğinde
 * kalabilir, ama bu akış satış ekibinin canlı demoda kullanacağı ekran.
 * Bu yüzden tek özenli admin ekranı burası: net adımlar, geri dönülebilir,
 * her adımda ne olacağı yazılı.
 *
 * Adımlar bir sıra olduğu için numaralandırma burada meşru — sayfanın
 * geri kalanında numaralı işaret kullanılmıyor.
 */
const STEPS = ["admin.onboarding.step1", "admin.onboarding.step2", "admin.onboarding.step3"] as const;

const COUNTRIES = ["Türkiye", "Yunanistan", "İtalya", "Birleşik Arap Emirlikleri"];
const CURRENCIES = ["TRY", "EUR", "USD", "GBP"];

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "",
    country: COUNTRIES[0],
    currency: "TRY",
    plan: "growth",
    adminName: "",
    adminEmail: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const canAdvance =
    step === 0 ? form.name.trim().length > 1 : step === 1 ? Boolean(form.plan) : true;

  if (done) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <h1 className="font-dense text-2xl font-semibold text-ink">
          {t("admin.onboarding.doneTitle", { name: form.name })}
        </h1>
        <p className="mt-2 text-ink-2">{t("admin.onboarding.doneBody")}</p>
        <div className="mt-6 flex gap-2">
          <ButtonLink href="/admin/kiracilar" variant="primary">
            {t("admin.tenants.title")}
          </ButtonLink>
          <Button
            onClick={() => {
              setDone(false);
              setStep(0);
              setForm({ ...form, name: "", adminName: "", adminEmail: "" });
            }}
          >
            {t("admin.tenants.new")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-4">
      <Link
        href="/admin/kiracilar"
        className="text-[length:var(--font-ui-sm)] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
      >
        {t("admin.tenants.title")}
      </Link>

      <h1 className="mt-3 font-dense text-2xl font-semibold text-ink">
        {t("admin.onboarding.title")}
      </h1>

      {/* Adım göstergesi: içerik gerçekten bir sıra olduğu için numaralı. */}
      <ol className="mt-6 flex gap-px overflow-hidden rounded-[var(--radius)] border border-line-strong bg-line">
        {STEPS.map((s, i) => {
          const state = i === step ? "current" : i < step ? "done" : "todo";
          return (
            <li
              key={s}
              aria-current={state === "current" ? "step" : undefined}
              className={`flex flex-1 items-center gap-2 px-3 py-2 text-[length:var(--font-ui-sm)] ${
                state === "current"
                  ? "bg-surface font-medium text-ink"
                  : state === "done"
                    ? "bg-surface text-ink-2"
                    : "bg-sunken text-ink-3"
              }`}
            >
              <span
                aria-hidden="true"
                className={`tnum inline-grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[length:var(--font-ui-xs)] ${
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
        {t("admin.onboarding.step", { current: step + 1, total: STEPS.length })}
      </p>

      <div className="mt-6 rounded-[var(--radius-lg)] border border-line-strong bg-surface p-5">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <Text label={t("admin.onboarding.companyName")} value={form.name} onChange={(v) => set("name", v)} autoFocus />
            <Select label={t("admin.onboarding.country")} value={form.country} onChange={(v) => set("country", v)} options={COUNTRIES} />
            <Select label={t("admin.onboarding.currency")} value={form.currency} onChange={(v) => set("currency", v)} options={CURRENCIES} />
          </div>
        )}

        {step === 1 && (
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">{t("admin.onboarding.step2")}</legend>
            {PLANS.map((p) => (
              <label
                key={p.id}
                className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius)] border p-3 transition-colors ${
                  form.plan === p.id
                    ? "border-ink bg-action-tint"
                    : "border-line-strong hover:border-ink-3"
                }`}
              >
                <input
                  type="radio"
                  name="plan"
                  value={p.id}
                  checked={form.plan === p.id}
                  onChange={() => set("plan", p.id)}
                  className="mt-1 h-4 w-4 accent-[var(--action-primary)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-dense text-[length:calc(var(--font-ui)*1.15)] font-medium text-ink">
                      {p.name}
                    </span>
                    <span className="tnum text-[length:var(--font-ui)] font-semibold text-ink">
                      {formatMoney(p.monthlyPrice)}
                    </span>
                  </span>
                  <span className="mt-1 block text-[length:var(--font-ui-sm)] text-ink-2">
                    {p.features.join(", ")}
                  </span>
                  <span className="tnum mt-1 flex flex-wrap gap-x-4 text-[length:var(--font-ui-sm)] text-ink-3">
                    <span>
                      {t("admin.plans.col.bookings")}:{" "}
                      {p.bookingQuota < 0 ? t("admin.plans.unlimited") : formatNumber(p.bookingQuota)}
                    </span>
                    <span>
                      {t("admin.plans.col.agencies")}:{" "}
                      {p.agencyQuota < 0 ? t("admin.plans.unlimited") : formatNumber(p.agencyQuota)}
                    </span>
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <Text label={t("admin.onboarding.adminName")} value={form.adminName} onChange={(v) => set("adminName", v)} autoFocus />
            <Text label={t("admin.onboarding.adminEmail")} type="email" value={form.adminEmail} onChange={(v) => set("adminEmail", v)} />
            <p className="text-[length:var(--font-ui-sm)] text-ink-2">
              {t("admin.onboarding.doneBody")}
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-between">
        <Button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          {t("admin.onboarding.back")}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button variant="primary" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
            {t("admin.onboarding.next")}
          </Button>
        ) : (
          <Button variant="primary" onClick={() => setDone(true)}>
            {t("admin.onboarding.finish")}
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
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[length:var(--font-ui-sm)] text-ink-2">{label}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
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
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
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
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
