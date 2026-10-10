import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { steps } from "@/content/site";
import { Container, Heading } from "@/components/landing/ui/primitives";
import { ApplyButton } from "@/components/landing/application/ApplyButton";

/**
 * Bölüm kaydırıldıkça --progress (0–1) artar: çizgi dolar ve sırası gelen
 * adımın numarası koyulaşır. Tamamı CSS; RevealObserver değeri yazar.
 */
export function HowItWorks() {
  return (
    <section id="nasil-calisir" aria-labelledby="nasil-baslik" className="bg-mist py-24 sm:py-32">
      <Container>
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <Heading id="nasil-baslik">{"Seyyah ile Başlamak\nÇok Kolay."}</Heading>
          <ApplyButton size="lg" className="shrink-0">
            Hemen Başvurun <ArrowRight className="size-4" />
          </ApplyButton>
        </div>

        <ol data-progress className="relative mt-20 grid gap-12 pl-10 lg:grid-cols-4 lg:gap-10 lg:pt-14 lg:pl-0" style={{ "--progress": 0 } as CSSProperties}>
          {/* İz ve dolan çizgi */}
          <span aria-hidden="true" className="absolute top-2 bottom-2 left-[7px] w-[3px] bg-ink/10 lg:top-[7px] lg:right-0 lg:bottom-auto lg:left-0 lg:h-[3px] lg:w-auto" />
          <span
            aria-hidden="true"
            className="absolute top-2 bottom-2 left-[7px] w-[3px] origin-top scale-y-[var(--progress)] bg-ink lg:top-[7px] lg:right-0 lg:bottom-auto lg:left-0 lg:h-[3px] lg:w-auto lg:origin-left lg:scale-x-[var(--progress)] lg:scale-y-100"
          />

          {steps.map((s, i) => (
            <li key={s.title} className="relative" style={{ "--i": i } as CSSProperties}>
              <span
                aria-hidden="true"
                className="absolute top-1 -left-10 size-[17px] rounded-full border-[3px] border-ink bg-mist lg:-top-14 lg:left-0"
                style={{ backgroundColor: `color-mix(in srgb, var(--color-pop) calc(clamp(0, (var(--progress) * 4.2 - var(--i)) * 300, 100) * 1%), var(--color-mist))` }}
              />
              <span
                className="font-display block text-7xl leading-none text-ink tabular-nums sm:text-8xl"
                style={{ opacity: "clamp(0.15, calc((var(--progress) * 4.2 - var(--i)) * 1.5), 1)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-xl font-extrabold tracking-tight">{s.title}</h3>
              <p className="mt-2 max-w-xs text-[16.5px] leading-relaxed text-ink-2">{s.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
