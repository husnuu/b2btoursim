import { AppShell } from "@/components/extranet/AppShell";
import { SetupNotice } from "@/components/auth/SetupNotice";
import { getWorkingAgency } from "@/lib/auth/agency";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireClaims } from "@/lib/auth/session";
import { getAgencyFinance } from "@/lib/finance/load";
import { TourCatalogProvider } from "@/lib/tour-store";
import { platformFontPreload } from "@/lib/platform-fonts";
import { listTenantTours } from "@/lib/tours/load";

/**
 * Extranet ve Admin SPA olarak çalışır, SEO gerekmez (Bölüm 8).
 * Oturum kapısı: proxy iyimser yönlendirir, layout JWT'yi doğrular.
 */
export default async function ExtranetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireClaims("/extranet");
  const current = await getCurrentUser();
  if (current.state !== "ready") return <SetupNotice />;

  // Tur kataloğu tablodan; sekme yalnız kaydedilmemiş düzenlemeleri tutar.
  const agency = await getWorkingAgency();
  const [tours, finance] = await Promise.all([
    listTenantTours(current.user.tenantId),
    agency ? getAgencyFinance(agency.tenantId, agency.agencyId) : Promise.resolve(null),
  ]);

  return (
    // Barlow burada ön yüklenir (kökte değil): vitrin bu dosyaları indirmez.
    <div className={`${platformFontPreload} contents`}>
    <TourCatalogProvider initialTours={tours}>
      <AppShell
        user={current.user}
        balance={finance ? { available: finance.available, creditLimit: finance.creditLimit, currency: finance.currency, agencyName: finance.name } : null}
      >
        {children}
      </AppShell>
    </TourCatalogProvider>
    </div>
  );
}
