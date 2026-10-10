import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/landing/ui/primitives";

/**
 * Yasal metinler için yer tutucu. Metinler hukuki danışmanlıkla hazırlanıp
 * buraya eklenmeli — sayfa yayına alınmadan önce doldurulması zorunludur.
 */
const pages = {
  gizlilik: "Gizlilik Politikası",
  "kullanim-kosullari": "Kullanım Koşulları",
  kvkk: "KVKK Aydınlatma Metni",
} as const;

type Slug = keyof typeof pages;

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = pages[slug as Slug];
  return title ? { title, robots: { index: false } } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = pages[slug as Slug];
  if (!title) notFound();

  return (
    <section className="py-24 sm:py-32">
      <Container className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">{title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-2">
          Bu metin hazırlanma aşamasındadır ve kısa süre içinde bu sayfada yayımlanacaktır.
        </p>
      </Container>
    </section>
  );
}
