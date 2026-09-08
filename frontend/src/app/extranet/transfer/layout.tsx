import { TransferCatalogProvider } from "@/lib/transfer-store";
import { TransferShell } from "@/components/extranet/transfer/TransferShell";

export default function TransferLayout({ children }: { children: React.ReactNode }) {
  return (
    <TransferCatalogProvider>
      <TransferShell>{children}</TransferShell>
    </TransferCatalogProvider>
  );
}
