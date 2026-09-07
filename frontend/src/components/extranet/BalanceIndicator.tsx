import { formatMoney, t } from "@/lib/i18n";

/**
 * Bölüm 3.3: bakiye her zaman görünür. Operatör rezervasyon
 * yapamayacağını checkout'ta değil, en baştan bilmeli.
 */
export function BalanceIndicator({
  balance,
  creditLimit,
  currency = "TRY",
}: {
  balance: number;
  creditLimit: number;
  currency?: string;
}) {
  const usedPct = Math.min(100, Math.max(0, ((creditLimit - balance) / creditLimit) * 100));
  const low = balance <= creditLimit * 0.1;
  const blocked = balance <= 0;

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex flex-col items-end leading-none">
        <span
          className={`tnum text-[length:var(--font-ui)] font-semibold ${
            blocked ? "text-danger" : low ? "text-warning" : "text-ink"
          }`}
        >
          {formatMoney(balance, currency)}
        </span>
        <span className="tnum mt-0.5 text-[length:var(--font-ui-xs)] text-ink-3">
          {t("balance.limit", { amount: formatMoney(creditLimit, currency) })}
        </span>
      </div>

      {/* Dolan kısım kullanılan krediyi gösterir; ölçek etiketi yerine
          doğrudan sayının yanında durur. */}
      <div
        className="h-7 w-1.5 overflow-hidden rounded-[1px] bg-sunken"
        role="img"
        aria-label={`${t("balance.label")}: ${formatMoney(balance, currency)}`}
      >
        <div
          className={`w-full ${blocked ? "bg-danger" : low ? "bg-warning" : "bg-success"}`}
          style={{ height: `${100 - usedPct}%`, marginTop: `${usedPct}%` }}
        />
      </div>
    </div>
  );
}
