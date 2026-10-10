import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { SetupNotice } from "@/components/auth/SetupNotice";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireClaims } from "@/lib/auth/session";
import { platformFontPreload } from "@/lib/platform-fonts";

/** Süper Admin SPA olarak çalışır, SEO gerekmez. Yalnız platform_admin. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireClaims("/admin");
  const current = await getCurrentUser();
  if (current.state !== "ready") return <SetupNotice />;
  if (current.user.role !== "platform_admin") redirect("/extranet");

  // Barlow burada ön yüklenir (kökte değil): vitrin bu dosyaları indirmez.
  return (
    <div className={`${platformFontPreload} contents`}>
      <AdminShell user={current.user}>{children}</AdminShell>
    </div>
  );
}
