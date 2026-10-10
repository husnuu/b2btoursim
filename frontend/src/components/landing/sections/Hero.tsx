import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { heroChecks } from "@/content/site";
import { Container, SplitText, buttonClass } from "@/components/landing/ui/primitives";
import { MouseStage } from "@/components/effects/MouseStage";
import { ApplyButton } from "@/components/landing/application/ApplyButton";
import { DashboardMockup } from "./DashboardMockup";
import type { CSSProperties } from "react";

const layer = (depth: number, extra: CSSProperties = {}) => ({ "--depth": `${depth}px`, ...extra }) as CSSProperties;

export function Hero() {
  return (
    <section aria-labelledby="hero-baslik" className="grain relative overflow-hidden bg-pop">
      <Container className="relative grid items-center gap-14 pt-10 pb-28 sm:pt-16 sm:pb-24 lg:grid-cols-[1fr_1.05fr] lg:gap-8 lg:pt-14 lg:pb-32">
        <div className="relative z-10 flex flex-col items-start">
          <p className="tab-in flex items-center gap-3 text-sm font-semibold text-ink" style={{ animationDelay: "60ms" }}>
            <span className="h-[2px] w-8 bg-ink" aria-hidden="true" />
            Yeni Nesil B2B Turizm Platformu
          </p>
          <h1
            id="hero-baslik"
            className="split-load font-display mt-6 text-[2.85rem] leading-[1.02] text-ink sm:text-[4rem] lg:text-[4.3rem]"
          >
            <SplitText text="Turizmde Satışın ve İş Birliğinin Yeni Merkezi." />
          </h1>
          <p className="tab-in mt-7 max-w-[34rem] text-lg leading-relaxed text-ink-2 sm:text-[1.3rem]" style={{ animationDelay: "500ms" }}>
            Seyyah ile turizm ürünlerini keşfedin, kendi ürünlerinizi acentelerin satışına açın ve rezervasyon
            süreçlerinizi tek platformdan yönetin.
          </p>
          <div className="tab-in mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row" style={{ animationDelay: "650ms" }}>
            <ApplyButton size="lg" className="sm:min-w-64">
              Ücretsiz Başvur <ArrowRight className="size-4" />
            </ApplyButton>
            <a href="#platform" className={buttonClass("outline", "lg")}>
              Platformu Keşfet
            </a>
          </div>
          <p className="tab-in mt-5 text-[15px] text-ink-2 italic" style={{ animationDelay: "750ms" }}>
            Seyahat acenteleri ve turizm profesyonelleri için.
          </p>
        </div>

        {/* Kolaj: fotoğraflar + panel. İmleçle farklı derinliklerde kayar. */}
        <MouseStage className="relative mx-auto w-full max-w-[620px] lg:max-w-none">
          <div className="relative aspect-[2/3] sm:aspect-[6/5]">
            <div
              className="mouse-layer absolute top-[2%] right-[2%] w-[46%] tab-in"
              style={layer(-18, { animationDelay: "300ms" })}
            >
              <div className="polaroid float rotate-[7deg]">
                <div className="relative aspect-[4/5]">
                  <Image src="/images/balon.jpg" alt="Kapadokya'da gün doğumunda uçan sıcak hava balonları" fill preload sizes="(min-width: 1024px) 300px, 45vw" className="object-cover object-[30%_85%]" />
                </div>
              </div>
            </div>

            <div
              className="mouse-layer absolute top-[14%] left-[8%] w-[86%] tab-in"
              style={layer(14, { animationDelay: "200ms" })}
            >
              <div className="-rotate-[2.5deg]">
                <DashboardMockup />
              </div>
            </div>
            <div
              className="mouse-layer absolute -bottom-[4%] -left-[3%] z-10 w-[34%] tab-in"
              style={layer(26, { animationDelay: "450ms" })}
            >
              <div className="polaroid float-late -rotate-[8deg]">
                <div className="relative aspect-square">
                  <Image src="/images/tekne.jpg" alt="Koyda demirli ahşap gulet" fill sizes="(min-width: 1024px) 260px, 40vw" className="object-cover" />
                </div>
              </div>
            </div>
          </div>
        </MouseStage>
      </Container>

      {/* Bókun tarzı onay satırı */}
      <div className="relative border-t border-ink/10">
        <Container className="grid gap-4 py-7 sm:grid-cols-3 sm:gap-8">
          {heroChecks.map((c, i) => (
            <p key={c.strong} className="tab-in flex items-start gap-3 text-[15.5px] text-ink" style={{ animationDelay: `${850 + i * 90}ms` }}>
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] border-ink">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              <span>
                <b className="font-bold">{c.strong}</b> {c.text}
              </span>
            </p>
          ))}
        </Container>
      </div>
    </section>
  );
}
