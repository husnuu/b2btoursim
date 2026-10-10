"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { t } from "@/lib/i18n";

/**
 * Yatay kaydırmalı, snap'li karusel (Seyyah vitrin). Ok düğmeleri yalnız
 * kaydırılacak yer varken görünür; dar ekranda parmakla kayar. Sol/sağ
 * taşma `-mx-*` ile sayfa kenarına kadar uzanır.
 */
export function Carousel({
  children,
  label,
  itemClass = "w-[82%] sm:w-[46%] lg:w-[calc((100%-3*20px)/4)]",
}: {
  children: ReactNode[];
  label: string;
  itemClass?: string;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const step = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const arrow =
    "absolute top-[38%] z-10 hidden h-12 w-12 place-items-center rounded-full bg-surface text-ink shadow-[var(--shadow-card)] transition-all duration-300 hover:scale-110 sm:grid";

  return (
    <div className="relative" role="region" aria-roledescription="karusel" aria-label={label}>
      <ul
        ref={track}
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pt-2 pb-8 [scrollbar-width:none] sm:-mx-2 sm:px-2"
      >
        {children.map((c, i) => (
          <li key={i} className={`shrink-0 snap-start ${itemClass}`}>
            {c}
          </li>
        ))}
      </ul>
      <button
        type="button"
        aria-label={t("b2c.carousel.prev")}
        onClick={() => step(-1)}
        className={`${arrow} -left-5 ${edges.start ? "pointer-events-none opacity-0" : ""}`}
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        aria-label={t("b2c.carousel.next")}
        onClick={() => step(1)}
        className={`${arrow} -right-5 ${edges.end ? "pointer-events-none opacity-0" : ""}`}
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
