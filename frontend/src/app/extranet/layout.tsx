import { AppShell } from "@/components/extranet/AppShell";

/**
 * Extranet ve Admin SPA olarak çalışır, SEO gerekmez (Bölüm 8).
 * B2C tarafı ayrı ağaçta SSR ile üretilir.
 */
export default function ExtranetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
