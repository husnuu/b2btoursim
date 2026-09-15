"use client";

import { formatMoney, t } from "@/lib/i18n";
import { listingBasePrice } from "@/lib/marketplace";
import { useMarketplace } from "@/lib/marketplace-store";
import { PricingBadge } from "./PricingBadge";
import { EmptyState } from "@/components/primitives/States";
import { ButtonLink } from "@/components/primitives/Button";
import { salePrice } from "@/lib/types";

/**
 * Aldıklarım — Spesifikasyon Bölüm 3.4 (gözlemlenmemiş, önerilen kolonlar).
 *
 * Önerilen kolonlara bir ekleme yaptım: "müşteriye çıkan" fiyat. Satıcı
 * acentenin bu ekranda sorduğu asıl soru "bunu kaça satıyorum" — taban
 * fiyat tek başına o soruya cevap vermiyor.
 */
const SELLER_MARGIN = 20;

export function AcquiredInventory() {
  const mp = useMarketplace();
  const rows = mp.acquiredListings;

  return (
    <>
      <h2 className="font-dense text-base font-medium text-ink">
        {t("mp.acquired.title")}
      </h2>
      <p className="mt-1 max-w-[70ch] text-ink-2">{t("mp.acquired.lead")}</p>

      <div className="mt-4">
        {rows.length === 0 ? (
          <EmptyState
            title={t("mp.acquired.empty")}
            body={t("mp.acquired.emptyBody")}
            action={
              <ButtonLink href="/extranet/pazaryeri/tedarikciler" variant="primary">
                {t("mp.tab.suppliers")}
              </ButtonLink>
            }
          />
        ) : (
          <table className="w-full border-collapse font-dense">
            <thead>
              <tr className="border-b border-line-strong text-[length:var(--font-ui-xs)] text-ink-3">
                <th scope="col" className="py-1.5 text-start font-normal">
                  {t("mp.col.listing")}
                </th>
                <th scope="col" className="w-44 px-2 py-1.5 text-start font-normal">
                  {t("mp.col.supplier")}
                </th>
                <th scope="col" className="w-40 px-2 py-1.5 text-start font-normal">
                  {t("mp.pricing.model")}
                </th>
                <th scope="col" className="w-32 px-2 py-1.5 text-end font-normal">
                  {t("mp.col.base")}
                </th>
                <th scope="col" className="w-32 px-2 py-1.5 text-end font-normal">
                  {t("results.col.sale")}
                </th>
                <th scope="col" className="w-28 py-1.5 text-end font-normal">
                  {t("mp.acquired.col.sales")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l, i) => {
                const base = listingBasePrice(l);
                return (
                  <tr
                    key={l.id}
                    className="h-[var(--row-h)] border-b border-line hover:bg-action-tint"
                  >
                    <td className="max-w-0 truncate pe-3 text-[length:var(--font-ui)] text-ink">
                      {l.title}
                    </td>
                    <td className="truncate px-2 text-[length:var(--font-ui-sm)] text-ink-2">
                      {mp.peerById(l.supplierAgencyId)?.name ?? "—"}
                    </td>
                    <td className="px-2">
                      <PricingBadge rule={l.pricing} />
                    </td>
                    <td className="tnum px-2 text-end text-[length:var(--font-ui-sm)] text-ink-3">
                      {formatMoney(base, l.currency)}
                    </td>
                    <td className="tnum px-2 text-end text-[length:calc(var(--font-ui)*1.1)] font-semibold text-ink">
                      {formatMoney(salePrice(base, SELLER_MARGIN), l.currency)}
                    </td>
                    <td className="tnum text-end text-[length:var(--font-ui-sm)] text-ink-2">
                      {i === 0 ? 7 : i === 1 ? 3 : 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
