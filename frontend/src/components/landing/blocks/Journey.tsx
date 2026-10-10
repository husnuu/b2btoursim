import type { CSSProperties } from "react";
import { Container, Heading, delay } from "@/components/landing/ui/primitives";

type Stop = { who: string; text: string };

/**
 * Bir rezervasyonun yolculuğu: nokta çizgi boyunca ilerler, ulaştığı durak
 * aynı anda vurgulanır. Tüm zamanlama tek bir 8 sn'lik döngüye bağlı.
 */
export function Journey({ title, stops }: { title: string; stops: Stop[] }) {
  const n = stops.length;
  return (
    <section className="bg-mist py-24 sm:py-32">
      <Container>
        <Heading>{title}</Heading>
        <div data-reveal style={delay(100)} className="relative mt-16">
          {/* Çizgi + ilerleyen nokta (masaüstü) */}
          <div aria-hidden="true" className="absolute top-[22px] right-[12.5%] left-[12.5%] hidden h-[3px] rounded bg-ink/15 lg:block">
            <span className="journey-dot absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-[6px] ring-pop/60" />
          </div>
          <ol className="grid gap-5 lg:grid-cols-4">
            {stops.map((s, i) => (
              <li key={i} className="relative flex gap-5 lg:flex-col lg:items-center lg:text-center" style={{ "--k": i, "--n": n } as CSSProperties}>
                <span className="journey-node relative z-10 grid size-12 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-mist font-bold tabular-nums">
                  {i + 1}
                </span>
                <div className="journey-card flex-1 rounded-2xl bg-white p-6 lg:mt-6 lg:w-full">
                  <p className={`inline-block rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${s.who === "Seyyah" ? "bg-ink text-pop" : "bg-pop text-ink"}`}>{s.who}</p>
                  <p className="mt-3 text-[16.5px] leading-relaxed text-ink-2">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
