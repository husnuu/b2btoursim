import Link from "next/link";
import { AGENCY, LEDGER, PAYMENTS } from "@/data/mock";
import { formatMoney, formatShortDate, t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { ButtonLink } from "@/components/primitives/Button";

/**
 * Bakiye ve cari hesap — Sitemap Bölüm 2, /account/balance (MVP).
 *
 * Çift kayıt muhasebe (Strateji Dok. 1.5): her satırın borç/alacak kolonu
 * ve işlem sonrası yürüyen bakiyesi var. Muhasebeci ekstreyle karşılaştırmayı
 * bu kolondan yapar.
 */
const METHOD: Record<string, MessageKey> = {
  card: "payments.method.card",
  bank_transfer: "payments.method.bank_transfer",
  vcc: "payments.method.vcc",
  agency_credit: "payments.method.agency_credit",
};
const PAY_STATUS: Record<string, MessageKey> = {
  pending: "payments.status.pending",
  succeeded: "payments.status.succeeded",
  failed: "payments.status.failed",
  refunded: "payments.status.refunded",
};

export default function BakiyePage() {
  const used = AGENCY.creditLimit - AGENCY.balance;
  const usedPct = Math.round((used / AGENCY.creditLimit) * 100);

  return (
    <div className="mx-auto w-full max-w-[80rem] px-[var(--pad-x)] py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-medium text-ink">{t("balance.title")}</h1>
        <div className="flex gap-2">
          <ButtonLink href="/extranet/ekstre">{t("invoices.title")}</ButtonLink>
          <ButtonLink href="/extranet/bakiye" variant="primary">
            {t("balance.payNow")}
          </ButtonLink>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-line-strong bg-line md:grid-cols-4">
        <Cell label={t("balance.available")} value={formatMoney(AGENCY.balance, AGENCY.currency)} strong />
        <Cell label={t("balance.creditLimit")} value={formatMoney(AGENCY.creditLimit, AGENCY.currency)} />
        <Cell label={t("balance.used")} value={formatMoney(used, AGENCY.currency)} />
        <Cell label={t("balance.term")} value={t("balance.termDays", { days: AGENCY.paymentTermDays })} />
      </dl>

      {/* Limit kullanımı: sayıyı tekrar etmeyen, oranı gösteren tek çubuk. */}
      <div className="mt-3 flex items-center gap-3">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-sunken"
          role="img"
          aria-label={`${t("balance.used")}: %${usedPct}`}
        >
          <div
            className={`h-full ${usedPct > 90 ? "bg-danger" : usedPct > 75 ? "bg-warning" : "bg-success"}`}
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <span className="tnum text-[length:var(--font-ui-sm)] text-ink-2">%{usedPct}</span>
      </div>

      <section className="mt-8">
        <h2 className="mb-2 font-dense text-base font-medium text-ink">
          {t("balance.ledger")}
        </h2>
        <table className="w-full border-collapse font-dense">
          <thead>
            <tr className="border-b border-line-strong text-[length:var(--font-ui-xs)] text-ink-3">
              <th scope="col" className="w-24 py-1.5 text-start font-normal">{t("balance.col.date")}</th>
              <th scope="col" className="w-44 px-2 py-1.5 text-start font-normal">{t("balance.col.account")}</th>
              <th scope="col" className="px-2 py-1.5 text-start font-normal">{t("balance.col.description")}</th>
              <th scope="col" className="w-32 px-2 py-1.5 text-end font-normal">{t("balance.col.debit")}</th>
              <th scope="col" className="w-32 px-2 py-1.5 text-end font-normal">{t("balance.col.credit")}</th>
              <th scope="col" className="w-32 py-1.5 text-end font-normal">{t("balance.col.running")}</th>
            </tr>
          </thead>
          <tbody>
            {LEDGER.map((e) => (
              <tr key={e.id} className="h-[var(--row-h)] border-b border-line hover:bg-action-tint">
                <td className="tnum text-[length:var(--font-ui-sm)] text-ink-2">
                  {formatShortDate(e.date)}
                </td>
                <td className="px-2 text-[length:var(--font-ui-sm)] text-ink-2">{e.account}</td>
                <td className="truncate px-2 text-[length:var(--font-ui)] text-ink">
                  {e.description}
                </td>
                <td className="tnum px-2 text-end text-[length:var(--font-ui)] text-ink">
                  {e.debit ? formatMoney(e.debit) : ""}
                </td>
                <td className="tnum px-2 text-end text-[length:var(--font-ui)] text-success">
                  {e.credit ? formatMoney(e.credit) : ""}
                </td>
                <td className="tnum text-end text-[length:var(--font-ui)] font-semibold text-ink">
                  {formatMoney(e.runningBalance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-dense text-base font-medium text-ink">
          {t("payments.title")}
        </h2>
        <ul className="border-t border-line">
          {PAYMENTS.map((p) => (
            <li
              key={p.id}
              className="flex h-[var(--row-h)] items-center gap-4 border-b border-line font-dense"
            >
              <Link
                href={`/extranet/rezervasyonlar/${p.bookingRef}`}
                className="tnum w-24 text-[length:var(--font-ui)] text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
              >
                {p.bookingRef}
              </Link>
              <span className="w-32 text-[length:var(--font-ui-sm)] text-ink-2">
                {t(METHOD[p.method])}
              </span>
              <span className="tnum w-24 text-[length:var(--font-ui-sm)] text-ink-2">
                {formatShortDate(p.createdAt)}
              </span>
              <span
                className={`w-28 text-[length:var(--font-ui-sm)] ${
                  p.status === "failed"
                    ? "text-danger"
                    : p.status === "refunded"
                      ? "text-ink-3"
                      : "text-success"
                }`}
              >
                {t(PAY_STATUS[p.status])}
              </span>
              <span className="min-w-0 flex-1 truncate text-[length:var(--font-ui-sm)] text-ink-3">
                {p.gatewayReference ?? "—"}
              </span>
              <span className="tnum w-28 text-end text-[length:var(--font-ui)] font-semibold text-ink">
                {formatMoney(p.amount)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Cell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="bg-surface p-3">
      <dt className="text-[length:var(--font-ui-sm)] text-ink-2">{label}</dt>
      <dd
        className={`tnum mt-1 leading-none ${
          strong
            ? "text-[length:calc(var(--font-ui)*1.9)] font-semibold text-ink"
            : "text-[length:calc(var(--font-ui)*1.4)] text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
