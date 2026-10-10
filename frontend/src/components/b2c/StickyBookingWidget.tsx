"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, formatTime, t } from "@/lib/i18n";
import { salePrice, type Product } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { kalemEtiketi, kalemKey } from "@/lib/storefront/kalem-etiket";
import { kalemler, toplam } from "@/lib/storefront/kalemler";
import { Button } from "@/components/primitives/Button";
import { useToast } from "@/components/primitives/Toast";
import { DateField } from "./DateField";
import { WhatsAppLink } from "./detail/DetailShell";

/**
 * Tur rezervasyon kutusu (VITRIN.md §4.7). Masaüstünde sağ sütunda; yapışkanlık
 * kutuda değil, sayfadaki ızgara hücresinde. Mobilde ekranın altında yalnız
 * fiyat + birincil eylem — form kutusu tek kopya basılır (ref §6).
 *
 * Kalkış takvimi olan turda gün takvimden seçilir (yalnız kalkışı olan günler
 * açık), saat o günün kalkışlarından. Takvimsiz turda tarih istenmez; acente
 * onayda belirler. Döküm `kalemler()`: sepet ve ödeme özeti aynı rakamı basar.
 *
 * Perakende marjı sunucudan gelir ve kullanıcıya hiç gösterilmez — burada
 * yalnız satış fiyatı var. Platform ödeme almaz; rezervasyon talep olarak açılır.
 */
const IST_MS = 3 * 60 * 60 * 1000;
const istDay = (iso: string) => new Date(new Date(iso).getTime() + IST_MS).toISOString().slice(0, 10);

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

  const scheduled = useMemo(() => product.variants.filter((v) => !v.id.endsWith("-standart")), [product.variants]);
  const days = useMemo(() => [...new Set(scheduled.map((v) => istDay(v.startsAt)))].sort(), [scheduled]);
  const [day, setDay] = useState(days[0] ?? "");
  const dayOptions = useMemo(() => scheduled.filter((v) => istDay(v.startsAt) === day), [scheduled, day]);
  const [optionId, setOptionId] = useState(dayOptions[0]?.id ?? product.variants[0].id);
  const option = product.variants.find((v) => v.id === optionId) ?? product.variants[0];
  const [pax, setPax] = useState(2);
  const currency = option.currency;

  const unit = salePrice(option.basePrice, retailMarginPct);
  const secim = { kind: "tur" as const, birimFiyat: unit, kisi: pax };
  const lines = kalemler(secim);
  const total = toplam(secim) ?? 0;
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

  const pickDay = (iso: string) => {
    setDay(iso);
    const firstOfDay = scheduled.find((v) => istDay(v.startsAt) === iso);
    if (firstOfDay) setOptionId(firstOfDay.id);
  };

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
  const maxPax = Math.max(1, option.quantityAvailable || 9);

  const body = (
    <>
      <div className="flex items-baseline gap-2">
        <span className="tnum text-3xl font-extrabold tracking-tight text-action">{formatMoney(unit, currency)}</span>
        <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("common.perPerson")}</span>
        <span className="flex-1" />
        {lastSpots && (
          <span className="-rotate-2 inline-block whitespace-nowrap rounded-[2px] border border-warning px-1.5 py-0.5 text-[length:var(--font-ui-xs)] font-semibold uppercase tracking-wide text-warning">
            {t("b2c.detail.lastSpots", { count: option.quantityAvailable })}
          </span>
        )}
      </div>

      {scheduled.length > 0 ? (
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <DateField label={t("b2c.detail.departureDay")} value={day} onChange={pickDay} allowed={days} />
          <label className="flex flex-col">
            <span className="mb-1 block text-[length:var(--font-ui-sm)] text-ink-2">{t("b2c.detail.departureTime")}</span>
            <select
              value={optionId}
              onChange={(e) => setOptionId(e.target.value)}
              className="tnum h-10 rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 text-[length:var(--font-ui)] font-medium text-ink outline-none focus:border-action"
            >
              {dayOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {formatTime(v.startsAt)}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <p className="mt-4 text-[length:var(--font-ui-sm)] text-ink-3">{t("b2c.detail.noDepartures")}</p>
      )}

      <div className="mt-3 flex items-center gap-3">
        <span className="flex-1 font-semibold text-ink">{t("b2c.booking.tickets")}</span>
        <button
          type="button"
          onClick={() => setPax((p) => Math.max(1, p - 1))}
          aria-label={t("b2c.detail.paxDecrease")}
          className="grid size-10 place-items-center rounded-[var(--radius)] border-[1.5px] border-ink/15 text-ink transition-colors hover:border-ink"
        >
          −
        </button>
        <span className="tnum w-6 text-center text-lg font-bold" aria-live="polite">{pax}</span>
        <button
          type="button"
          onClick={() => setPax((p) => Math.min(maxPax, p + 1))}
          aria-label={t("b2c.detail.paxIncrease")}
          className="grid size-10 place-items-center rounded-[var(--radius)] border-[1.5px] border-ink bg-inverse text-ink-inverse transition-transform active:scale-90"
        >
          +
        </button>
      </div>

      <dl className="mt-5 flex flex-col gap-1.5 border-t-2 border-ink pt-4">
        {lines.map((k) => (
          <div key={kalemKey(k)} className="flex justify-between text-[length:var(--font-ui-sm)] text-ink-2">
            <dt>{kalemEtiketi(k, currency)}</dt>
            <dd className="tnum">{formatMoney(k.tutar, currency)}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between pt-1.5">
          <dt className="text-[length:var(--font-ui)] font-medium text-ink">{t("common.total")}</dt>
          <dd className={`tnum rounded-[2px] text-3xl font-extrabold tracking-tight text-ink ${settle ? "price-settle" : ""}`} aria-live="polite">
            {formatMoney(total, currency)}
          </dd>
        </div>
      </dl>

      <Button variant="primary" size="lg" className="mt-4 w-full font-dense font-semibold" onClick={book}>
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
      {/* Masaüstü: panel; yapışkanlık kapsayıcı hücrede */}
      <div id="rezervasyon" className="hidden scroll-mt-40 rounded-[var(--radius-lg)] border-2 border-ink/10 bg-surface p-6 shadow-[var(--shadow-lift)] lg:block">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">{t("b2c.booking.title")}</h2>
        <p className="mt-1 mb-5 flex items-center gap-1.5 text-sm font-semibold text-success">
          <span aria-hidden="true">✓</span> {t("b2c.booking.agencyConfirm")}
        </p>
        {body}
      </div>

      {/* Mobil: alt sabit çubuk — yalnız fiyat ve eylem */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-5 py-3 shadow-[var(--shadow-lift)] lg:hidden">
        <div className="flex items-center gap-4">
          <p className="flex flex-col leading-tight">
            <span className="tnum font-dense text-lg font-bold text-action">{formatMoney(unit, currency)}</span>
            <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("common.perPerson")}</span>
          </p>
          <Button variant="primary" size="lg" className="ms-auto flex-1 font-dense font-semibold" onClick={book}>
            {t("b2c.bookNow")}
          </Button>
        </div>
      </div>
    </>
  );
}
