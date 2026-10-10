import { faq } from "@/content/site";
import { Container, Heading } from "@/components/landing/ui/primitives";

/** `only` verilirse yalnızca o sıradaki sorular gösterilir. */
export function Faq({ only, title = "Merak\nedilenler." }: { only?: number[]; title?: string } = {}) {
  const items = only ? only.map((i) => faq[i]) : faq;
  return (
    <section id="sss" aria-labelledby="sss-baslik" className="py-24 sm:py-32">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Heading id="sss-baslik">{title}</Heading>
        </div>
        <div className="border-t-2 border-ink">
          {items.map((item, i) => (
            <details key={item.q} name="sss" className="group border-b-2 border-ink/10 open:border-ink">
              <summary className="flex cursor-pointer list-none items-center gap-5 py-6 text-left text-lg font-bold sm:text-xl [&::-webkit-details-marker]:hidden">
                <span className="font-display w-8 shrink-0 text-base text-ink/30 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1">{item.q}</span>
                <span className="relative grid size-10 shrink-0 place-items-center rounded-full border-2 border-ink transition-colors duration-300 group-open:bg-pop">
                  <span className="absolute h-[2.5px] w-3.5 rounded bg-ink" />
                  <span className="absolute h-3.5 w-[2.5px] rounded bg-ink transition-transform duration-300 group-open:scale-y-0" />
                </span>
              </summary>
              <p className="max-w-2xl pb-7 pl-13 text-[17px] leading-relaxed text-ink-2">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
