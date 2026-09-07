"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, t } from "@/lib/i18n";
import { salePrice } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { notifySessionChange, writeSession } from "@/lib/session-store";
import { Button, ButtonLink } from "@/components/primitives/Button";
import { EmptyState } from "@/components/primitives/States";

/**
 * Tek sayfa, adımsız checkout — misafir olarak devam edilebilir (Bölüm 4).
 *
 * Kart alanları görsel olarak var ama hiçbir yere gitmiyor. TDD Bölüm 7:
 * kart verisi bizim sistemimize hiç girmez, ödeme sağlayıcısının
 * (Stripe/Adyen) token'ı saklanır. Gerçek entegrasyonda bu alanlar
 * sağlayıcının barındırdığı iframe alanlarıyla değişir.
 */
const RETAIL_MARGIN = 22;

export function StoreCheckout() {
  const router = useRouter();
  const { lines, totals, clear } = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  if (lines.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <EmptyState
          title={t("b2c.cartEmpty")}
          body={t("b2c.cartEmptyBody")}
          action={
            <ButtonLink href="/magaza/tur-arama" variant="primary" size="lg">
              {t("b2c.browse")}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const retailTotal = lines.reduce((sum, l) => {
    const pax = l.pax.adults + l.pax.children;
    return sum + salePrice(l.net, RETAIL_MARGIN) * pax;
  }, 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = t("checkout.required");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = t("checkout.invalidEmail");
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    const ref = `KNT-B${String(lines.length * 137 + 400).padStart(4, "0")}`;
    writeSession(
      `kontuar.storeorder.${ref}`,
      JSON.stringify({ ref, form, lines, total: retailTotal, totals }),
    );
    notifySessionChange();
    setTimeout(() => {
      clear();
      router.push(`/magaza/onay/${ref}`);
    }, 900);
  };

  return (
    <form
      onSubmit={submit}
      className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div>
        <h1 className="font-dense text-[clamp(1.8rem,3.4vw,2.4rem)] font-semibold tracking-tight text-ink">
          {t("b2c.checkoutTitle")}
        </h1>

        <fieldset className="mt-6">
          <legend className="font-dense text-lg font-medium text-ink">
            {t("b2c.contact")}
          </legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Text label={t("checkout.leadName")} value={form.name} error={errors.name} onChange={(v) => setForm({ ...form, name: v })} className="sm:col-span-2" />
            <Text label={t("checkout.leadEmail")} type="email" value={form.email} error={errors.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Text label={t("checkout.leadPhone")} type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          </div>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="font-dense text-lg font-medium text-ink">
            {t("b2c.payment")}
          </legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Text label={t("b2c.cardNumber")} value="" onChange={() => {}} className="sm:col-span-3" placeholder="•••• •••• •••• ••••" />
            <Text label={t("b2c.cardHolder")} value="" onChange={() => {}} />
            <Text label={t("b2c.cardExpiry")} value="" onChange={() => {}} placeholder="AA/YY" />
            <Text label={t("b2c.cardCvc")} value="" onChange={() => {}} placeholder="•••" />
          </div>
          <p className="mt-3 text-[length:var(--font-ui-sm)] text-ink-2">
            {t("b2c.secureNote")}
          </p>
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-[var(--radius-lg)] border border-line-strong bg-surface p-5">
          <ul className="flex flex-col gap-3">
            {lines.map((l) => {
              const pax = l.pax.adults + l.pax.children;
              return (
                <li key={l.id} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-[length:var(--font-ui-sm)] text-ink-2">
                    {l.title}
                  </span>
                  <span className="tnum text-[length:var(--font-ui)] text-ink">
                    {formatMoney(salePrice(l.net, RETAIL_MARGIN) * pax)}
                  </span>
                </li>
              );
            })}
          </ul>
          <dl className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
            <dt className="text-ink-2">{t("common.total")}</dt>
            <dd className="tnum text-2xl font-semibold text-ink">
              {formatMoney(retailTotal)}
            </dd>
          </dl>
          <Button type="submit" variant="primary" size="lg" className="mt-4 w-full" disabled={busy}>
            {busy ? t("b2c.paying") : t("b2c.payNow", { amount: formatMoney(retailTotal) })}
          </Button>
        </div>
      </aside>
    </form>
  );
}

function Text({
  label,
  value,
  onChange,
  type = "text",
  error,
  className = "",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  className?: string;
  placeholder?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[length:var(--font-ui-sm)] text-ink-2">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`h-11 rounded-[var(--radius)] border bg-surface px-3 text-[length:var(--font-ui)]
                    text-ink outline-none placeholder:text-ink-3 ${
                      error ? "border-danger" : "border-line-strong focus:border-action"
                    }`}
      />
      {error && <span className="text-[length:var(--font-ui-sm)] text-danger">{error}</span>}
    </label>
  );
}
