"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

const NAV: { href: string; label: MessageKey }[] = [
  { href: "/extranet/transfer/araclar", label: "transferNav.araclar" },
  { href: "/extranet/transfer/nokta", label: "transferNav.nokta" },
  { href: "/extranet/transfer/harita", label: "transferNav.harita" },
  { href: "/extranet/transfer/saatlik", label: "transferNav.saatlik" },
  { href: "/extranet/transfer/rezervasyonlar", label: "transferNav.rezervasyonlar" },
  { href: "/extranet/transfer/operasyon", label: "transferNav.operasyon" },
  { href: "/extranet/transfer/ayarlar", label: "transferNav.ayarlar" },
];

/** Transfer Modülü'nün 9 alt ekranı arasında kalıcı ikincil nav. */
export function TransferShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-[calc(100dvh-3rem)]">
      <nav
        aria-label="Transfer modülü"
        className="hidden w-56 shrink-0 overflow-y-auto border-e border-line bg-surface py-3 md:block"
      >
        <ul>
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-9 items-center border-s-2 px-3 text-[length:var(--font-ui-sm)] ${
                    active
                      ? "border-s-action bg-action-tint font-medium text-ink"
                      : "border-s-transparent text-ink-2 hover:bg-sunken hover:text-ink"
                  }`}
                >
                  {t(item.label)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
