import { Hero } from "@/components/landing/sections/Hero";
import { Marquee } from "@/components/landing/sections/Marquee";
import { ValueProps } from "@/components/landing/sections/ValueProps";
import { Marketplace } from "@/components/landing/sections/Marketplace";
import { Categories } from "@/components/landing/sections/Categories";
import { Distribution } from "@/components/landing/sections/Distribution";
import { Features } from "@/components/landing/sections/Features";
import { HowItWorks } from "@/components/landing/sections/HowItWorks";
import { Integrations } from "@/components/landing/sections/Integrations";
import { FinalCta } from "@/components/landing/sections/FinalCta";
import { Faq } from "@/components/landing/sections/Faq";
import { faq } from "@/content/site";
import { PageTransition } from "@/components/effects/PageTransition";
import { ScrollWords } from "@/components/landing/blocks/ScrollWords";
import { CountStrip } from "@/components/landing/blocks/CountStrip";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function Home() {
  return (
    <PageTransition>
      <Hero />
      <Marquee />
      <ScrollWords
        label="Seyyah nedir?"
        text="Bir acente yeni ürün arıyor. Bir tedarikçi yeni acente arıyor. Seyyah ikisini aynı panelde buluşturur; ürünü, fiyatı ve rezervasyonu tek yerde toplar."
      />
      <ValueProps />
      <CountStrip />
      <Marketplace />
      <Categories />
      <Distribution />
      <Features />
      <HowItWorks />
      <Integrations />
      <FinalCta />
      <Faq />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
    </PageTransition>
  );
}
