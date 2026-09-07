import { INVOICES } from "@/data/mock";
import { formatMoney, formatShortDate, t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { Button } from "@/components/primitives/Button";

/** Fatura ve ekstre listesi — Sitemap Bölüm 2, /account/invoices (MVP). */
const STATUS: Record<string, MessageKey> = {
  draft: "invoices.status.draft",
  sent: "invoices.status.sent",
  paid: "invoices.status.paid",
  overdue: "invoices.status.overdue",
};

export default function EkstrePage() {
  return (
    <div className="mx-auto w-full max-w-[76rem] px-[var(--pad-x)] py-6">
      <h1 className="text-xl font-medium text-ink">{t("invoices.title")}</h1>

      <table className="mt-5 w-full border-collapse font-dense">
        <thead>
          <tr className="border-b border-line-strong text-[length:var(--font-ui-xs)] text-ink-3">
            <th scope="col" className="w-32 py-1.5 text-start font-normal">{t("invoices.col.number")}</th>
            <th scope="col" className="px-2 py-1.5 text-start font-normal">{t("invoices.col.period")}</th>
            <th scope="col" className="w-36 px-2 py-1.5 text-end font-normal">{t("invoices.col.amount")}</th>
            <th scope="col" className="w-32 px-2 py-1.5 text-end font-normal">{t("invoices.col.tax")}</th>
            <th scope="col" className="w-24 px-2 py-1.5 text-end font-normal">{t("invoices.col.due")}</th>
            <th scope="col" className="w-28 px-2 py-1.5 text-start font-normal">{t("invoices.col.status")}</th>
            <th scope="col" className="w-44 px-2 py-1.5 text-start font-normal">{t("invoices.col.eref")}</th>
            <th scope="col" className="w-24 py-1.5 text-end font-normal">
              <span className="sr-only">{t("invoices.download")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {INVOICES.map((inv) => (
            <tr key={inv.id} className="group h-[var(--row-h)] border-b border-line hover:bg-action-tint">
              <td className="tnum text-[length:var(--font-ui)] text-ink">{inv.number}</td>
              <td className="tnum px-2 text-[length:var(--font-ui-sm)] text-ink-2">
                {formatShortDate(inv.periodStart)} – {formatShortDate(inv.periodEnd)}
              </td>
              <td className="tnum px-2 text-end text-[length:var(--font-ui)] font-semibold text-ink">
                {formatMoney(inv.amount)}
              </td>
              <td className="tnum px-2 text-end text-[length:var(--font-ui-sm)] text-ink-2">
                {formatMoney(inv.taxAmount)}
              </td>
              <td className="tnum px-2 text-end text-[length:var(--font-ui-sm)] text-ink-2">
                {formatShortDate(inv.dueDate)}
              </td>
              <td className="px-2">
                <span
                  className={`text-[length:var(--font-ui-sm)] ${
                    inv.status === "overdue"
                      ? "text-danger"
                      : inv.status === "paid"
                        ? "text-success"
                        : "text-ink-2"
                  }`}
                >
                  {t(STATUS[inv.status])}
                </span>
              </td>
              <td className="tnum px-2 text-[length:var(--font-ui-sm)] text-ink-3">
                {inv.eInvoiceRef ?? "—"}
              </td>
              <td className="text-end">
                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 focus:opacity-100">
                  {t("invoices.download")}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
