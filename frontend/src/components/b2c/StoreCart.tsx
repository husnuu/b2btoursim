"use client";

import { formatMoney, formatShortDate, formatTime, t } from "@/lib/i18n";
import { salePrice } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { toplam } from "@/lib/storefront/kalemler";
import { useToast } from "@/components/primitives/Toast";
import { Button, ButtonLink } from "@/components/primitives/Button";
import { EmptyState } from "@/components/primitives/States";
import { OzetKarti } from "./OzetKarti";

/**
 * Tüketici sepeti. Extranet sepetiyle aynı state'i (sekme başına
 * sessionStorage) kullanır ama net fiyat ve marj yok — müşteriye yalnız
 * ödeyeceği tutar. Satır tutarı `toplam()`dan: rezervasyon kutusu ve ödeme
 * özeti aynı rakamı basar (VITRIN.md §4.8).
 */
function lineTotal(net: number, marginPct: number, pax: number): number {
  return toplam({ kind: "tur", birimFiyat: salePrice(net, marginPct), kisi: pax }) ?? 0;
}

export function StoreCart() {
  const { lines, remove, restore } = useCart();
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

  const rows = lines.map((l) => {
    const pax = l.pax.adults + l.pax.children;
    return { line: l, pax, tutar: lineTotal(l.net, l.marginPct, pax) };
  });
  const retailTotal = rows.reduce((s, r) => s + r.tutar, 0);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section>
        <h1 className="font-dense text-[clamp(1.8rem,3.8vw,2.7rem)] font-bold tracking-tight text-ink">{t("b2c.cart")}</h1>

        <ul className="mt-6 border-t border-line">
          {rows.map(({ line, tutar }, index) => (
            <li key={line.id} className="flex gap-4 border-b border-line py-5">
              <span aria-hidden="true" className="h-20 w-24 shrink-0 rounded-[var(--radius)] bg-sunken" />
              <div className="min-w-0 flex-1">
                <p className="font-dense text-[17px] font-semibold text-ink">{line.title}</p>
                <p className="mt-1 text-[length:var(--font-ui-sm)] text-ink-2">{line.optionName}</p>
                <p className="tnum mt-1 text-[length:var(--font-ui-sm)] text-ink-2">
                  {formatShortDate(line.startsAt)} {formatTime(line.startsAt)} ·{" "}
                  {t("search.paxSummary", { adults: line.pax.adults, children: line.pax.children })}
                </p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <span className="tnum font-dense text-[17px] font-bold text-ink">{formatMoney(tutar)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    remove(line.id);
                    notify(t("cart.removed", { product: line.title }), () => restore(line, index));
                  }}
                >
                  {t("cart.remove")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
        <OzetKarti
          satirlar={rows.map(({ line, pax, tutar }) => ({ id: line.id, title: line.title, sub: `${pax} ${t("b2c.unit.perPerson")}`, tutar }))}
          toplamTutar={retailTotal}
        >
          <ButtonLink href="/magaza/odeme" variant="primary" size="lg" className="mt-4 w-full font-dense font-semibold">
            {t("b2c.continue")}
          </ButtonLink>
          <p className="mt-3 text-[length:var(--font-ui-sm)] text-ink-2">{t("b2c.guestOption")}</p>
        </OzetKarti>
      </aside>
    </div>
  );
}
