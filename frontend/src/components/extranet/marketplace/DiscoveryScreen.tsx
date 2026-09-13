"use client";

import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import type { ListingKind } from "@/lib/marketplace";
import { useMarketplace } from "@/lib/marketplace-store";
import { ListingTable } from "./ListingTable";
import { SubscriptionWall } from "./SubscriptionWall";

/**
 * Tur ve transfer keşif ekranları simetrik (Spesifikasyon Bölüm 1.1),
 * bu yüzden tek bileşen — ikisi arasında yalnız başlık ve envanter tipi
 * değişiyor.
 */
export function DiscoveryScreen({
  kind,
  titleKey,
  leadKey,
}: {
  kind: ListingKind;
  titleKey: MessageKey;
  leadKey: MessageKey;
}) {
  const mp = useMarketplace();
  const table = <ListingTable kind={kind} />;

  return (
    <>
      <h2 className="font-dense text-base font-medium text-ink">{t(titleKey)}</h2>
      <p className="mt-1 max-w-[70ch] text-ink-2">{t(leadKey)}</p>
      <div className="mt-4">
        {mp.access.active ? table : <SubscriptionWall>{table}</SubscriptionWall>}
      </div>
    </>
  );
}
