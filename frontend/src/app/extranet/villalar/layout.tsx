import { VillaCatalogProvider } from "@/lib/villa-store";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listTenantVillas, loadVillaLibraries } from "@/lib/villas/load";
import { VillaShell } from "@/components/extranet/villas/VillaShell";

/** Villa modülü: katalog ve kütüphaneler tablodan (RLS); sekme yalnız kaydedilmemiş düzenlemeleri tutar. */
export default async function VillalarLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  const [villas, libs] = current.state === "ready"
    ? await Promise.all([listTenantVillas(current.user.tenantId), loadVillaLibraries(current.user.tenantId)])
    : [[], { categories: [], regions: [], features: [] }];
  return (
    <VillaCatalogProvider initialVillas={villas} initialCategories={libs.categories} initialRegions={libs.regions} initialFeatures={libs.features}>
      <VillaShell>{children}</VillaShell>
    </VillaCatalogProvider>
  );
}
