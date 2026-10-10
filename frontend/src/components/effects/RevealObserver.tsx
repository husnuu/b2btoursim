"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Sayfa geneli efektler:
 * - `data-reveal` öğelerini görünür alana girince bir kez gösterir.
 * - `data-parallax="<hız>"` öğelerine kaydırmaya bağlı --py değeri yazar.
 * - `data-progress` öğelerine bölüm içi kaydırma ilerlemesini (0–1) --progress olarak yazar.
 */
export function RevealObserver() {
  // Rota değişince yeni sayfanın öğeleri yeniden taranır
  const pathname = usePathname();
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reveal
    const reveal = document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-visible])");
    let io: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.setAttribute("data-visible", "");
              io!.unobserve(e.target);
            }
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
      );
      reveal.forEach((n) => io!.observe(n));
    } else {
      reveal.forEach((n) => n.setAttribute("data-visible", ""));
    }

    if (reduce) {
      document.querySelectorAll<HTMLElement>("[data-progress]").forEach((el) => el.style.setProperty("--progress", "1"));
      return () => io?.disconnect();
    }

    // Parallax + ilerleme
    const parallax = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    const progress = Array.from(document.querySelectorAll<HTMLElement>("[data-progress]"));
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const el of parallax) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const speed = Number(el.dataset.parallax) || 0.1;
        const center = r.top + r.height / 2 - vh / 2;
        el.style.setProperty("--py", `${(-center * speed).toFixed(1)}px`);
      }
      for (const el of progress) {
        const r = el.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / (r.height || 1)));
        el.style.setProperty("--progress", p.toFixed(3));
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);
  return null;
}
