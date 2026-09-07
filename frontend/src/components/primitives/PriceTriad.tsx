"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatMoney, t } from "@/lib/i18n";
import { salePrice, type Money } from "@/lib/types";

/**
 * İMZA ÖĞESİ — bu ürünü her tüketici seyahat arayüzünden ayıran şey.
 *
 * Bölüm 3.3, fiyat şeffaflığı: acente aynı satırda tedarikçi net fiyatını,
 * uygulanan marjı ve müşteriye çıkan satış fiyatını görür. Marj satır
 * üzerinde canlı düzenlenir, satış fiyatı anında güncellenir.
 *
 * Marj alanı kutulu bir input değil; kâğıt formdaki doldurulacak boşluk
 * gibi alttan çizgili. Böylece yoğun tabloda 20+ input kutusu gürültüsü
 * oluşmuyor ama alanın düzenlenebilir olduğu görülüyor.
 */
export function PriceTriad({
  net,
  marginPct,
  onMarginChange,
  currency = "TRY",
  compact = true,
}: {
  net: Money;
  marginPct: number;
  onMarginChange: (pct: number) => void;
  currency?: string;
  compact?: boolean;
}) {
  const id = useId();
  const [settle, setSettle] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSettle(true);
    const timer = setTimeout(() => setSettle(false), 640);
    return () => clearTimeout(timer);
  }, [marginPct]);

  const clamp = (n: number) => Math.min(200, Math.max(0, n));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const step = e.shiftKey ? 5 : 1;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onMarginChange(clamp(marginPct + step));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onMarginChange(clamp(marginPct - step));
    }
  };

  return (
    <div className="flex items-baseline justify-end gap-3 font-dense">
      <span
        className="tnum w-[6.5rem] text-end text-[length:var(--font-ui-sm)] text-ink-3"
        title={t("results.col.net")}
      >
        {formatMoney(net, currency)}
      </span>

      <span className="flex w-[3.75rem] items-baseline justify-end">
        <label htmlFor={id} className="sr-only">
          {t("results.marginLabel")}
        </label>
        <input
          id={id}
          inputMode="numeric"
          value={marginPct}
          onKeyDown={onKeyDown}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^\d]/g, "");
            onMarginChange(clamp(digits === "" ? 0 : Number(digits)));
          }}
          className="tnum w-[2.25rem] border-0 border-b border-margin-rule bg-transparent px-0.5 py-px
                     text-end text-[length:var(--font-ui)] font-medium text-margin-field
                     outline-none transition-colors
                     hover:border-b-margin-field
                     focus:rounded-none focus:border-b-2 focus:border-b-action focus:bg-action-tint
                     focus-visible:outline-none"
          aria-describedby={`${id}-hint`}
        />
        <span aria-hidden="true" className="pl-px text-[length:var(--font-ui-sm)] text-margin-field">
          %
        </span>
        <span id={`${id}-hint`} className="sr-only">
          {t("results.marginHint")}
        </span>
      </span>

      <span
        className={`tnum w-[7rem] rounded-[2px] text-end tabular-nums ${
          compact ? "text-[length:calc(var(--font-ui)*1.15)]" : "text-lg"
        } font-semibold text-ink ${settle ? "price-settle" : ""}`}
        aria-live="polite"
      >
        {formatMoney(salePrice(net, marginPct), currency)}
      </span>
    </div>
  );
}

/** Fiyat üçlüsünün kolon başlıkları — tabloda aynı ızgarayı kullanır. */
export function PriceTriadHeader() {
  return (
    <div className="flex items-baseline justify-end gap-3 font-dense text-[length:var(--font-ui-xs)] text-ink-3">
      <span className="w-[6.5rem] text-end">{t("results.col.net")}</span>
      <span className="w-[3.75rem] text-end">{t("results.col.margin")}</span>
      <span className="w-[7rem] text-end">{t("results.col.sale")}</span>
    </div>
  );
}
