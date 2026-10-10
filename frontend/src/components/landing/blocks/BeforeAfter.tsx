import { Check, X } from "lucide-react";
import { Container, Heading, delay } from "@/components/landing/ui/primitives";

/** "Bugün" maddeleri görünür olunca tek tek üstü çizilir; karşısında Seyyah'taki karşılığı. */
export function BeforeAfter({ title, before, after }: { title: string; before: string[]; after: string[] }) {
  return (
    <section className="bg-mist py-24 sm:py-32">
      <Container>
        <Heading>{title}</Heading>
        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          <div data-reveal className="rounded-[28px] border-2 border-ink/10 bg-white p-8 sm:p-10">
            <p className="text-sm font-bold tracking-wide text-ink-3 uppercase">Bugün</p>
            <ul className="mt-6 flex flex-col gap-5">
              {before.map((b, i) => (
                <li key={b} className="flex items-center gap-4 text-lg text-ink-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mist">
                    <X className="size-4" />
                  </span>
                  <span className="strike" style={delay(200 + i * 160)}>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div data-reveal style={delay(150)} className="grain relative rounded-[28px] bg-pop p-8 sm:p-10">
            <p className="text-sm font-bold tracking-wide uppercase">Seyyah ile</p>
            <ul className="mt-6 flex flex-col gap-5">
              {after.map((a, i) => (
                <li key={a} data-reveal style={delay(250 + i * 140)} className="flex items-center gap-4 text-lg font-semibold">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-pop">
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
