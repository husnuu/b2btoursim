"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus, Home, LayoutGrid, Plane, Sailboat, Tag, Tent, type LucideIcon } from "lucide-react";
import type { NavLink } from "./StorefrontFrame";

/**
 * Başlığın ikinci satırı (Seyyah vitrin `CategoryBar`): ikonlu modül
 * sekmeleri + ek bağlantılar. Aktif sekme renkle değil alt kenarda 3 px
 * aksan çizgisiyle işaretlenir; hover'da ikon hafifçe yükselir. Dar ekranda
 * şerit yatay kayar. Önizlemede bağlantılar etkisiz.
 */
const ICONS: [RegExp, LucideIcon][] = [
  [/^\/magaza\/?$/, LayoutGrid],
  [/tur-arama/, Tent],
  [/tekne/, Sailboat],
  [/transfer/, Bus],
  [/villa/, Home],
  [/vize/, Plane],
];

function iconFor(href: string): LucideIcon {
  return ICONS.find(([re]) => re.test(href))?.[1] ?? Tag;
}

export function NavTabs({ links, inverse, preview }: { links: NavLink[]; inverse: boolean; preview: boolean }) {
  const pathname = usePathname();
  const base = inverse ? "text-ink-inverse-2 hover:text-ink-inverse" : "text-ink-2 hover:text-ink";
  const activeInk = inverse ? "text-ink-inverse" : "text-ink";

  return (
    <nav aria-label="Bölümler" className="flex min-w-0 items-stretch gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none]">
      {links.map((l) => {
        const external = l.href.startsWith("http");
        const isHome = l.href === "/magaza";
        const active = !external && !preview && (isHome ? pathname === l.href : pathname === l.href || pathname.startsWith(`${l.href}/`));
        const Icon = iconFor(l.href);
        const cls = `group relative flex shrink-0 items-center gap-2 px-3 py-3 text-[14.5px] font-semibold transition-colors ${active ? activeInk : base}`;
        const inner = (
          <>
            <Icon className="size-[18px] transition-transform duration-300 group-hover:-translate-y-0.5" />
            {l.label}
            <span
              aria-hidden="true"
              className={`absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-highlight transition-transform duration-300 ${
                active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              }`}
            />
          </>
        );
        if (preview) {
          return (
            <span key={l.href + l.label} className={cls} aria-disabled="true">
              {inner}
            </span>
          );
        }
        if (external) {
          return (
            <a key={l.href + l.label} href={l.href} rel="noreferrer" target="_blank" className={cls}>
              {inner}
            </a>
          );
        }
        return (
          <Link key={l.href + l.label} href={l.href} aria-current={active ? "page" : undefined} className={cls}>
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
