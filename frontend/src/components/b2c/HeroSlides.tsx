"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";

export type HeroSlide = { url: string; alt: string };

/**
 * Kahraman arka planı (Seyyah vitrin): yavaş yakınlaşan, birbirine geçen
 * fotoğraflar; sağ altta künye ve noktalar. Fotoğraf yoksa kiracıya özgü
 * ton + aynı karartma — tipografi iki durumda da aynı yerde durur.
 *
 * Görseller acentenin yayınladığı ilanların kapaklarından gelir
 * (`media_asset`); örnek vitrin yerel fotoğraf kullanır.
 */
export function HeroSlides({ slides, tone }: { slides: HeroSlide[]; tone: string }) {
  const [i, setI] = useState(0);
  const n = slides.length;

  useEffect(() => {
    if (n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setI((x) => (x + 1) % n), 7000);
    return () => window.clearInterval(timer);
  }, [n]);

  if (n === 0) {
    return (
      <>
        <div className="absolute inset-0" style={{ background: tone }} />
        <span aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: "var(--image-hero-scrim)" }} />
      </>
    );
  }

  return (
    <>
      {slides.map((s, k) => (
        <div key={s.url} aria-hidden={k !== i} className={`absolute inset-0 transition-opacity duration-[1.4s] ${k === i ? "opacity-100" : "opacity-0"}`}>
          <Image
            src={s.url}
            alt={s.alt}
            fill
            priority={k === 0}
            sizes="(min-width: 1320px) 1320px, 100vw"
            className={`object-cover ${k === i ? "kenburns" : ""}`}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-inverse/50 via-inverse/15 to-transparent" />
      {n > 1 && (
        <div className="absolute right-5 bottom-5 flex items-center gap-3 sm:right-8 sm:bottom-7">
          {slides[i].alt && (
            <span key={i} className="tab-in max-w-[14rem] truncate rounded-full bg-surface/90 px-3 py-1 text-[13px] font-semibold text-ink">
              {slides[i].alt}
            </span>
          )}
          <div className="flex gap-1.5">
            {slides.map((s, k) => (
              <button
                key={s.url}
                type="button"
                aria-label={t("b2c.hero.slide", { caption: s.alt || String(k + 1) })}
                aria-current={k === i}
                onClick={() => setI(k)}
                className={`h-2 rounded-full transition-all duration-500 ${k === i ? "w-7 bg-highlight" : "w-2 bg-surface/70 hover:bg-surface"}`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
