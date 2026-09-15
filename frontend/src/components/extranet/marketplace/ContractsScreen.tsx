"use client";

import { useState } from "react";
import { formatShortDate, t } from "@/lib/i18n";
import type { Contract, ContractStatus } from "@/lib/marketplace";
import {
  canTransitionContract,
  contractNeedsConfirmation,
} from "@/lib/marketplace-status";
import { useMarketplace } from "@/lib/marketplace-store";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { PricingBadge } from "./PricingBadge";
import { Button } from "@/components/primitives/Button";
import { ConfirmDialog } from "@/components/primitives/ConfirmDialog";
import { EmptyState } from "@/components/primitives/States";
import { useToast } from "@/components/primitives/Toast";

/**
 * Kontratlar — Spesifikasyon Bölüm 5.1 (gözlemlenmemiş, önerilen alanlar).
 *
 * İki yön ayrı listelenir: bize gelen talepler (biz tedarikçiyiz) ve
 * gönderdiğimiz talepler (biz satıcıyız). Aynı acente iki rolde de olabildiği
 * için (Bölüm 0, çift rol modeli) tek listede karıştırmak kafa karıştırırdı.
 *
 * Hangi eylemin görüneceğine durum makinesi karar verir; buton listesi elle
 * yazılmaz — `BookingDetail` ile aynı ilke.
 */
export function ContractsScreen() {
  const mp = useMarketplace();
  const { notify } = useToast();
  const [pending, setPending] = useState<{
    contract: Contract;
    to: ContractStatus;
  } | null>(null);

  const incoming = mp.contracts.filter((c) => c.supplierAgencyId === mp.agencyId);
  const outgoing = mp.contracts.filter((c) => c.sellerAgencyId === mp.agencyId);

  const apply = (contract: Contract, to: ContractStatus) => {
    mp.setContractStatus(contract.id, to);
    const other = mp.peerById(
      contract.supplierAgencyId === mp.agencyId
        ? contract.sellerAgencyId
        : contract.supplierAgencyId,
    );
    if (to === "onaylandi") {
      notify(t("mp.contracts.approved", { agency: other?.name ?? "" }));
    }
  };

  const request = (contract: Contract, to: ContractStatus) => {
    if (contractNeedsConfirmation(to)) setPending({ contract, to });
    else apply(contract, to);
  };

  const dialogAgency = pending
    ? (mp.peerById(
        pending.contract.supplierAgencyId === mp.agencyId
          ? pending.contract.sellerAgencyId
          : pending.contract.supplierAgencyId,
      )?.name ?? "")
    : "";

  return (
    <>
      <h2 className="font-dense text-base font-medium text-ink">
        {t("mp.contracts.title")}
      </h2>
      <p className="mt-1 max-w-[74ch] text-ink-2">{t("mp.contracts.lead")}</p>

      <Section
        title={t("mp.contracts.incoming")}
        contracts={incoming}
        weAreSupplier
        onAction={request}
        scopeCount={(c) =>
          mp.contractListings.filter((cl) => cl.contractId === c.id).length
        }
      />
      <Section
        title={t("mp.contracts.outgoing")}
        contracts={outgoing}
        weAreSupplier={false}
        onAction={request}
        scopeCount={(c) =>
          mp.contractListings.filter((cl) => cl.contractId === c.id).length
        }
      />

      <ConfirmDialog
        open={pending !== null}
        title={t(
          pending?.to === "onaylandi"
            ? "mp.contracts.confirmApproveTitle"
            : "mp.contracts.confirmTerminateTitle",
        )}
        body={t(
          pending?.to === "onaylandi"
            ? "mp.contracts.confirmApproveBody"
            : "mp.contracts.confirmTerminateBody",
          { agency: dialogAgency },
        )}
        confirmLabel={t(
          pending?.to === "onaylandi"
            ? "mp.contracts.approve"
            : pending?.to === "reddedildi"
              ? "mp.contracts.reject"
              : "mp.contracts.terminate",
        )}
        tone={pending?.to === "onaylandi" ? "primary" : "danger"}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) apply(pending.contract, pending.to);
          setPending(null);
        }}
      />
    </>
  );
}

