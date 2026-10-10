import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { integrationsPage as c } from "@/content/pages";
import { integrations } from "@/content/site";
import { Container, Heading, StatusTag, buttonClass, delay } from "@/components/landing/ui/primitives";
import { SailBullet } from "@/components/landing/ui/Glyphs";
import { PageTransition } from "@/components/effects/PageTransition";
import { ApplyButton } from "@/components/landing/application/ApplyButton";
import { PageHero } from "@/components/landing/blocks/PageHero";
import { Roadmap } from "@/components/landing/blocks/Roadmap";
import { CodeTabs } from "@/components/landing/blocks/CodeTabs";
import { FinalCta } from "@/components/landing/sections/FinalCta";

export const metadata: Metadata = {
  title: "Entegrasyonlar",
  description: c.lead,
  alternates: { canonical: "/entegrasyonlar" },
};

export default function IntegrationsPage() {
  return (
    <PageTransition>
      <PageHero
        tone="ink"
        kicker={c.kicker}
        title={c.title}
        lead={c.lead}
        photos={[
          { src: "/images/feribot.jpg", alt: "Denizde ilerleyen feribot" },
          { src: "/images/transfer.jpg", alt: "Havalimanında transfer minibüsü" },
          { src: "/images/istanbul.jpg", alt: "İstanbul vapuru" },
        ]}
        actions={
          <>
            <ApplyButton variant="pop" size="lg">
              Entegrasyon ihtiyacımı ilet <ArrowRight className="size-4" />
            </ApplyButton>
            <Link href="/magaza" className={buttonClass("ghostLight", "lg")}>Örnek acente vitrini</Link>
          </>
        }
      />

      <Roadmap title={"Nerede olduğumuz,\nnereye gittiğimiz."} phases={c.roadmap} />

      <section className="bg-mist py-24 sm:py-32">
        <Container className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <Heading>{"Geliştiriciler için\nbir bakış."}</Heading>
            <p data-reveal style={delay(150)} className="mt-6 max-w-md text-lg leading-relaxed text-ink-2">
              Planladığımız API, ürün, müsaitlik ve B2B fiyat bilgisini hem JSON hem XML olarak sunmayı hedefliyor. Sağdaki
              örnek temsilidir; uç noktalar henüz yayında değil.
            </p>
            <ul data-reveal style={delay(250)} className="mt-9 flex flex-col">
              {integrations.map((it) => (
                <li key={it.title} className="flex items-center gap-3 border-b border-ink/10 py-3 text-[16px]">
                  <SailBullet className="size-4.5 shrink-0 text-ink/40" />
                  {it.title}
                  <span className="ml-auto"><StatusTag status={it.status} /></span>
                </li>
              ))}
            </ul>
          </div>
          <div data-reveal style={delay(100)}>
            <CodeTabs />
          </div>
        </Container>
      </section>

      <FinalCta
        title={"Hangi sisteme\nbağlanmak istersiniz?"}
        lead="Kullandığınız rezervasyon yazılımını veya satış kanalını başvurunuzda yazın; entegrasyon önceliklerimizi belirlerken dikkate alalım."
        actions={
          <ApplyButton variant="pop" size="lg">
            Entegrasyon ihtiyacımı ilet <ArrowRight className="size-4" />
          </ApplyButton>
        }
      />
    </PageTransition>
  );
}
