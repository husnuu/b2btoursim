"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";

export type NavSection = { id: string; label: string };

/**
 * Detay sayfasının yapışkan bölüm çubuğu (VITRIN.md §4.5, Seyyah
 * `StickyTabs`). Başlığın hemen altına yapışır (`--header-h`), görünen
 * bölümü IntersectionObserver ile izler; aktif sekme 3 px aksan çizgisiyle
 * işaretlenir. Hash bağlantıları önizlemede de serbest: iframe içinde kalır.
 */
export function SectionNav({ sections }: { sections: NavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((x): x is HTMLElement => !!x);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  if (sections.length < 2) return null;

  return (
    <nav
      aria-label={t("b2c.detail.sections")}
      className="sticky top-[var(--header-h)] z-20 -mx-4 border-b border-line bg-paper/95 px-4 backdrop-blur lg:mx-0 lg:px-0"
    >
      <ul className="flex gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none]">
        {sections.map((s) => {
          const on = s.id === active;
          return (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                aria-current={on ? "location" : undefined}
                className={`relative block px-3 py-4 text-[15.5px] font-semibold transition-colors sm:px-4 ${on ? "text-ink" : "text-ink-3 hover:text-ink"}`}
              >
                {s.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-highlight transition-transform duration-300 sm:inset-x-4 ${on ? "scale-x-100" : "scale-x-0"}`}
                />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
