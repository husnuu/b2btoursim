import { Container, Heading, delay } from "@/components/landing/ui/primitives";
import { GlyphExchange, GlyphHub, GlyphNetwork, WaveMark } from "@/components/landing/ui/Glyphs";

const items = [
  {
    Glyph: GlyphNetwork,
    title: "Geniş Ürün Ağı",
    body: "Farklı turizm kategorilerindeki ürünleri tek platformda keşfedin.",
  },
  {
    Glyph: GlyphExchange,
    title: "B2B Satış ve Dağıtım",
    body: "Ürünlerinizi diğer acentelerin satışına açın veya tedarikçilerden ürün temin edin.",
  },
  {
    Glyph: GlyphHub,
    title: "Merkezi Yönetim",
    body: "Ürün, rezervasyon ve iş ortaklığı süreçlerinizi tek noktadan yönetin.",
  },
];

export function ValueProps() {
  return (
    <section id="platform" aria-labelledby="platform-baslik" className="py-20 sm:py-28">
      <Container>
        <div className="grain relative overflow-hidden rounded-[28px] bg-pop px-6 py-16 sm:px-12 sm:py-24">
          <WaveMark className="pointer-events-none absolute -top-10 -right-24 w-[420px] text-white/45" />
          <WaveMark className="pointer-events-none absolute -bottom-16 -left-28 w-[360px] text-white/35" />

          <div className="relative mx-auto max-w-3xl text-center">
            <Heading id="platform-baslik">{"Turizmde Daha Fazla Bağlantı,\nDaha Fazla Fırsat."}</Heading>
            <p data-reveal style={delay(200)} className="mx-auto mt-6 max-w-xl text-lg text-ink-2">
              Turizm ürünlerini, tedarikçileri ve satış kanallarını tek bir dijital ekosistemde buluşturun.
            </p>
          </div>

          <div className="relative mt-16 grid gap-14 sm:mt-20 md:grid-cols-3 md:gap-8">
            {items.map(({ Glyph, title, body }, i) => (
              <article key={title} data-reveal style={delay(i * 140)} className="flex flex-col items-center text-center">
                <Glyph className="size-20 text-ink" />
                <h3 className="mt-7 text-2xl font-extrabold tracking-tight">{title}</h3>
                <p className="mt-3 max-w-xs text-[17px] leading-relaxed text-ink-2">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
