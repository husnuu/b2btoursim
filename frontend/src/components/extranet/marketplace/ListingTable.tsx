"use client";

import { formatMoney, t } from "@/lib/i18n";
import type { ListingKind } from "@/lib/marketplace";
import { listingBasePrice, supplierPayout } from "@/lib/marketplace";
import { peerById, useMarketplace } from "@/lib/marketplace-store";
import { PricingBadge } from "./PricingBadge";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { AGENCY } from "@/data/mock";

/**
 * Pazaryeri envanteri listesi — keşif ekranlarının (Bölüm 3.2, 3.3) ortak
 * tablosu. Tur ve transfer simetrik olduğu için tek bileşen; spesifikasyon
 * Bölüm 1.1 de bu simetriyi gözlemlemiş.
 *
 * Fiyat kolonları Extranet'in her yerindeki mantığı sürdürür: taban fiyat
 * ve tedarikçiye kalan ayrı ayrı görünür — satıcı ne kazanacağını
 * kontrat kurmadan önce bilir.
 */
export function ListingTable({ kind }: { kind: ListingKind }) {
  const mp = useMarketplace();
  const rows = mp.peerListings.filter((l) => l.kind === kind);

  const contractFor = (supplierAgencyId: string) =>
    mp.contracts.find(
      (c) => c.supplierAgencyId === supplierAgencyId && c.sellerAgencyId === AGENCY.id,
    );

  return (
    <table className="w-full border-collapse font-dense">
      <thead>
        <tr className="border-b border-line-strong text-[length:var(--font-ui-xs)] text-ink-3">
          <th scope="col" className="w-8 p-0" />
          <th scope="col" className="py-1.5 ps-1 text-start font-normal">
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
            {t("mp.col.payout")}
          </th>
          <th scope="col" className="w-36 py-1.5 text-start font-normal">
            {t("mp.suppliers.col.contract")}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((l) => {
          const agency = peerById(l.supplierAgencyId);
          const contract = contractFor(l.supplierAgencyId);
          return (
            <tr
              key={l.id}
              className={`h-[var(--row-h)] border-b border-line hover:bg-action-tint ${
                l.isActive ? "" : "opacity-55"
              }`}
            >
              <td className="p-0 ps-[var(--pad-x)]">
                <span
                  aria-hidden="true"
                  className="block h-5 w-5 rounded-[2px]"
                  style={{ background: l.imageTone }}
                />
              </td>
              <td className="max-w-0 truncate ps-2 pe-3 text-[length:var(--font-ui)] text-ink">
                {l.title}
                {!l.isActive && (
                  <span className="ms-2 text-[length:var(--font-ui-sm)] text-ink-3">
                    {t("mp.listing.passive")}
                  </span>
                )}
              </td>
              <td className="truncate px-2 text-[length:var(--font-ui-sm)] text-ink-2">
                {agency?.name ?? "—"}
              </td>
              <td className="px-2">
                <PricingBadge rule={l.pricing} />
              </td>
              <td className="tnum px-2 text-end text-[length:var(--font-ui)] font-semibold text-ink">
                {formatMoney(listingBasePrice(l), l.currency)}
              </td>
              <td className="tnum px-2 text-end text-[length:var(--font-ui-sm)] text-margin-field">
                {formatMoney(supplierPayout(l, l.listPrice), l.currency)}
              </td>
              <td>
                {contract ? (
                  <ContractStatusBadge status={contract.status} />
                ) : (
                  <span className="text-[length:var(--font-ui-sm)] text-ink-3">
                    {t("mp.suppliers.noContract")}
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
