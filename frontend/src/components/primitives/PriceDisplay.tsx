import { formatMoney } from "@/lib/i18n";
import { marginAmount, salePrice, type Money } from "@/lib/types";

/**
 * Tek fiyat biçimlendirme kaynağı.
 *
 * mode:
 *   net    — yalnız tedarikçi net fiyatı (Extranet)
 *   retail — yalnız müşteriye çıkan fiyat (B2C ve voucher)
 *   both   — ikisi birden, dar alanlarda alt alta
 *
 * B2C hiçbir koşulda "net" moduna erişmez; bu yüzden storefront bileşenleri
 * PriceDisplay'e mode geçmez, retail varsayılanını kullanır.
 */
export function PriceDisplay({
  net,
  marginPct = 0,
  mode = "retail",
  currency = "TRY",
  size = "md",
  className = "",
}: {
  net: Money;
  marginPct?: number;
  mode?: "net" | "retail" | "both";
  currency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const retail = salePrice(net, marginPct);
  const scale =
    size === "lg"
      ? "text-2xl font-medium"
      : size === "sm"
        ? "text-[length:var(--font-ui-sm)]"
        : "text-[length:var(--font-ui)] font-medium";

  if (mode === "net")
    return (
      <span className={`tnum text-ink-3 ${scale} ${className}`}>
        {formatMoney(net, currency)}
      </span>
    );

  if (mode === "retail")
    return (
      <span className={`tnum text-ink ${scale} ${className}`}>
        {formatMoney(retail, currency)}
      </span>
    );

  return (
    <span className={`flex flex-col items-end leading-tight ${className}`}>
      <span className={`tnum text-ink ${scale}`}>
        {formatMoney(retail, currency)}
      </span>
      <span className="tnum text-[length:var(--font-ui-xs)] text-ink-3">
        {formatMoney(net, currency)} + {formatMoney(marginAmount(net, marginPct), currency)}
      </span>
    </span>
  );
}
