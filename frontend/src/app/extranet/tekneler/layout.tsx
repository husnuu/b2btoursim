import { BoatCatalogProvider } from "@/lib/boat-store";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listTenantBoats } from "@/lib/boats/load";
import { BoatShell } from "@/components/extranet/boats/BoatShell";

/** Tekne modülü: katalog tablodan (RLS), sekme yalnız kaydedilmemiş düzenlemeleri tutar. */
export default async function TeknelerLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  const boats = current.state === "ready" ? await listTenantBoats(current.user.tenantId) : [];
  return (
    <BoatCatalogProvider initialBoats={boats}>
      <BoatShell>{children}</BoatShell>
    </BoatCatalogProvider>
  );
}
