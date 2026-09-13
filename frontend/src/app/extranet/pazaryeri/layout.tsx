import { MarketplaceProvider } from "@/lib/marketplace-store";
import { MarketplaceTabs } from "@/components/extranet/marketplace/MarketplaceTabs";
import { t } from "@/lib/i18n";

/**
 * B2B Pazaryeri kabuğu — Spesifikasyon Bölüm 1.
 *
 * Pazaryeri bir ürün tipi değil, mevcut Tur ve Transfer envanterinin üzerine
 * binen yatay dağıtım katmanı. Bu yüzden ray'da ürün modüllerinin arasında
 * değil, onlardan sonra tek satır olarak duruyor.
 */
export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketplaceProvider>
      <div className="mx-auto w-full max-w-[86rem] px-[var(--pad-x)] py-6">
        <header>
          <h1 className="text-xl font-medium text-ink">{t("mp.title")}</h1>
          <p className="mt-1 max-w-[76ch] text-ink-2">{t("mp.lead")}</p>
        </header>
        <div className="mt-4">
          <MarketplaceTabs />
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </MarketplaceProvider>
  );
}
