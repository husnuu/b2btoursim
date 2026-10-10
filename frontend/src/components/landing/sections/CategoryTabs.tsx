"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { categories } from "@/content/site";
import { SailBullet } from "@/components/landing/ui/Glyphs";

const DURATION = 6500;

export function CategoryTabs() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);

  const autoplay = inView && !paused;

  useEffect(() => {
    if (!autoplay || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setActive((a) => (a + 1) % categories.length), DURATION);
    return () => window.clearTimeout(t);
  }, [active, autoplay]);

  // Aktif sekmeyi mobilde sekme çubuğu içinde ortala (sayfayı dikeyde kaydırmadan)
  useEffect(() => {
    const tab = tabs.current[active];
    const list = tab?.parentElement;
    if (!tab || !list || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  const onKey = (e: KeyboardEvent) => {
    const n = categories.length;
    const next = e.key === "ArrowRight" ? (active + 1) % n : e.key === "ArrowLeft" ? (active - 1 + n) % n : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  const c = categories[active];

  return (
    <div
      ref={root}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="overflow-hidden rounded-[22px] border-2 border-ink bg-white"
    >
      <div role="tablist" aria-label="Ürün kategorileri" onKeyDown={onKey} className="flex overflow-x-auto bg-ink [scrollbar-width:none]">
        {categories.map((cat, i) => (
          <button
            key={cat.key}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            role="tab"
            id={`tab-${cat.key}`}
            aria-selected={i === active}
            aria-controls="kategori-panel"
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={`relative shrink-0 px-6 py-6 text-[15.5px] whitespace-nowrap transition-colors sm:flex-1 sm:px-4 ${
              i === active ? "font-bold text-pop" : "text-white/80 hover:text-white"
            }`}
          >
            {cat.tab}
            {i === active && (
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15">
                <span
                  key={`${active}-${autoplay}`}
                  className="block h-full origin-left bg-pop"
                  style={{
                    animation: autoplay ? `tab-progress ${DURATION}ms linear both` : undefined,
                    transform: autoplay ? undefined : "scaleX(1)",
                  }}
                />
              </span>
            )}
          </button>
        ))}
      </div>

      <div
        id="kategori-panel"
        role="tabpanel"
        aria-labelledby={`tab-${c.key}`}
        className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-14 lg:p-12"
      >
        <div key={`t-${c.key}`} className="tab-in order-2 lg:order-1">
          <p className="font-display text-6xl text-pop-deep/25 tabular-nums">{String(active + 1).padStart(2, "0")}</p>
          <h3 className="font-display mt-2 text-[2.1rem] leading-[1.08] sm:text-5xl">{c.title}</h3>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink-2">{c.long}</p>
          <ul className="mt-7 flex flex-wrap gap-2">
            {c.examples.map((x) => (
              <li key={x} className="flex items-center gap-2 rounded-full border-[1.5px] border-ink/15 px-3.5 py-1.5 text-sm font-medium">
                <SailBullet className="size-3.5 text-pop-deep" />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div key={`i-${c.key}`} className="tab-in reveal-img relative order-1 aspect-[16/11] overflow-hidden rounded-2xl lg:order-2">
          <Image src={c.image} alt={c.alt} fill sizes="(min-width: 1024px) 600px, 100vw" className="scale-105 object-cover transition-transform duration-[6s] ease-out hover:scale-100" />
        </div>
      </div>
    </div>
  );
}
