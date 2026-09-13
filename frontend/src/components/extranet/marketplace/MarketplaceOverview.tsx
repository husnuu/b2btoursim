"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";
import { AGENCY } from "@/data/mock";
import { useMarketplace, peerById } from "@/lib/marketplace-store";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { PricingBadge } from "./PricingBadge";
import { ButtonLink } from "@/components/primitives/Button";
import { EmptyState } from "@/components/primitives/States";

/** Pazaryeri özeti — Spesifikasyon Bölüm 1.1 "Genel Bakış" grubu. */
export function MarketplaceOverview() {
  const mp = useMarketplace();

  if (!mp.profile?.setupCompletedAt) {
    return (
      <EmptyState
        title={t("mp.overview.notSetup")}
        body={t("mp.overview.notSetupBody")}
        action={
          <ButtonLink href="/extranet/pazaryeri/kurulum" variant="primary">
            {t("mp.overview.setupCta")}
          </ButtonLink>
        }
      />
    );
  }

  const active = mp.contracts.filter((c) => c.status === "onaylandi").length;
  const pending = mp.contracts.filter((c) => c.status === "beklemede").length;
  const recent = [...mp.contracts]
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
    .slice(0, 5);

  return (
    <>
      {!mp.profile.isVisible && (
        <div className="mb-6 rounded-[var(--radius-lg)] border border-warning/30 bg-warning-tint p-4">
          <p className="font-medium text-warning">{t("mp.overview.hidden")}</p>
          <p className="mt-1 max-w-[70ch] text-ink-2">
            {t("mp.overview.hiddenBody")}
          </p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-line-strong bg-line md:grid-cols-4">
        <Metric label={t("mp.overview.sharedCount")} value={mp.myListings.length} />
        <Metric label={t("mp.overview.acquiredCount")} value={mp.acquiredListings.length} />
        <Metric label={t("mp.overview.activeContracts")} value={active} />
        <Metric
          label={t("mp.overview.pendingContracts")}
          value={pending}
          tone={pending > 0 ? "warning" : undefined}
        />
      </dl>

      <section className="mt-8">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-dense text-base font-medium text-ink">
            {t("mp.contracts.title")}
          </h2>
          <Link
            href="/extranet/pazaryeri/kontratlar"
            className="text-[length:var(--font-ui-sm)] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
          >
            {t("home.seeAll")}
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState title={t("mp.contracts.empty")} body={t("mp.contracts.emptyBody")} />
        ) : (
          <ul className="border-t border-line font-dense">
            {recent.map((c) => {
              const weAreSupplier = c.supplierAgencyId === AGENCY.id;
              const other = weAreSupplier
                ? peerById(c.sellerAgencyId)
                : peerById(c.supplierAgencyId);
              return (
                <li
                  key={c.id}
                  className="flex h-[var(--row-h)] items-center gap-4 border-b border-line"
                >
                  <span className="w-56 truncate text-[length:var(--font-ui)] text-ink">
                    {other?.name ?? "—"}
                  </span>
                  <span className="w-32 text-[length:var(--font-ui-sm)] text-ink-2">
                    {t(weAreSupplier ? "mp.contracts.incoming" : "mp.contracts.outgoing")}
                  </span>
                  <span className="w-32">
                    <ContractStatusBadge status={c.status} />
                  </span>
                  <span className="ms-auto">
                    {c.agreedPricing && <PricingBadge rule={c.agreedPricing} />}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warning";
}) {
  return (
    <div className="bg-surface p-3">
      <dt className="text-[length:var(--font-ui-sm)] text-ink-2">{label}</dt>
      <dd
        className={`tnum mt-1 text-[length:calc(var(--font-ui)*1.75)] font-semibold leading-none ${
          tone === "warning" ? "text-warning" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
