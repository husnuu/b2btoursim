"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useVitrin } from "./VitrinProvider";

/** Hero arka planı: yavaş yakınlaşan, birbirine geçen fotoğraflar. */
export function HeroSlides() {
  const { hero: slides } = useVitrin();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % slides.length), 7000);
    return () => window.clearInterval(t);
  }, [slides.length]);
  return (
    <>
      {slides.map((s, k) => (
        <div
          key={s.src}
          aria-hidden={k !== i}
          className={`absolute inset-0 transition-opacity duration-[1.4s] ${k === i ? "opacity-100" : "opacity-0"}`}
        >
          <Image src={s.src} alt={s.alt} fill priority={k === 0} sizes="(min-width: 1320px) 1320px, 100vw" className={`object-cover ${k === i ? "kenburns" : ""}`} />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/45 via-ink/10 to-transparent" />
      <div className="absolute right-5 bottom-5 flex items-center gap-3 sm:right-8 sm:bottom-7">
        <span key={i} className="tab-in rounded-full bg-white/90 px-3 py-1 text-[13px] font-semibold">
          {slides[i].caption}
        </span>
        <div className="flex gap-1.5">
          {slides.map((s, k) => (
            <button
              key={s.src}
              type="button"
              aria-label={`${s.caption} fotoğrafını göster`}
              aria-current={k === i}
              onClick={() => setI(k)}
              className={`h-2 rounded-full transition-all duration-500 ${k === i ? "w-7 bg-pop" : "w-2 bg-white/70 hover:bg-white"}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