function Section({
  title,
  contracts,
  weAreSupplier,
  onAction,
  scopeCount,
}: {
  title: string;
  contracts: Contract[];
  weAreSupplier: boolean;
  onAction: (c: Contract, to: ContractStatus) => void;
  scopeCount: (c: Contract) => number;
}) {
  const mp = useMarketplace();
  return (
    <section className="mt-8">
      <h3 className="mb-2 font-dense text-[length:calc(var(--font-ui)*1.05)] font-medium text-ink">
        {title}
      </h3>

      {contracts.length === 0 ? (
        <EmptyState title={t("mp.contracts.empty")} body={t("mp.contracts.emptyBody")} />
      ) : (
        <table className="w-full border-collapse font-dense">
          <thead>
            <tr className="border-b border-line-strong text-[length:var(--font-ui-xs)] text-ink-3">
              <th scope="col" className="py-1.5 text-start font-normal">
                {t("mp.contracts.col.party")}
              </th>
              <th scope="col" className="w-32 px-2 py-1.5 text-start font-normal">
                {t("mp.col.status")}
              </th>
              <th scope="col" className="w-32 px-2 py-1.5 text-end font-normal">
                {t("mp.contracts.col.scope")}
              </th>
              <th scope="col" className="w-40 px-2 py-1.5 text-start font-normal">
                {t("mp.pricing.model")}
              </th>
              <th scope="col" className="w-24 px-2 py-1.5 text-end font-normal">
                {t("mp.contracts.col.requested")}
              </th>
              <th scope="col" className="w-56 py-1.5 text-end font-normal">
                <span className="sr-only">{t("booking.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => {
              const other = mp.peerById(
                weAreSupplier ? c.sellerAgencyId : c.supplierAgencyId,
              );
              return (
                <tr key={c.id} className="border-b border-line align-top hover:bg-action-tint">
                  <td className="py-2.5 pe-3">
                    <p className="text-[length:var(--font-ui)] text-ink">
                      {other?.name ?? "—"}
                    </p>
                    {c.message && (
                      <p className="mt-0.5 max-w-[54ch] text-[length:var(--font-ui-sm)] text-ink-2">
                        {c.message}
                      </p>
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    <ContractStatusBadge status={c.status} />
                  </td>
                  <td className="tnum px-2 py-2.5 text-end text-[length:var(--font-ui-sm)] text-ink-2">
                    {t("mp.contracts.scopeCount", { count: scopeCount(c) })}
                  </td>
                  <td className="px-2 py-2.5">
                    {c.agreedPricing ? (
                      <PricingBadge rule={c.agreedPricing} />
                    ) : (
                      <span className="text-[length:var(--font-ui-sm)] text-ink-3">—</span>
                    )}
                  </td>
                  <td className="tnum px-2 py-2.5 text-end text-[length:var(--font-ui-sm)] text-ink-2">
                    {formatShortDate(c.requestedAt)}
                  </td>
                  <td className="py-2.5 text-end">
                    <span className="flex justify-end gap-2">
                      {weAreSupplier && canTransitionContract(c.status, "onaylandi") && (
                        <Button size="sm" variant="primary" onClick={() => onAction(c, "onaylandi")}>
                          {t("mp.contracts.approve")}
                        </Button>
                      )}
                      {weAreSupplier && canTransitionContract(c.status, "reddedildi") && (
                        <Button size="sm" variant="danger" onClick={() => onAction(c, "reddedildi")}>
                          {t("mp.contracts.reject")}
                        </Button>
                      )}
                      {!weAreSupplier && c.status === "beklemede" && (
                        <Button size="sm" onClick={() => onAction(c, "reddedildi")}>
                          {t("mp.contracts.withdraw")}
                        </Button>
                      )}
                      {canTransitionContract(c.status, "sonlandirildi") && (
                        <Button size="sm" variant="danger" onClick={() => onAction(c, "sonlandirildi")}>
                          {t("mp.contracts.terminate")}
                        </Button>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
