"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, formatShortDate, formatTime, t } from "@/lib/i18n";
import { salePrice, type Product } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/primitives/Button";
import { useToast } from "@/components/primitives/Toast";
import { WhatsAppLink } from "@/components/b2c/detail/DetailShell";

/**
 * Bölüm 4: masaüstünde sağda yapışkan rezervasyon paneli, mobilde ekranın
 * altında sabit fiyat + CTA çubuğu. Dönüşüm üzerindeki en yüksek etkili
 * desen — "Perfeksiyon" geçişi (1b): fiyat başlığı + son yer rozeti,
 * katılımcı sayacı, satır dökümü + toplamda kısa vurgu animasyonu,
 * riski azaltan kısa liste, WhatsApp kutunun içinde.
 *
 * B2C perakende marjı sunucudan gelir ve kullanıcıya hiç gösterilmez —
 * burada yalnızca satış fiyatı var. Metinler gerçek akışı anlatır: platform
 * ödeme almaz, rezervasyon bir talep olarak açılır (Bölüm "taraflar arası").
 */
export function StickyBookingWidget({
  product,
  retailMarginPct,
  cartProductId,
  whatsappNumber,
}: {
  product: Product;
  retailMarginPct: number;
  /** Sepet satırının ürün kimliği: kiracı vitrininde slug, örnekte mock id. */
  cartProductId: string;
  whatsappNumber?: string;
}) {
  const router = useRouter();
  const { add } = useCart();
  const { notify } = useToast();
  const [optionId, setOptionId] = useState(product.variants[0].id);
  const [pax, setPax] = useState(2);
  const option = product.variants.find((v) => v.id === optionId)!;
  const unit = salePrice(option.basePrice, retailMarginPct);
  const total = unit * pax;
  // Satır kimliği için sayaç: render'da saat okunmaz (react-hooks/purity).
  const seq = useRef(0);

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
  }, [total]);

  // Sepete ekle ve sepete git. Onay sormaz; sepette "geri al" var.
  const book = () => {
    seq.current += 1;
    add({
      id: `${option.id}-${seq.current}`,
      productId: cartProductId,
      variantId: option.id,
      title: product.title,
      supplier: product.supplier,
      optionName: option.name,
      startsAt: option.startsAt,
      pax: { adults: pax, children: 0 },
      net: option.basePrice,
      marginPct: retailMarginPct,
    });
    notify(t("cart.added", { product: product.title }));
    router.push("/magaza/sepet");
  };

  const lastSpots = option.quantityAvailable > 0 && option.quantityAvailable <= 6;

  const body = (
    <>
      <div className="flex items-baseline gap-2">
        <span className="tnum text-3xl font-semibold text-ink">{formatMoney(unit)}</span>
        <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("common.perPerson")}</span>
        <span className="flex-1" />
        {lastSpots && (
          <span className="-rotate-2 inline-block whitespace-nowrap rounded-[2px] border border-warning px-1.5 py-0.5 text-[length:var(--font-ui-xs)] font-semibold uppercase tracking-wide text-warning">
            {t("b2c.detail.lastSpots", { count: option.quantityAvailable })}
          </span>
        )}
      </div>

      <label className="mt-4 flex flex-col gap-1">
        <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("product.options")}</span>
        <select
          value={optionId}
          onChange={(e) => setOptionId(e.target.value)}
          className="tnum h-11 rounded-[var(--radius)] border border-line-strong bg-surface px-2.5
                     text-[length:var(--font-ui)] font-medium text-ink outline-none focus:border-action"
        >
          {product.variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.startsAt ? `${formatShortDate(v.startsAt)} — ${formatTime(v.startsAt)}` : v.name}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-3 flex items-center gap-3">
        <span className="flex-1 text-[length:var(--font-ui-sm)] text-ink-2">{t("search.pax")}</span>
        <button
          type="button"
          onClick={() => setPax((p) => Math.max(1, p - 1))}
          aria-label={t("b2c.detail.paxDecrease")}
          className="grid h-9 w-9 place-items-center rounded-full border border-line-strong text-[length:var(--font-ui)] text-ink hover:border-action hover:text-action"
        >
          −
        </button>
        <span className="tnum w-6 text-center text-[length:var(--font-ui)] font-semibold">{pax}</span>
        <button
          type="button"
          onClick={() => setPax((p) => Math.min(option.quantityAvailable || 9, p + 1))}
          aria-label={t("b2c.detail.paxIncrease")}
          className="grid h-9 w-9 place-items-center rounded-full border border-line-strong text-[length:var(--font-ui)] text-ink hover:border-action hover:text-action"
        >
          +
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-3">
        <div className="flex justify-between text-[length:var(--font-ui-sm)] text-ink-2">
          <span>{formatMoney(unit)} × {pax} {t("search.adults")}</span>
          <span className="tnum">{formatMoney(total)}</span>
        </div>
        <div className="flex items-baseline justify-between pt-1.5">
          <span className="text-[length:var(--font-ui)] font-medium text-ink">{t("common.total")}</span>
          <span className={`tnum rounded-[2px] text-xl font-semibold text-ink ${settle ? "price-settle" : ""}`} aria-live="polite">
            {formatMoney(total)}
          </span>
        </div>
      </div>

      <Button variant="primary" size="lg" className="mt-4 w-full" onClick={book}>
        {t("b2c.bookNow")}
      </Button>
      <p className="mt-2 text-center text-[length:var(--font-ui-xs)] text-ink-3">{t("b2c.detail.instantConfirm")}</p>

      {product.cancellation.type === "free" && (
        <p className="mt-3 flex gap-2 text-[length:var(--font-ui-sm)] text-ink-2">
          <span aria-hidden="true" className="font-semibold text-success">✓</span>
          {t("results.freeCancel", { hours: product.cancellation.hoursBefore })}
        </p>
      )}

      {whatsappNumber && (
        <div className="mt-3">
          <WhatsAppLink number={whatsappNumber} title={product.title} />
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Masaüstü: yapışkan panel */}
      <aside className="hidden lg:block">
        <div className="sticky top-6 rounded-[var(--radius-lg)] border border-line-strong bg-surface p-5 shadow-[var(--shadow-raised)]">
          {body}
        </div>
      </aside>

      {/* Mobil: alt sabit çubuk */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-4 py-3 lg:hidden">
        <div className="flex items-center gap-4">
          <p className="flex flex-col leading-tight">
            <span className="tnum text-lg font-semibold text-ink">{formatMoney(unit)}</span>
            <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("common.perPerson")}</span>
          </p>
          <Button variant="primary" size="lg" className="ms-auto flex-1" onClick={book}>
            {t("b2c.bookNow")}
          </Button>
        </div>
      </div>
    </>
  );
}
