import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { supplierPage as c } from "@/content/pages";
import { buttonClass } from "@/components/landing/ui/primitives";
import { PageTransition } from "@/components/effects/PageTransition";
import { ApplyButton } from "@/components/landing/application/ApplyButton";
import { PageHero } from "@/components/landing/blocks/PageHero";
import { ScrollWords } from "@/components/landing/blocks/ScrollWords";
import { CommissionDemo } from "@/components/landing/blocks/CommissionDemo";
import { StackSteps } from "@/components/landing/blocks/StackSteps";
import { VisualCalendar, VisualPartners, VisualSearch, VisualStatus } from "@/components/landing/blocks/StepVisuals";
import { Faq } from "@/components/landing/sections/Faq";
import { FinalCta } from "@/components/landing/sections/FinalCta";

export const metadata: Metadata = {
  title: "Tedarikçiler için",
  description: c.lead,
  alternates: { canonical: "/tedarikciler" },
};

export default function SuppliersPage() {
  return (
    <PageTransition>
      <PageHero
        kicker={c.kicker}
        title={c.title}
        lead={c.lead}
        photos={c.photos}
        actions={
          <>
            <ApplyButton type="tedarikci" size="lg">
              Tedarikçi Olarak Başvur <ArrowRight className="size-4" />
            </ApplyButton>
            <a href="#akis" className={buttonClass("outline", "lg")}>Nasıl çalışır?</a>
          </>
        }
      />
      <ScrollWords text={c.manifesto} label="Neden Seyyah?" tone="mist" />
      <CommissionDemo />
      <StackSteps
        id="akis"
        title={"Listeleyin.\nAçın. Satın."}
        steps={c.steps}
        visuals={[
          <VisualSearch key="1" />,
          <VisualCalendar key="2" />,
          <VisualPartners key="3" />,
          <VisualStatus key="4" items={["Yeni talep geldi", "Müsaitlik kontrol edildi", "Onay bekliyor"]} />,
        ]}
      />
      <Faq only={c.faq} title={"Tedarikçilerin\nsorduğu sorular."} />
      <FinalCta
        title={"Ürünlerinizi yeni\nacentelerle buluşturun."}
        lead="Başvurunuzu bırakın; hesabınız onaylandığında ürünlerinizi listeleyip acentelerin satışına açabilirsiniz."
        actions={
          <ApplyButton type="tedarikci" variant="pop" size="lg">
            Tedarikçi Olarak Başvur <ArrowRight className="size-4" />
          </ApplyButton>
        }
      />
    </PageTransition>
  );
}
