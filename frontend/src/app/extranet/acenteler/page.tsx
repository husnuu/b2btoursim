import { SUB_AGENCIES } from "@/data/mock";
import { formatMoney, t } from "@/lib/i18n";
import { Button } from "@/components/primitives/Button";

/**
 * Alt acente listesi — Sitemap Bölüm 2 (Faz 2).
 *
 * Faz 2 kapsamında ama veri modeli hazır olduğu için okuma görünümü
 * yazıldı; markup/komisyon kuralı arayüzü henüz yok.
 */
export default function AcentelerPage() {
  return (
    <div className="mx-auto w-full max-w-[72rem] px-[var(--pad-x)] py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-medium text-ink">{t("agencies.title")}</h1>
        <Button variant="primary">{t("agencies.create")}</Button>
      </div>

      <table className="mt-5 w-full border-collapse font-dense">
        <thead>
          <tr className="border-b border-line-strong text-[length:var(--font-ui-xs)] text-ink-3">
            <th scope="col" className="py-1.5 text-start font-normal">{t("agencies.col.name")}</th>
            <th scope="col" className="w-40 px-2 py-1.5 text-end font-normal">{t("agencies.col.limit")}</th>
            <th scope="col" className="w-40 px-2 py-1.5 text-end font-normal">{t("agencies.col.balance")}</th>
            <th scope="col" className="w-28 py-1.5 text-end font-normal">{t("agencies.col.term")}</th>
          </tr>
        </thead>
        <tbody>
          {SUB_AGENCIES.map((a) => (
            <tr key={a.id} className="h-[var(--row-h)] border-b border-line hover:bg-action-tint">
              <td className="text-[length:var(--font-ui)] text-ink">{a.name}</td>
              <td className="tnum px-2 text-end text-[length:var(--font-ui)] text-ink-2">
                {formatMoney(a.creditLimit, a.currency)}
              </td>
              <td
                className={`tnum px-2 text-end text-[length:var(--font-ui)] font-semibold ${
                  a.balance <= 0 ? "text-danger" : "text-ink"
                }`}
              >
                {formatMoney(a.balance, a.currency)}
              </td>
              <td className="tnum text-end text-[length:var(--font-ui-sm)] text-ink-2">
                {t("balance.termDays", { days: a.paymentTermDays })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
