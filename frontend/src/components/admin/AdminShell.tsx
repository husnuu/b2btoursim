"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

/**
 * Süper Admin kabuğu — Bağlam dokümanı Bölüm 5.
 *
 * İç araç: tasarım eforu minimum, işlevsellik maksimum. Extranet ile aynı
 * token ve yoğunluk ölçeği kullanılıyor, ayrı bir görsel dil kurulmuyor.
 * Ayırt edici tek şey koyu üst çubuk — operatör hangi panelde olduğunu
 * sekme değiştirdiğinde bir bakışta anlasın diye.
 */
const NAV: { href: string; label: MessageKey; exact?: boolean }[] = [
  { href: "/admin", label: "admin.nav.dashboard", exact: true },
  { href: "/admin/kiracilar", label: "admin.nav.tenants" },
  { href: "/admin/planlar", label: "admin.nav.plans" },
  { href: "/admin/tedarikciler", label: "admin.nav.suppliers" },
  { href: "/admin/api-anahtarlari", label: "admin.nav.apiKeys" },
  { href: "/admin/para-birimleri", label: "admin.nav.currencies" },
  { href: "/admin/roller", label: "admin.nav.roles" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div data-density="compact" className="flex min-h-dvh flex-col bg-paper">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2
                   focus:rounded-[var(--radius)] focus:bg-action focus:px-3 focus:py-2 focus:text-on-action"
      >
        {t("nav.skipToContent")}
      </a>

      <header className="sticky top-0 z-30 bg-inverse">
        <div className="mx-auto flex h-12 w-full max-w-[96rem] items-center gap-6 px-[var(--pad-x)]">
          <Link
            href="/admin"
            className="font-dense text-[length:calc(var(--font-ui)*1.15)] font-semibold text-ink-inverse"
          >
            {t("admin.title")}
          </Link>
          <span className="text-[length:var(--font-ui-sm)] text-ink-inverse-2">
            {t("app.name")}
          </span>
          <Link
            href="/extranet"
            className="ms-auto text-[length:var(--font-ui-sm)] text-ink-inverse-2 hover:text-ink-inverse"
          >
            {t("nav.storefront")}
          </Link>
        </div>
      </header>

      <nav
        aria-label={t("admin.title")}
        className="sticky top-12 z-20 border-b border-line bg-surface"
      >
        <ul className="mx-auto flex w-full max-w-[96rem] flex-wrap gap-1 px-[var(--pad-x)]">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-9 items-center border-b-2 px-3 text-[length:var(--font-ui)] transition-colors ${
                    active
                      ? "border-b-ink font-medium text-ink"
                      : "border-b-transparent text-ink-2 hover:text-ink"
                  }`}
                >
                  {t(item.label)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <main id="admin-main" className="mx-auto w-full max-w-[96rem] flex-1 px-[var(--pad-x)] py-6">
        {children}
      </main>
    </div>
  );
}
