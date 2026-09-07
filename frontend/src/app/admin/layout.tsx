import { AdminShell } from "@/components/admin/AdminShell";

/** Süper Admin SPA olarak çalışır, SEO gerekmez. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
