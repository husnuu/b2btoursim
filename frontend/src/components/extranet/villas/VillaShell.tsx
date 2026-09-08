"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

const NAV: { href: string; label: MessageKey }[] = [
  { href: "/extranet/villalar", label: "villaNav.villalar" },
  { href: "/extranet/villalar/rezervasyonlar", label: "villaNav.rezervasyonlar" },
  { href: "/extranet/villalar/operasyon", label: "villaNav.operasyon" },
];

/** Villa Kiralama Modülü — 3 hedefli hafif üst sekme çubuğu (bkz. BoatShell.tsx). */
export function VillaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col">
      <nav aria-label="Villa kiralama modülü" className="flex gap-1.5 border-b border-line px-[var(--pad-x)] py-2">
        {NAV.map((item) => {
          const active = item.href === "/extranet/villalar" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-3 py-1 text-[length:var(--font-ui-sm)] ${active ? "border-action bg-action text-on-action" : "border-line-strong text-ink-2 hover:border-ink-3"}`}
            >
              {t(item.label)}
            </Link>
          );
        })}
      </nav>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
