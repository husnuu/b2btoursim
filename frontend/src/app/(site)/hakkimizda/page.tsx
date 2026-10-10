import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { aboutPage as c } from "@/content/pages";
import { Container, Heading, delay } from "@/components/landing/ui/primitives";
import { GlyphExchange, GlyphHub, GlyphNetwork, WaveMark } from "@/components/landing/ui/Glyphs";
import { PageTransition } from "@/components/effects/PageTransition";
import { ApplyButton } from "@/components/landing/application/ApplyButton";
import { PageHero } from "@/components/landing/blocks/PageHero";
import { ScrollWords } from "@/components/landing/blocks/ScrollWords";
import { FinalCta } from "@/components/landing/sections/FinalCta";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: c.lead,
  alternates: { canonical: "/hakkimizda" },
};

const glyphs = [GlyphExchange, GlyphHub, GlyphNetwork, GlyphExchange];

export default function AboutPage() {
  return (
    <PageTransition>
      <PageHero
        kicker={c.kicker}
        title={c.title}
        lead={c.lead}
        photos={[
          { src: "/images/kultur.jpg", alt: "Gün batımında Ayasofya" },
          { src: "/images/tekne.jpg", alt: "Koyda demirli gulet" },
          { src: "/images/balon.jpg", alt: "Kapadokya'da sıcak hava balonları" },
        ]}
        actions={
          <ApplyButton size="lg">
            Bize Katılın <ArrowRight className="size-4" />
          </ApplyButton>
        }
      />

      <ScrollWords text={c.manifesto} label="Neden varız?" />

      {/* Tam genişlik fotoğraf: kaydırdıkça perde açılır */}
      <section aria-hidden="true" className="px-3 sm:px-5">
        <div className="reveal-img relative mx-auto aspect-[16/10] max-w-[1360px] overflow-hidden rounded-[20px] sm:aspect-[21/9]">
          <Image src="/images/istanbul.jpg" alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent" />
          <p className="font-display absolute bottom-6 left-6 max-w-xl text-3xl text-white sm:bottom-10 sm:left-10 sm:text-5xl">
            Turizm bir bağlantılar işidir.
          </p>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <Container>
          <Heading>{"Nasıl\nçalışıyoruz."}</Heading>
          <div className="mt-16 grid gap-5 sm:grid-cols-2">
            {c.values.map((v, i) => {
              const G = glyphs[i];
              return (
                <article
                  key={v.title}
                  data-reveal
                  style={delay((i % 2) * 120)}
                  className={`relative overflow-hidden rounded-[24px] p-8 sm:p-10 ${i === 0 || i === 3 ? "grain bg-pop" : "bg-mist"}`}
                >
                  <WaveMark className="pointer-events-none absolute -right-10 -bottom-10 w-48 text-white/40" />
                  <G className="relative size-12" />
                  <h3 className="font-display relative mt-8 text-3xl">{v.title}</h3>
                  <p className="relative mt-3 max-w-md text-[17px] leading-relaxed text-ink-2">{v.body}</p>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      <FinalCta title={"Yolculuğa\nbirlikte çıkalım."} />
    </PageTransition>
  );
}
