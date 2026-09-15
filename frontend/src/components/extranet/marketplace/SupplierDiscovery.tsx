"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { useMarketplace } from "@/lib/marketplace-store";
import { Button } from "@/components/primitives/Button";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { SubscriptionWall } from "./SubscriptionWall";
import { useToast } from "@/components/primitives/Toast";

/**
 * Tedarikçi keşfi — Spesifikasyon Bölüm 3.1.
 *
 * Abonelik yoksa duvar çıkar ama liste tamamen gizlenmez: acente adı, şehri
 * ve envanter sayısı görünür kalır, fiyat ve kontrat kurma kilitlenir.
 * Referans üründe duvarın arkası tamamen boştu (Bölüm 3.1–3.3); değeri
 * göstermeden abonelik satmak zor.
 */
export function SupplierDiscovery() {
  const mp = useMarketplace();
  const { notify } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const contractFor = (agencyId: string) =>
    mp.contracts.find(
      (c) => c.supplierAgencyId === agencyId && c.sellerAgencyId === mp.agencyId,
    );

  const table = (
    <table className="w-full border-collapse font-dense">
      <thead>
        <tr className="border-b border-line-strong text-[length:var(--font-ui-xs)] text-ink-3">
          <th scope="col" className="py-1.5 text-start font-normal">
            {t("mp.suppliers.col.agency")}
          </th>
          <th scope="col" className="w-36 px-2 py-1.5 text-start font-normal">
            {t("mp.suppliers.col.location")}
          </th>
          <th scope="col" className="w-32 px-2 py-1.5 text-end font-normal">
            {t("mp.suppliers.col.listings")}
          </th>
          <th scope="col" className="w-40 px-2 py-1.5 text-start font-normal">
            {t("mp.suppliers.col.contract")}
          </th>
          <th scope="col" className="w-36 py-1.5 text-end font-normal">
            <span className="sr-only">{t("mp.suppliers.request")}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {mp.peers.map((a) => {
          const contract = contractFor(a.id);
          return (
            <tr key={a.id} className="border-b border-line align-top hover:bg-action-tint">
              <td className="py-2.5 pe-3">
                <div className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 rounded-[2px]"
                    style={{ background: a.imageTone }}
                  />
                  <div className="min-w-0">
                    <p className="text-[length:var(--font-ui)] text-ink">{a.name}</p>
                    <p className="mt-0.5 max-w-[60ch] text-[length:var(--font-ui-sm)] text-ink-2">
                      {a.description}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-2 py-2.5 text-[length:var(--font-ui-sm)] text-ink-2">
                {a.city}
              </td>
              <td className="tnum px-2 py-2.5 text-end text-[length:var(--font-ui)] text-ink">
                {a.listingCount}
              </td>
              <td className="px-2 py-2.5">
                {contract ? (
                  <ContractStatusBadge status={contract.status} />
                ) : (
                  <span className="text-[length:var(--font-ui-sm)] text-ink-3">
                    {t("mp.suppliers.noContract")}
                  </span>
                )}
              </td>
              <td className="py-2.5 text-end">
                {!contract && mp.access.active && (
                  <Button
                    size="sm"
                    disabled={pendingId === a.id}
                    onClick={() => {
                      setPendingId(a.id);
                      mp.requestContract(a.id, "");
                      notify(t("mp.contracts.requested", { agency: a.name }));
                    }}
                  >
                    {t("mp.suppliers.request")}
                  </Button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <>
      <h2 className="font-dense text-base font-medium text-ink">
        {t("mp.suppliers.title")}
      </h2>
      <p className="mt-1 max-w-[70ch] text-ink-2">{t("mp.suppliers.lead")}</p>

      <div className="mt-4">
        {mp.access.active ? table : <SubscriptionWall>{table}</SubscriptionWall>}
      </div>
    </>
  );
}
