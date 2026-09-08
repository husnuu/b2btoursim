import { BoatCatalogProvider } from "@/lib/boat-store";
import { BoatShell } from "@/components/extranet/boats/BoatShell";

export default function TeknelerLayout({ children }: { children: React.ReactNode }) {
  return (
    <BoatCatalogProvider>
      <BoatShell>{children}</BoatShell>
    </BoatCatalogProvider>
  );
}
