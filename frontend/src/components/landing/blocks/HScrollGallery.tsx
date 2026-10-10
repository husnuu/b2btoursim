"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { categories } from "@/content/site";
import { SailBullet } from "@/components/landing/ui/Glyphs";

/**
 * Masaüstünde bölüm sabitlenir; dikey kaydırma kartları yatayda akıtır.
 * Mobilde ve hareket azaltma tercihinde normal yatay kaydırmalı şerit olur.
 */
export function HScrollGallery({ title }: { title: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const o = outer.current;
    const t = track.current;
    if (!o || !t) return;
    const pinned = window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    const size = () => {
      if (!pinned.matches) {
        o.style.height = "";
        t.style.transform = "";
        return;
      }
      // Kalan yatay mesafe kadar dikey kaydırma alanı aç
      o.style.height = `${t.scrollWidth - window.innerWidth + window.innerHeight}px`;
      update();
    };
    const update = () => {
      frame = 0;
      if (!pinned.matches) return;
      const r = o.getBoundingClientRect();
      const max = t.scrollWidth - window.innerWidth;
      const p = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight || 1)));
      t.style.transform = `translate3d(${-p * max}px,0,0)`;
      o.style.setProperty("--hp", p.toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    size();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", size);
    pinned.addEventListener("change", size);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", size);
      pinned.removeEventListener("change", size);
    };
  }, []);

  return (
    <section ref={outer} aria-label={title} className="relative bg-ink text-white">
      <div className="top-0 flex flex-col justify-center overflow-hidden py-20 lg:sticky lg:h-screen lg:py-0">
        <div className="mx-auto mb-10 flex w-full max-w-[1240px] items-end justify-between gap-6 px-5 sm:px-8">
          <h2 className="font-display text-[2.3rem] leading-[1.04] sm:text-5xl">{title}</h2>
          <div className="hidden h-[3px] w-48 overflow-hidden rounded bg-white/15 lg:block" aria-hidden="true">
            <span className="block h-full origin-left bg-pop" style={{ transform: "scaleX(var(--hp, 0))" }} />
          </div>
        </div>

        <div className="overflow-x-auto [scrollbar-width:none] lg:overflow-visible">
          <div ref={track} className="flex w-max snap-x snap-mandatory gap-5 px-5 will-change-transform sm:px-8 lg:snap-none lg:pl-[max(2rem,calc((100vw-1240px)/2+2rem))] lg:pr-[30vw]">
            {categories.map((c, i) => (
              <article key={c.key} id={`kategori-${c.key}`} className="group relative w-[82vw] shrink-0 snap-center overflow-hidden rounded-[24px] bg-white text-ink sm:w-[460px] lg:w-[520px]">
                <div className="relative aspect-[16/11] overflow-hidden">
                  <Image src={c.image} alt={c.alt} fill sizes="(min-width: 1024px) 520px, 82vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute top-4 left-4 rounded-full bg-pop px-3 py-1 text-sm font-bold tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="p-7">
                  <h3 className="font-display text-3xl">{c.title}</h3>
                  <p className="mt-3 leading-relaxed text-ink-2">{c.long}</p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {c.examples.map((x) => (
                      <li key={x} className="flex items-center gap-1.5 rounded-full bg-mist px-3 py-1.5 text-sm font-medium">
                        <SailBullet className="size-3.5 text-pop-deep" />
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
