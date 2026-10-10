import { t } from "@/lib/i18n";
import { getStorefrontHost, getStorefrontTenant } from "@/lib/storefront/tenant";
import { getVitrinData } from "@/lib/storefront/vitrin-data";
import { VitrinShell } from "@/components/vitrin/VitrinShell";

/**
 * B2C mağaza kabuğu — Seyyah vitrini. Kiracı ADRESTEN gelir; içerik
 * acentenin yayınladığı ilanlardan (`getVitrinData`). Kiracısız adreste
 * (localhost) Seyyah'ın örnek vitrini (Mavi Rota) gösterilir ve demo şeridi
 * bunu söyler.
 */
export default async function MagazaLayout({ children }: { children: React.ReactNode }) {
  const host = await getStorefrontHost();
  const tenant = await getStorefrontTenant();

  // Vitrin adresi ama kiracı yok: örnek vitrine DÜŞMEZ — yanlış acente
  // izlenimi verir. Ne olduğunu söyleyen düz bir sayfa.
  if (host.kind !== "none" && !tenant) {
    return (
      <main className="grid min-h-dvh place-items-center bg-paper px-4">
        <div className="max-w-md text-center">
          <h1 className="font-dense text-2xl font-semibold text-ink">{t("b2c.notFoundTitle")}</h1>
          <p className="mt-2 text-ink-2">{t("b2c.notFoundLead")}</p>
        </div>
      </main>
    );
  }

  const data = await getVitrinData(tenant ? { id: tenant.id, name: tenant.name } : null);
  return <VitrinShell data={data}>{children}</VitrinShell>;
}
