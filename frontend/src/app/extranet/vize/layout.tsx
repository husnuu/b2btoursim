import { VisaCatalogProvider } from "@/lib/visa-store";
import { VisaShell } from "@/components/extranet/visa/VisaShell";

export default function VizeLayout({ children }: { children: React.ReactNode }) {
  return (
    <VisaCatalogProvider>
      <VisaShell>{children}</VisaShell>
    </VisaCatalogProvider>
  );
}
