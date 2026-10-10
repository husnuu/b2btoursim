"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BedDouble, Bus, Landmark, LayoutGrid, Plane, Sailboat, Ship, Tent, Tag } from "lucide-react";
import { useVitrin } from "./VitrinProvider";

const icons = { tur: Tent, tekne: Sailboat, kultur: Landmark, transfer: Bus, feribot: Ship, konaklama: BedDouble, vize: Plane } as const;

/** Header altındaki ikonlu kategori şeridi; aktif kategori alt çizgiyle işaretlenir. */
export function CategoryBar() {
  const { categories: vCategories } = useVitrin();
  const pathname = usePathname();
  const sp = useSearchParams();
  const onSearch = pathname === "/magaza/ara";
  const current = onSearch ? sp.get("kategori") ?? (sp.get("firsat") ? "firsat" : sp.size ? null : "hepsi") : null;

  const item = (key: string, href: string, label: string, Icon: typeof Tent) => {
    const on = current === key;
    return (
      <li key={key}>
        <Link
          href={href}
          aria-current={on ? "page" : undefined}
          className={`group relative flex items-center gap-2 px-3 py-3 text-[14.5px] font-semibold whitespace-nowrap transition-colors ${on ? "text-ink" : "text-ink-2 hover:text-ink"}`}
        >
          <Icon className="size-[18px] transition-transform duration-300 group-hover:-translate-y-0.5" />
          {label}
          <span className={`absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-pop transition-transform duration-300 ${on ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Kategoriler" className="border-t border-line">
      <ul className="mx-auto flex max-w-[1320px] gap-1 overflow-x-auto px-2 [scrollbar-width:none]">
        {item("hepsi", "/magaza/ara", "Tümü", LayoutGrid)}
        {vCategories.map((c) => item(c.key, `/magaza/ara?kategori=${c.key}`, c.label, icons[c.key]))}
        {item("firsat", "/magaza/ara?firsat=1", "Fırsatlar", Tag)}
      </ul>
    </nav>
  );
}
