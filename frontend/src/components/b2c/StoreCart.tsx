"use client";

import { formatMoney, formatShortDate, formatTime, t } from "@/lib/i18n";
import { salePrice } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { useToast } from "@/components/primitives/Toast";
import { Button, ButtonLink } from "@/components/primitives/Button";
import { EmptyState } from "@/components/primitives/States";

/**
 * Tüketici sepeti.
 *
 * Extranet sepetiyle aynı state'i (sekme başına sessionStorage) kullanıyor
 * ama net fiyat ve marj kolonları yok — müşteriye yalnız ödeyeceği tutar
 * gösterilir. Perakende marjı sunucudan gelir.
 */
const RETAIL_MARGIN = 22;

export function StoreCart() {
  const { lines, remove, restore, totals } = useCart();
  const { notify } = useToast();

  if (lines.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <EmptyState
          title={t("b2c.cartEmpty")}
          body={t("b2c.cartEmptyBody")}
          action={
            <ButtonLink href="/magaza/tur-arama" variant="primary" size="lg">
              {t("b2c.browse")}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const retailTotal = lines.reduce((sum, l) => {
    const pax = l.pax.adults + l.pax.children;
    return sum + salePrice(l.net, RETAIL_MARGIN) * pax;
  }, 0);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section>
        <h1 className="font-dense text-[clamp(1.8rem,3.4vw,2.4rem)] font-semibold tracking-tight text-ink">
          {t("b2c.cart")}
        </h1>

        <ul className="mt-6 border-t border-line">
          {lines.map((line, index) => {
            const pax = line.pax.adults + line.pax.children;
            return (
              <li key={line.id} className="flex gap-4 border-b border-line py-5">
                <span
                  aria-hidden="true"
                  className="h-20 w-24 shrink-0 rounded-[var(--radius)] bg-sunken"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[length:calc(var(--font-ui)*1.1)] text-ink">
                    {line.title}
                  </p>
                  <p className="mt-1 text-[length:var(--font-ui-sm)] text-ink-2">
                    {line.optionName}
                  </p>
                  <p className="tnum mt-1 text-[length:var(--font-ui-sm)] text-ink-2">
                    {formatShortDate(line.startsAt)} {formatTime(line.startsAt)} ·{" "}
                    {t("search.paxSummary", {
                      adults: line.pax.adults,
                      children: line.pax.children,
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <span className="tnum text-[length:calc(var(--font-ui)*1.2)] font-semibold text-ink">
                    {formatMoney(salePrice(line.net, RETAIL_MARGIN) * pax)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      remove(line.id);
                      notify(t("cart.removed", { product: line.title }), () =>
                        restore(line, index),
                      );
                    }}
                  >
                    {t("cart.remove")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-[var(--radius-lg)] border border-line-strong bg-surface p-5">
          <dl className="flex items-baseline justify-between">
            <dt className="text-ink-2">{t("common.total")}</dt>
            <dd className="tnum text-2xl font-semibold text-ink">
              {formatMoney(retailTotal)}
            </dd>
          </dl>
          <ButtonLink href="/magaza/odeme" variant="primary" size="lg" className="mt-4 w-full">
            {t("b2c.continue")}
          </ButtonLink>
          <p className="mt-3 text-[length:var(--font-ui-sm)] text-ink-2">
            {t("b2c.guestOption")}
          </p>
          <p className="sr-only">{formatMoney(totals.sale)}</p>
        </div>
      </aside>
    </div>
  );
}
