import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { agencyPage as c } from "@/content/pages";
import { buttonClass } from "@/components/landing/ui/primitives";
import { PageTransition } from "@/components/effects/PageTransition";
import { ApplyButton } from "@/components/landing/application/ApplyButton";
import { PageHero } from "@/components/landing/blocks/PageHero";
import { BeforeAfter } from "@/components/landing/blocks/BeforeAfter";
import { ScrollWords } from "@/components/landing/blocks/ScrollWords";
import { StackSteps } from "@/components/landing/blocks/StackSteps";
import { VisualBooking, VisualPrice, VisualSearch, VisualStatus } from "@/components/landing/blocks/StepVisuals";
import { Marquee } from "@/components/landing/sections/Marquee";
import { Faq } from "@/components/landing/sections/Faq";
import { FinalCta } from "@/components/landing/sections/FinalCta";

export const metadata: Metadata = {
  title: "Acenteler için",
  description: c.lead,
  alternates: { canonical: "/acenteler" },
};

export default function AgenciesPage() {
  return (
    <PageTransition>
      <PageHero
        kicker={c.kicker}
        title={c.title}
        lead={c.lead}
        photos={c.photos}
        actions={
          <>
            <ApplyButton type="acente" size="lg">
              Acente Olarak Başvur <ArrowRight className="size-4" />
            </ApplyButton>
            <a href="#akis" className={buttonClass("outline", "lg")}>Nasıl çalışır?</a>
          </>
        }
      />
      <Marquee />
      <BeforeAfter title={"Telefon, WhatsApp, Excel.\nArtık tek bir yer."} before={c.before} after={c.after} />
      <ScrollWords text={c.manifesto} label="Bir günlük senaryo" />
      <StackSteps
        id="akis"
        title={"Dört adımda\nrezervasyon."}
        steps={c.steps}
        visuals={[<VisualSearch key="1" />, <VisualPrice key="2" />, <VisualBooking key="3" />, <VisualStatus key="4" />]}
      />
      <Faq only={c.faq} title={"Acentelerin\nsorduğu sorular."} />
      <FinalCta
        title={"Portföyünüzü\nbüyütmeye başlayın."}
        lead="Başvurunuzu bırakın; acente hesabınız onaylandığında B2B satışa açılmış ürünleri panelden inceleyebilirsiniz."
        actions={
          <ApplyButton type="acente" variant="pop" size="lg">
            Acente Olarak Başvur <ArrowRight className="size-4" />
          </ApplyButton>
        }
      />
    </PageTransition>
  );
}
