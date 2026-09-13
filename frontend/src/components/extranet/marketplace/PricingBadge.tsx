import { formatMoney, t } from "@/lib/i18n";
import type { MarketplacePricingRule } from "@/lib/marketplace";

/**
 * Fiyat modeli rozeti. Komisyon ve net fiyat farklı ticari anlaşmalar —
 * renk tek başına ayırt etmeye yetmediği için model adı her zaman yazılı.
 */
export function PricingBadge({ rule }: { rule: MarketplacePricingRule }) {
  const isCommission = rule.model === "komisyon";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius)] border px-1.5 py-px font-dense text-[length:var(--font-ui-sm)] leading-5 ${
        isCommission
          ? "border-info/25 bg-info-tint text-info"
          : "border-success/25 bg-success-tint text-success"
      }`}
    >
      {t(isCommission ? "mp.pricing.komisyon" : "mp.pricing.netFiyat")}
      <b className="tnum font-semibold">
        {isCommission
          ? `%${rule.commissionPct ?? 0}`
          : formatMoney(rule.netAmount ?? 0, rule.currency)}
      </b>
    </span>
  );
}
