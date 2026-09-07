"use client";

import { useMemo } from "react";
import { AGENCY } from "@/data/mock";
import { formatDate, formatMoney, formatShortDate, formatTime, t } from "@/lib/i18n";
import type { CartLine } from "@/lib/types";
import { salePrice } from "@/lib/types";
import { Button, ButtonLink } from "@/components/primitives/Button";
import { StatusBadge } from "@/components/primitives/StatusBadge";
import { SupplierMark } from "@/components/primitives/SupplierMark";
import { EmptyState } from "@/components/primitives/States";
import { useSessionValue } from "@/lib/session-store";

type Payload = {
  ref: string;
  lead: { name: string; email: string; phone: string; note: string };
  lines: CartLine[];
  totals: { net: number; margin: number; sale: number };
  issuedAt: string;
};

/**
 * Voucher müşteriye giden belgedir: net fiyat ve marj burada **görünmez**.
 * PriceDisplay'in retail modu ile aynı kural — B2C yüzeyinde bu sayılar
 * hiçbir koşulda basılmaz.
 */
export function VoucherView({ voucherRef }: { voucherRef: string }) {
  const raw = useSessionValue(`kontuar.voucher.${voucherRef}`);
  const data = useMemo<Payload | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Payload;
    } catch {
      return null;
    }
  }, [raw]);

  if (!data)
    return (
      <EmptyState
        title={t("error.generic.title")}
        body={t("error.generic.body")}
        action={
          <ButtonLink href="/extranet" variant="primary">
            {t("voucher.newSearch")}
          </ButtonLink>
        }
      />
    );

  return (
    <div className="mx-auto w-full max-w-3xl px-[var(--pad-x)] py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <StatusBadge status="confirmed" />
          <h1 className="text-xl font-medium text-ink">{t("voucher.confirmed")}</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.print()}>{t("voucher.download")}</Button>
          <ButtonLink href="/extranet" variant="primary">
            {t("voucher.newSearch")}
          </ButtonLink>
        </div>
      </div>

      {/* Belge yüzeyi: ekranın geri kalanından ayrılsın diye kâğıt zeminde,
          bölümler arası kesikli çizgiyle — bilet stoğu davranışı. */}
      <article className="border border-line-strong bg-paper">
        <header className="flex flex-wrap items-baseline justify-between gap-4 border-b border-dashed border-line-strong px-5 py-4">
          <div>
            <p className="font-dense text-lg font-semibold text-ink">{AGENCY.name}</p>
            <p className="text-[length:var(--font-ui-sm)] text-ink-2">
              {t("voucher.title")}
            </p>
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-[length:var(--font-ui-sm)]">
            <dt className="text-ink-3">{t("voucher.ref")}</dt>
            <dd className="tnum font-semibold text-ink">{data.ref}</dd>
            <dt className="text-ink-3">{t("voucher.issued")}</dt>
            <dd className="tnum text-ink">{formatDate(data.issuedAt)}</dd>
          </dl>
        </header>

        <div className="grid gap-x-8 gap-y-3 border-b border-dashed border-line-strong px-5 py-4 sm:grid-cols-2">
          <div>
            <p className="text-[length:var(--font-ui-sm)] text-ink-3">
              {t("voucher.lead")}
            </p>
            <p className="text-[length:var(--font-ui)] text-ink">{data.lead.name}</p>
            <p className="text-[length:var(--font-ui-sm)] text-ink-2">
              {data.lead.email}
            </p>
            {data.lead.phone && (
              <p className="tnum text-[length:var(--font-ui-sm)] text-ink-2">
                {data.lead.phone}
              </p>
            )}
          </div>
          {data.lead.note && (
            <div>
              <p className="text-[length:var(--font-ui-sm)] text-ink-3">
                {t("checkout.note")}
              </p>
              <p className="max-w-[45ch] text-[length:var(--font-ui)] text-ink">
                {data.lead.note}
              </p>
            </div>
          )}
        </div>

        <ul className="px-5 py-2">
          {data.lines.map((line) => {
            const pax = line.pax.adults + line.pax.children;
            return (
              <li
                key={line.id}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line py-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-[length:calc(var(--font-ui)*1.1)] text-ink">
                    {line.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-4 text-[length:var(--font-ui-sm)] text-ink-2">
                    <span>{line.optionName}</span>
                    <span className="tnum">
                      {formatShortDate(line.startsAt)} {formatTime(line.startsAt)}
                    </span>
                    <SupplierMark supplier={line.supplier} showName />
                  </p>
                </div>
                <p className="tnum text-[length:calc(var(--font-ui)*1.1)] font-medium text-ink">
                  {formatMoney(salePrice(line.net, line.marginPct) * pax)}
                </p>
              </li>
            );
          })}
        </ul>

        <footer className="flex items-baseline justify-between border-t border-dashed border-line-strong px-5 py-4">
          <span className="text-[length:var(--font-ui)] text-ink-2">
            {t("common.total")}
          </span>
          <span className="tnum text-2xl font-semibold text-ink">
            {formatMoney(data.totals.sale)}
          </span>
        </footer>
      </article>
    </div>
  );
}
