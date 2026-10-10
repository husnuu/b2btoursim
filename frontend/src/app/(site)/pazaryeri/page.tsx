import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { marketplacePage as c } from "@/content/pages";
import { Container, Heading, buttonClass, delay } from "@/components/landing/ui/primitives";
import { GlyphExchange, GlyphHub, GlyphNetwork } from "@/components/landing/ui/Glyphs";
import { PageTransition } from "@/components/effects/PageTransition";
import { ApplyButton } from "@/components/landing/application/ApplyButton";
import { PageHero } from "@/components/landing/blocks/PageHero";
import { HScrollGallery } from "@/components/landing/blocks/HScrollGallery";
import { Journey } from "@/components/landing/blocks/Journey";
import { FinalCta } from "@/components/landing/sections/FinalCta";

export const metadata: Metadata = {
  title: "B2B Pazaryeri",
  description: c.lead,
  alternates: { canonical: "/pazaryeri" },
};

const glyphs = [GlyphNetwork, GlyphHub, GlyphExchange];

export default function MarketplacePage() {
  return (
    <PageTransition>
      <PageHero
        kicker={c.kicker}
        title={c.title}
        lead={c.lead}
        photos={[
          { src: "/images/kultur.jpg", alt: "Gün batımında Ayasofya" },
          { src: "/images/otel.jpg", alt: "Palmiyelerle çevrili otel havuzu" },
          { src: "/images/balon.jpg", alt: "Kapadokya'da sıcak hava balonları" },
        ]}
        actions={
          <>
            <ApplyButton size="lg">
              Pazaryerine Katılın <ArrowRight className="size-4" />
            </ApplyButton>
            <a href="#kategoriler" className={buttonClass("outline", "lg")}>Kategoriler</a>
          </>
        }
      />

      <div id="kategoriler">
        <HScrollGallery title="Altı kategori, tek pazaryeri." />
      </div>

      <section className="py-24 sm:py-32">
        <Container>
          <Heading>{"Pazaryerinin\nkuralları basit."}</Heading>
          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {c.principles.map((p, i) => {
              const G = glyphs[i];
              return (
                <article
                  key={p.title}
                  data-reveal
                  style={delay(i * 120)}
                  className={`group rounded-[24px] p-8 transition-transform duration-500 hover:-translate-y-2 hover:-rotate-1 ${
                    i === 1 ? "grain relative bg-pop" : i === 2 ? "bg-ink text-white" : "bg-mist"
                  }`}
                >
                  <G className="size-14" />
                  <h3 className="font-display mt-8 text-3xl">{p.title}</h3>
                  <p className="mt-3 text-[17px] leading-relaxed opacity-75">{p.body}</p>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      <Journey title={"Bir rezervasyonun\nyolculuğu."} stops={c.journey} />

      <FinalCta
        title={"Pazaryerinde\nyerinizi alın."}
        lead="Acente ya da tedarikçi olarak başvurun; hesabınız onaylandığında pazaryerine erişiminiz açılır."
      />
    </PageTransition>
  );
}
