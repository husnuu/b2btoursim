"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AGENCY } from "@/data/mock";
import { formatMoney, formatShortDate, formatTime, t } from "@/lib/i18n";
import { salePrice } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { useToast } from "@/components/primitives/Toast";
import { Button, ButtonLink } from "@/components/primitives/Button";
import { PriceTriad } from "@/components/primitives/PriceTriad";
import { SupplierMark } from "@/components/primitives/SupplierMark";
import { EmptyState } from "@/components/primitives/States";
import { notifySessionChange, writeSession } from "@/lib/session-store";

/** Tek sayfa, adımsız checkout (Bölüm 4 deseni Extranet'e de uygulanıyor). */
export function CheckoutView() {
  const router = useRouter();
  const { lines, remove, restore, setMargin, totals, clear } = useCart();
  const { notify } = useToast();

  const [lead, setLead] = useState({ name: "", email: "", phone: "", note: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const remaining = AGENCY.balance - totals.net;

  if (lines.length === 0)
    return (
      <EmptyState
        title={t("cart.empty")}
        body={t("cart.emptyBody")}
        action={
          <ButtonLink href="/extranet" variant="primary">
            {t("search.submit")}
          </ButtonLink>
        }
      />
    );

  const confirm = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!lead.name.trim()) next.name = t("checkout.required");
    if (!/^\S+@\S+\.\S+$/.test(lead.email)) next.email = t("checkout.invalidEmail");
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    const ref = `KNT-${Math.floor(24100 + Math.random() * 800)}`;
    const payload = {
      ref,
      lead,
      lines,
      totals,
      issuedAt: new Date().toISOString(),
    };
    writeSession(`kontuar.voucher.${ref}`, JSON.stringify(payload));
    notifySessionChange();
    setTimeout(() => {
      clear();
      router.push(`/extranet/voucher/${ref}`);
    }, 900);
  };

  return (
    <form
      onSubmit={confirm}
      className="mx-auto grid w-full max-w-[86rem] gap-8 px-[var(--pad-x)] py-5 lg:grid-cols-[1fr_22rem]"
    >
      <section>
        <h1 className="mb-3 text-xl font-medium text-ink">{t("checkout.title")}</h1>

        <table className="w-full border-collapse font-dense">
          <tbody>
            {lines.map((line, index) => (
              <tr key={line.id} className="border-b border-line align-middle">
                <td className="py-2 pe-3">
                  <p className="text-[length:var(--font-ui)] text-ink">{line.title}</p>
                  <p className="mt-0.5 flex items-center gap-3 text-[length:var(--font-ui-sm)] text-ink-2">
                    <span>{line.optionName}</span>
                    <span className="tnum">
                      {formatShortDate(line.startsAt)} {formatTime(line.startsAt)}
                    </span>
                    <SupplierMark supplier={line.supplier} />
                    <span className="tnum">
                      {t("search.paxSummary", {
                        adults: line.pax.adults,
                        children: line.pax.children,
                      })}
                    </span>
                  </p>
                </td>
                <td className="w-[19rem] py-2">
                  <PriceTriad
                    net={line.net}
                    marginPct={line.marginPct}
                    onMarginChange={(pct) => setMargin(line.id, pct)}
                  />
                  {/* Üçlü kişi başı; satır toplamı hemen altında. */}
                  <p className="tnum mt-0.5 text-end text-[length:var(--font-ui-xs)] text-ink-3">
                    {t("cart.lineTotal", {
                      pax: line.pax.adults + line.pax.children,
                      amount: formatMoney(
                        salePrice(line.net, line.marginPct) *
                          (line.pax.adults + line.pax.children),
                      ),
                    })}
                  </p>
                </td>
                <td className="w-16 py-2 ps-3 text-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      remove(line.id);
                      notify(t("cart.removed", { product: line.title }), () =>
                        restore(line, index),
                      );
                    }}
                  >
                    {t("cart.remove")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <fieldset className="mt-8 max-w-xl">
          <legend className="mb-2 font-dense text-base font-medium text-ink">
            {t("checkout.lead")}
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label={t("checkout.leadName")}
              value={lead.name}
              error={errors.name}
              onChange={(v) => setLead({ ...lead, name: v })}
              className="sm:col-span-2"
            />
            <TextField
              label={t("checkout.leadEmail")}
              type="email"
              value={lead.email}
              error={errors.email}
              onChange={(v) => setLead({ ...lead, email: v })}
            />
            <TextField
              label={t("checkout.leadPhone")}
              type="tel"
              value={lead.phone}
              onChange={(v) => setLead({ ...lead, phone: v })}
            />
            <TextField
              label={t("checkout.note")}
              placeholder={t("checkout.notePlaceholder")}
              value={lead.note}
              onChange={(v) => setLead({ ...lead, note: v })}
              className="sm:col-span-2"
            />
          </div>
        </fieldset>
      </section>

      <aside className="lg:sticky lg:top-16 lg:self-start">
        <div className="border border-line-strong bg-surface">
          <h2 className="border-b border-line px-3 py-2 font-dense text-[length:var(--font-ui)] font-medium text-ink">
            {t("cart.itemCount", { count: lines.length })}
          </h2>
          <dl className="px-3 py-3 text-[length:var(--font-ui)]">
            <Row label={t("cart.net")} value={formatMoney(totals.net)} muted />
            <Row
              label={t("cart.margin")}
              value={formatMoney(totals.margin)}
              className="text-margin-field"
            />
            <div className="my-2 border-t border-line-strong" />
            <Row
              label={t("cart.sale")}
              value={formatMoney(totals.sale)}
              className="text-[length:calc(var(--font-ui)*1.3)] font-semibold"
            />
          </dl>

          <div className="border-t border-line px-3 py-3">
            <h3 className="text-[length:var(--font-ui-sm)] text-ink-3">
              {t("checkout.payment")}
            </h3>
            <p className="mt-1 text-[length:var(--font-ui)] text-ink">
              {t("checkout.paymentCredit")}
            </p>
            <p
              className={`tnum mt-1 text-[length:var(--font-ui-sm)] ${
                remaining < 0 ? "text-danger" : "text-ink-2"
              }`}
            >
              {remaining < 0
                ? t("balance.blocked")
                : t("checkout.paymentAfter", { amount: formatMoney(remaining) })}
            </p>
          </div>

          <div className="border-t border-line p-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={sending || remaining < 0}
            >
              {sending ? t("checkout.confirming") : t("checkout.confirm")}
            </Button>
          </div>
        </div>
      </aside>
    </form>
  );
}

function Row({
  label,
  value,
  muted,
  className = "",
}: {
  label: string;
  value: string;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-0.5">
      <dt className={muted ? "text-ink-3" : "text-ink-2"}>{label}</dt>
      <dd className={`tnum ${muted ? "text-ink-3" : "text-ink"} ${className}`}>
        {value}
      </dd>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[length:var(--font-ui-sm)] text-ink-2">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`h-9 rounded-[var(--radius)] border bg-surface px-2.5 text-[length:var(--font-ui)]
                    text-ink outline-none placeholder:text-ink-3 ${
                      error ? "border-danger" : "border-line-strong focus:border-action"
                    }`}
      />
      {error && (
        <span className="text-[length:var(--font-ui-sm)] text-danger">{error}</span>
      )}
    </label>
  );
}
