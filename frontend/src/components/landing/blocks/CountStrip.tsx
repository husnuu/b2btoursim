"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/landing/ui/primitives";

/** Ürünün kendisine dair gerçek sayılar — müşteri sayısı ya da hacim iddiası değil. */
const facts = [
  { n: 6, label: "ürün kategorisi", note: "turdan feribota" },
  { n: 2, label: "taraflı pazaryeri", note: "alıcı ve satıcı aynı yerde" },
  { n: 1, label: "panel", note: "ürün, fiyat, rezervasyon" },
];

function Count({ to, run }: { to: number; run: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setV(to));
      return () => cancelAnimationFrame(id);
    }
    const start = performance.now();
    let id = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1200);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [run, to]);
  return <>{v}</>;
}

export function CountStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setRun(true), { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <section aria-label="Seyyah bir bakışta" className="pb-10">
      <Container>
        <div ref={ref} className="grid divide-y-2 divide-ink/10 border-y-2 border-ink sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0">
          {facts.map((f) => (
            <div key={f.label} className="flex items-end gap-5 px-2 py-8 sm:px-8">
              <span className="font-display text-[5.5rem] leading-[0.8] tabular-nums sm:text-[7rem]">
                <Count to={f.n} run={run} />
              </span>
              <span className="pb-1">
                <span className="block text-xl font-extrabold tracking-tight">{f.label}</span>
                <span className="block text-ink-3">{f.note}</span>
              </span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
