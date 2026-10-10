import type { ReactNode } from "react";
import type { Step } from "@/content/pages";
import { Container, Heading, StatusTag } from "@/components/landing/ui/primitives";

const tones = ["bg-pop text-ink", "bg-ink text-white", "bg-mist text-ink", "bg-white text-ink border-2 border-ink"];

/**
 * Kaydırdıkça üst üste binen adım kartları. Her kart sticky; bir sonraki gelince
 * öncekisi hafifçe küçülür (CSS scroll-driven, destek yoksa statik).
 */
export function StackSteps({ id, title, steps, visuals = [] }: { id?: string; title: string; steps: Step[]; visuals?: ReactNode[] }) {
  return (
    <section id={id} className="py-24 sm:py-32">
      <Container>
        <Heading>{title}</Heading>
        <ol className="mt-16 flex flex-col gap-6">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="sticky"
              style={{ top: `calc(110px + ${i * 22}px)` }}
            >
              <article className={`stack-card grid min-h-[340px] origin-top gap-8 rounded-[28px] p-8 shadow-[var(--shadow-card)] sm:p-12 lg:grid-cols-[auto_1fr_1fr] lg:items-center lg:gap-14 ${tones[i % tones.length]}`}>
                <span className="font-display text-7xl leading-none tabular-nums sm:text-9xl">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-display flex flex-wrap items-center gap-3 text-[2rem] leading-tight sm:text-[2.6rem]">
                    {s.title}
                    {s.status && <StatusTag status={s.status} tone={i % 4 === 1 ? "dark" : "light"} />}
                  </h3>
                  <p className="mt-4 max-w-md text-lg leading-relaxed opacity-80">{s.body}</p>
                </div>
                {visuals[i] && <div className="hidden lg:block">{visuals[i]}</div>}
              </article>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
