import { AppShell } from "@/components/extranet/AppShell";
import { SetupNotice } from "@/components/auth/SetupNotice";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireClaims } from "@/lib/auth/session";
import { TourCatalogProvider } from "@/lib/tour-store";
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
  const tours = await listTenantTours(current.user.tenantId);

  return (
    <TourCatalogProvider initialTours={tours}>
      <AppShell user={current.user}>{children}</AppShell>
    </TourCatalogProvider>
  );
}
