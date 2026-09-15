import { VisaCatalogProvider } from "@/lib/visa-store";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listTenantApplications, listTenantForms } from "@/lib/visas/forms-load";
import { listTenantVisas } from "@/lib/visas/load";
import { VisaShell } from "@/components/extranet/visa/VisaShell";

/** Vize modülü: ürünler, başvuru formları ve başvurular tablodan (RLS); tarayıcı yalnız kaydedilmemiş düzenlemeleri tutar. */
export default async function VizeLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  const [visas, forms, applications] = current.state === "ready"
    ? await Promise.all([listTenantVisas(current.user.tenantId), listTenantForms(current.user.tenantId), listTenantApplications(current.user.tenantId)])
    : [[], [], []];
  return (
    <VisaCatalogProvider initialVisas={visas} initialForms={forms} initialApplications={applications}>
      <VisaShell>{children}</VisaShell>
    </VisaCatalogProvider>
  );
}
