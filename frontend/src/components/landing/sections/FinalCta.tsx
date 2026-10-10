import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Container, Heading, delay } from "@/components/landing/ui/primitives";
import { WaveMark } from "@/components/landing/ui/Glyphs";
import { ApplyButton } from "@/components/landing/application/ApplyButton";

/** Dönen yuvarlak rozet: metin bir çember üzerinde akar. */
function Badge() {
  const text = "İLK İŞ ORTAKLARINDAN OLUN • SEYYAH • İLK İŞ ORTAKLARINDAN OLUN • SEYYAH • ";
  return (
    <div className="relative size-36 sm:size-44" aria-hidden="true">
      <svg viewBox="0 0 200 200" className="spin-mid absolute inset-0 text-pop">
        <defs>
          <path id="rozet-cember" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <text fill="currentColor" fontSize="13.2" fontWeight="700" letterSpacing="2.4">
          <textPath href="#rozet-cember">{text}</textPath>
        </text>
      </svg>
      <div className="absolute inset-[30%] grid place-items-center rounded-full bg-pop text-ink">
        <ArrowRight className="size-7 -rotate-45" strokeWidth={2.5} />
      </div>
    </div>
  );
}

export function FinalCta({
  title = "Turizmin Yeni Nesil\nSatış Ağına Katılın.",
  lead = "İster yeni turizm ürünlerine ulaşmak, ister kendi ürünlerinizi daha fazla acenteye sunmak isteyin. Seyyah ile yeni iş fırsatlarını keşfedin.",
  actions,
}: {
  title?: string;
  lead?: string;
  actions?: ReactNode;
} = {}) {
  return (
    <section aria-labelledby="cta-baslik" className="py-6 sm:py-10">
      <Container>
        <div className="relative overflow-hidden rounded-[28px] bg-ink px-6 py-20 text-white sm:px-14 sm:py-28">
          <WaveMark className="pointer-events-none absolute -right-20 -bottom-24 w-[520px] text-white/[0.06]" />
          <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_auto]">
            <div>
              <Heading id="cta-baslik" size="xl" className="max-w-3xl text-white">
                {title}
              </Heading>
              <p data-reveal style={delay(150)} className="mt-7 max-w-xl text-lg leading-relaxed text-white/70">
                {lead}
              </p>
              <div data-reveal style={delay(250)} className="mt-10 flex flex-col gap-3 sm:flex-row">
                {actions ?? (
                  <>
                    <ApplyButton type="acente" variant="pop" size="lg">
                      Acente Olarak Başvur <ArrowRight className="size-4" />
                    </ApplyButton>
                    <ApplyButton type="tedarikci" variant="ghostLight" size="lg">
                      Tedarikçi Olarak Başvur
                    </ApplyButton>
                  </>
                )}
              </div>
            </div>
            <div data-reveal style={delay(300)} className="hidden justify-self-center lg:block">
              <Badge />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
