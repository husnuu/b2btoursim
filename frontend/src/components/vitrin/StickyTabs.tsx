"use client";

import { useEffect, useState } from "react";

/** Bölümler arasında gezinen yapışkan sekmeler; kaydırdıkça aktif sekme değişir. */
export function StickyTabs({ tabs, topClass = "top-[120px] lg:top-16" }: { tabs: { id: string; label: string }[]; topClass?: string }) {
  const [active, setActive] = useState(tabs[0].id);

  useEffect(() => {
    const els = tabs.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [tabs]);

  return (
    <nav aria-label="Ürün bölümleri" className={`sticky ${topClass} z-20 -mx-5 border-b border-line bg-white/95 px-5 backdrop-blur lg:mx-0 lg:px-0`}>
      <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
        {tabs.map((t) => (
          <li key={t.id}>
            <a
              href={`#${t.id}`}
              aria-current={active === t.id ? "true" : undefined}
              className={`relative block px-3 py-4 text-[15.5px] font-semibold whitespace-nowrap transition-colors sm:px-4 ${active === t.id ? "text-ink" : "text-ink-3 hover:text-ink"}`}
            >
              {t.label}
              <span className={`absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-pop transition-transform duration-300 sm:inset-x-4 ${active === t.id ? "scale-x-100" : "scale-x-0"}`} />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
