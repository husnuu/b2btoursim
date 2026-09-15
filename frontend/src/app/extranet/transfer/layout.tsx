import { TransferCatalogProvider } from "@/lib/transfer-store";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadTransferState } from "@/lib/transfers/load";
import { TransferShell } from "@/components/extranet/transfer/TransferShell";

/** Transfer modülü: katalog tablodan (RLS); sekme yalnız kaydedilmemiş düzenlemeleri tutar. */
export default async function TransferLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  const initial = current.state === "ready" ? await loadTransferState(current.user.tenantId) : null;
  return (
    <TransferCatalogProvider initial={initial}>
      <TransferShell>{children}</TransferShell>
    </TransferCatalogProvider>
  );
}
