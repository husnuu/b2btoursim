import type { CSSProperties } from "react";
import type { FeatureStatus } from "@/content/site";
import { Container, Heading, StatusTag, delay } from "@/components/landing/ui/primitives";
import { SailBullet } from "@/components/landing/ui/Glyphs";

type Phase = { phase: string; status: FeatureStatus; title: string; items: string[] };

/** Kaydırdıkça dolan dikey çizgi; her aşama kendi durum etiketiyle. Tarih vermiyoruz. */
export function Roadmap({ title, phases }: { title: string; phases: Phase[] }) {
  return (
    <section className="py-24 sm:py-32">
      <Container className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Heading>{title}</Heading>
          <p data-reveal style={delay(150)} className="mt-6 max-w-sm text-lg leading-relaxed text-ink-2">
            Tarih vermiyoruz; hazır olanı hazır, planlananı planlanan olarak paylaşıyoruz.
          </p>
        </div>
        <ol data-progress className="relative flex flex-col gap-10 pl-12" style={{ "--progress": 0 } as CSSProperties}>
          <span aria-hidden="true" className="absolute top-3 bottom-3 left-[11px] w-[3px] rounded bg-ink/10" />
          <span aria-hidden="true" className="absolute top-3 bottom-3 left-[11px] w-[3px] origin-top scale-y-[var(--progress)] rounded bg-ink" />
          {phases.map((p, i) => (
            <li key={p.phase} data-reveal style={delay(i * 120)} className="relative">
              <span
                aria-hidden="true"
                className={`absolute top-2 -left-12 size-[25px] rounded-full border-[3px] border-ink ${p.status === "live" ? "bg-pop" : p.status === "soon" ? "bg-amber-soft" : "bg-white"}`}
              />
              <div className={`rounded-[24px] p-7 sm:p-9 ${p.status === "live" ? "grain relative bg-pop" : p.status === "soon" ? "bg-mist" : "border-2 border-dashed border-ink/20"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-bold tracking-wide uppercase">{p.phase}</span>
                  <StatusTag status={p.status} />
                </div>
                <h3 className="font-display mt-3 text-3xl sm:text-4xl">{p.title}</h3>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {p.items.map((it) => (
                    <li key={it} className="flex items-center gap-3 font-medium">
                      <SailBullet className={`size-4.5 shrink-0 ${p.status === "planned" ? "text-ink/35" : "text-ink"}`} />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
