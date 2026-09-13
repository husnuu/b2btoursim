"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

/**
 * Pazaryeri alt gezinmesi.
 *
 * Spesifikasyon Bölüm 9 sol menüde 4 grup + 8 öğe öneriyor. Extranet rayı
 * zaten 12 satır; oraya 8 öğe daha eklemek rayı okunmaz yapardı. Ray'da
 * tek satır ("Pazaryeri"), alt gruplar burada yatay sekme — Süper Admin'de
 * kullanılan desenin aynısı.
 */
const TABS: { href: string; label: MessageKey; exact?: boolean }[] = [
  { href: "/extranet/pazaryeri", label: "mp.tab.overview", exact: true },
  { href: "/extranet/pazaryeri/tedarikciler", label: "mp.tab.suppliers" },
  { href: "/extranet/pazaryeri/turlar", label: "mp.tab.tours" },
  { href: "/extranet/pazaryeri/transferler", label: "mp.tab.transfers" },
  { href: "/extranet/pazaryeri/paylastiklarim", label: "mp.tab.shared" },
  { href: "/extranet/pazaryeri/aldiklarim", label: "mp.tab.acquired" },
  { href: "/extranet/pazaryeri/kontratlar", label: "mp.tab.contracts" },
  { href: "/extranet/pazaryeri/kurulum", label: "mp.tab.setup" },
];

export function MarketplaceTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label={t("mp.title")} className="border-b border-line">
      <ul className="flex flex-wrap gap-1">
        {TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-9 items-center border-b-2 px-3 text-[length:var(--font-ui)] transition-colors ${
                  active
                    ? "border-b-ink font-medium text-ink"
                    : "border-b-transparent text-ink-2 hover:text-ink"
                }`}
              >
                {t(tab.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
