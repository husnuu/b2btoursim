import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Heading, delay } from "@/components/landing/ui/primitives";
import { SailBullet } from "@/components/landing/ui/Glyphs";
import { ApplyButton } from "@/components/landing/application/ApplyButton";

const sides = [
  {
    type: "acente" as const,
    label: "Acenteler için",
    title: "Yeni Ürünler Keşfedin. Satışlarınızı Büyütün.",
    body: "Farklı tedarikçilerin turizm ürünlerine ulaşın, acentenize uygun ticari koşulları değerlendirin ve müşterilerinize daha fazla seçenek sunun.",
    points: ["Tedarikçi keşfi", "B2B fiyatlandırma", "Ürün portföyü", "Rezervasyon yönetimi"],
    cta: "Acente Olarak Başvur",
    href: "/acenteler",
    image: "/images/istanbul.jpg",
    alt: "Eminönü siluetinin önünden geçen İstanbul vapuru",
    dark: true,
    tilt: "rotate-[6deg]",
  },
  {
    type: "tedarikci" as const,
    label: "Tedarikçiler için",
    title: "Ürünlerinizi Daha Fazla Acenteye Ulaştırın.",
    body: "Turlarınızı ve hizmetlerinizi Seyyah üzerinden acentelerin satışına açarak yeni iş ortaklıkları ve satış kanalları oluşturun.",
    points: ["Ürün listeleme", "Fiyat ve kontenjan yönetimi", "B2B dağıtım", "Rezervasyon takibi"],
    cta: "Tedarikçi Olarak Başvur",
    href: "/tedarikciler",
    image: "/images/yat.jpg",
    alt: "Yeşil koy önünde ilerleyen beyaz motor yat",
    dark: false,
    tilt: "-rotate-[5deg]",
  },
];

export function Marketplace() {
  return (
    <section id="cozumler" aria-labelledby="cozumler-baslik" className="bg-mist py-24 sm:py-32">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <Heading id="cozumler-baslik">{"İster Ürün Satın,\nİster Ürün Tedarik Edin."}</Heading>
          <p data-reveal style={delay(150)} className="max-w-md text-lg leading-relaxed text-ink-2 lg:justify-self-end lg:pb-3">
            Seyyah iki taraflı bir B2B pazaryeri: aynı platformda hem alıcı hem satıcı olabilirsiniz.
          </p>
        </div>

        <div className="mt-24 grid gap-24 lg:grid-cols-2 lg:gap-8">
          {sides.map((s, i) => (
            <article
              key={s.type}
              data-reveal
              style={delay(i * 150)}
              className={`group relative flex flex-col rounded-[28px] px-7 pt-36 pb-9 sm:px-10 sm:pt-40 sm:pb-11 ${
                s.dark ? "bg-ink text-white" : "grain bg-pop text-ink"
              }`}
            >
              {/* Kartın üstünden taşan polaroid */}
              <div data-parallax="0.06" className="absolute -top-16 right-6 w-[46%] max-w-[250px] sm:right-10">
                <div className={`polaroid ${s.tilt} transition-transform duration-700 group-hover:rotate-0`}>
                  <div className="relative aspect-[5/4]">
                    <Image src={s.image} alt={s.alt} fill sizes="250px" className="object-cover" />
                  </div>
                </div>
              </div>

              <p className={`absolute top-9 left-7 text-sm font-bold tracking-wide uppercase sm:left-10 ${s.dark ? "text-pop" : "text-ink"}`}>
                {s.label}
              </p>

              <h3 className="font-display max-w-md text-[2rem] leading-[1.08] sm:text-[2.6rem]">{s.title}</h3>
              <p className={`mt-5 max-w-lg text-[17px] leading-relaxed ${s.dark ? "text-white/70" : "text-ink-2"}`}>{s.body}</p>

              <ul className="mt-8 grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
                {s.points.map((p) => (
                  <li key={p} className="flex items-center gap-3 font-semibold">
                    <SailBullet className={`size-5 shrink-0 ${s.dark ? "text-pop" : "text-ink"}`} />
                    {p}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-col gap-4 pt-10 sm:flex-row sm:items-center sm:gap-6">
                <ApplyButton type={s.type} size="lg" variant={s.dark ? "pop" : "dark"} className="w-full sm:w-auto">
                  {s.cta} <ArrowRight className="size-4" />
                </ApplyButton>
                <Link href={s.href} className="btn-arrow inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline">
                  Detaylı incele <ArrowRight className="size-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
