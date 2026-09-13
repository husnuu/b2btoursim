"use client";

import { useState } from "react";
import { formatMoney, t } from "@/lib/i18n";
import type { ListingKind, PricingModel } from "@/lib/marketplace";
import { supplierPayout } from "@/lib/marketplace";
import { useMarketplace } from "@/lib/marketplace-store";
import { SubscriptionWall } from "./SubscriptionWall";
import { EmptyState } from "@/components/primitives/States";
import { ButtonLink } from "@/components/primitives/Button";

/**
 * Paylaştıklarım — Spesifikasyon Bölüm 4.1 ve 4.2 birleştirildi.
 *
 * Referans üründe "Paylaştığım Turlar" ve "Paylaştığım Araçlar" iki ayrı
 * menü öğesi; ikisi de aynı üç kolonu yönetiyor (aktif/pasif, model, oran).
 * Tek ekran + tip sekmesi hem rayı hem de öğrenme maliyetini düşürüyor.
 *
 * Aktif/pasif ve fiyat modeli **satır üzerinde** değişir, modal açmaz —
 * Extranet'in her yerindeki marj alanıyla aynı davranış.
 */
export function SharedInventory() {
  const mp = useMarketplace();
  const [kind, setKind] = useState<ListingKind>("tur");

  const rows = mp.myListings.filter((l) => l.kind === kind);

  const body =
    mp.myListings.length === 0 ? (
      <EmptyState
        title={t("mp.shared.empty")}
        body={t("mp.shared.emptyBody")}
        action={
          <ButtonLink href="/extranet/turlar" variant="primary">
            {t("nav.tours")}
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
            <th scope="col" className="w-24 px-2 py-1.5 text-start font-normal">
              {t("mp.col.status")}
            </th>
            <th scope="col" className="w-56 px-2 py-1.5 text-start font-normal">
              {t("mp.pricing.model")}
            </th>
            <th scope="col" className="w-32 px-2 py-1.5 text-end font-normal">
              {t("mp.col.base")}
            </th>
            <th scope="col" className="w-32 py-1.5 text-end font-normal">
              {t("mp.pricing.payout")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id} className="h-[var(--row-h)] border-b border-line hover:bg-action-tint">
              <td className="max-w-0 truncate pe-3 text-[length:var(--font-ui)] text-ink">
                {l.title}
              </td>
              <td className="px-2">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={l.isActive}
                    onChange={() => mp.toggleListing(l.id)}
                    className="h-4 w-4 accent-[var(--action-primary)]"
                  />
                  <span
                    className={`text-[length:var(--font-ui-sm)] ${
                      l.isActive ? "text-success" : "text-ink-3"
                    }`}
                  >
                    {t(l.isActive ? "mp.listing.active" : "mp.listing.passive")}
                  </span>
                </label>
              </td>
              <td className="px-2">
                <div className="flex items-center gap-2">
                  <select
                    value={l.pricing.model}
                    aria-label={`${l.title} ${t("mp.pricing.model")}`}
                    onChange={(e) =>
                      mp.setListingPricing(l.id, {
                        ...l.pricing,
                        model: e.target.value as PricingModel,
                      })
                    }
                    className="h-7 rounded-[var(--radius)] border border-line-strong bg-surface px-1.5
                               text-[length:var(--font-ui-sm)] text-ink outline-none focus:border-action"
                  >
                    <option value="komisyon">{t("mp.pricing.komisyon")}</option>
                    <option value="netFiyat">{t("mp.pricing.netFiyat")}</option>
                  </select>

                  {l.pricing.model === "komisyon" ? (
                    <span className="flex items-baseline">
                      <input
                        inputMode="numeric"
                        value={l.pricing.commissionPct ?? 0}
                        aria-label={`${l.title} ${t("mp.pricing.commissionPct")}`}
                        onChange={(e) =>
                          mp.setListingPricing(l.id, {
                            ...l.pricing,
                            commissionPct: Math.min(
                              90,
                              Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0),
                            ),
                          })
                        }
                        className="tnum w-9 border-0 border-b border-margin-rule bg-transparent px-0.5
                                   text-end text-[length:var(--font-ui)] font-medium text-margin-field
                                   outline-none focus:border-b-2 focus:border-b-action focus:bg-action-tint"
                      />
                      <span aria-hidden="true" className="text-[length:var(--font-ui-sm)] text-margin-field">
                        %
                      </span>
                    </span>
                  ) : (
                    <input
                      inputMode="numeric"
                      value={Math.round((l.pricing.netAmount ?? 0) / 100)}
                      aria-label={`${l.title} ${t("mp.pricing.netAmount")}`}
                      onChange={(e) =>
                        mp.setListingPricing(l.id, {
                          ...l.pricing,
                          netAmount:
                            (Number(e.target.value.replace(/\D/g, "")) || 0) * 100,
                        })
                      }
                      className="tnum w-20 border-0 border-b border-margin-rule bg-transparent px-0.5
                                 text-end text-[length:var(--font-ui)] font-medium text-margin-field
                                 outline-none focus:border-b-2 focus:border-b-action focus:bg-action-tint"
                    />
                  )}
                </div>
              </td>
              <td className="tnum px-2 text-end text-[length:var(--font-ui)] text-ink-2">
                {formatMoney(l.listPrice, l.currency)}
              </td>
              <td className="tnum text-end text-[length:calc(var(--font-ui)*1.1)] font-semibold text-margin-field">
                {formatMoney(supplierPayout(l, l.listPrice), l.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );

  return (
    <>
      <h2 className="font-dense text-base font-medium text-ink">{t("mp.shared.title")}</h2>
      <p className="mt-1 max-w-[70ch] text-ink-2">{t("mp.shared.lead")}</p>

      <div className="mt-4 flex gap-1 border-b border-line">
        {(["tur", "arac"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className={`h-8 border-b-2 px-3 text-[length:var(--font-ui)] transition-colors ${
              kind === k
                ? "border-b-ink font-medium text-ink"
                : "border-b-transparent text-ink-2 hover:text-ink"
            }`}
          >
            {t(k === "tur" ? "mp.shared.tours" : "mp.shared.vehicles")}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {mp.access.active ? body : <SubscriptionWall />}
      </div>
    </>
  );
}
