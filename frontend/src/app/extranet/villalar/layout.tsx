import { VillaCatalogProvider } from "@/lib/villa-store";
import { VillaShell } from "@/components/extranet/villas/VillaShell";

export default function VillalarLayout({ children }: { children: React.ReactNode }) {
  return (
    <VillaCatalogProvider>
      <VillaShell>{children}</VillaShell>
    </VillaCatalogProvider>
  );
}
