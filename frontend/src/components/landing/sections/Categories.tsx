import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Heading, buttonClass, delay } from "@/components/landing/ui/primitives";
import { CategoryTabs } from "./CategoryTabs";

export function Categories() {
  return (
    <section id="pazaryeri" aria-labelledby="pazaryeri-baslik" className="grain relative bg-pop py-24 sm:py-32">
      <Container className="relative">
        <div className="mb-14 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <Heading id="pazaryeri-baslik">{"Turizmin Her Alanı\nTek Platformda."}</Heading>
          <p data-reveal style={delay(150)} className="max-w-md text-lg leading-relaxed text-ink-2 lg:justify-self-end lg:pb-3">
            Acenteler farklı tedarikçilerin ürünlerine tek panelden ulaşır; tedarikçiler her kategoride ürünlerini B2B satışa açar.
          </p>
        </div>
        <div data-reveal style={delay(100)}>
          <CategoryTabs />
        </div>
        <div data-reveal className="mt-10 flex justify-center">
          <Link href="/pazaryeri" className={buttonClass("dark", "lg")}>
            Pazaryerini keşfedin <ArrowRight className="size-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
