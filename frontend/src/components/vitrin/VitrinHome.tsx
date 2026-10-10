import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarCheck, CalendarDays, Headset, Plus, Search, Smartphone, Zap } from "lucide-react";
import { destNameIn, fromPrice, tl, type VitrinData } from "@/content/vitrin";
import { PageTransition } from "@/components/effects/PageTransition";
import { Carousel } from "./Carousel";
import { HeroSlides } from "./HeroSlides";
import { ProductCard } from "./ProductCard";
import { RecentlyViewed } from "./RecentlyViewed";
import { HeroSearch } from "./HeroSearch";

const wrap = "mx-auto w-full max-w-[1320px] px-5";

function SectionTitle({ children, href, more = "Tümünü gör" }: { children: string; href?: string; more?: string }) {
  return (
    <div data-reveal className="mb-6 flex items-end justify-between gap-4">
      <h2 className="min-w-0 text-[1.6rem] leading-tight font-extrabold tracking-tight sm:text-[2.2rem]">{children}</h2>
      {href && (
        <Link href={href} className="btn-arrow flex shrink-0 items-center gap-1.5 font-semibold underline underline-offset-4 decoration-2 hover:decoration-pop">
          {more} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

const trust = [
  { Icon: CalendarCheck, title: "Esnek iptal", body: "Deneyimlerin çoğunda belirli bir süreye kadar ücretsiz iptal. Koşullar her ürün sayfasında açıkça yazılı." },
  { Icon: Zap, title: "Hızlı onay", body: "Anında onaylı ürünlerde rezervasyonunuz hemen kesinleşir; diğerlerinde tedarikçi onayını size iletiriz." },
  { Icon: Headset, title: "Türkçe destek", body: "Planlamadan dönüş gününe kadar sorularınız için ekibimiz yanınızda." },
];

/** Seyyah `/vitrin` ana sayfası, birebir; veri `VitrinData`dan. */
export function VitrinHome({ data }: { data: VitrinData }) {
  const { agency, products, destinations, inspirations, categories: vCategories, faq: vitrinFaq } = data;
  const destName = (slug: string) => destNameIn(destinations, slug);
  const popularRaw = products.filter((p) => p.badge);
  const popular = popularRaw.length ? popularRaw : products.slice(0, 8);
  const deals = products.filter((p) => p.oldPrice);
  const boats = products.filter((p) => p.category === "tekne").slice(0, 3);
  const collection = boats.length ? boats : products.slice(0, 3);
  const collectionHref = boats.length ? "/magaza/ara?kategori=tekne" : "/magaza/ara";

  return (
    <PageTransition>
      {/* HERO */}
      <section className={`${wrap} pt-4 sm:pt-6`}>
        <div className="relative isolate overflow-hidden rounded-[28px]">
          <div className="absolute inset-0 -z-10">
            <HeroSlides />
          </div>
          <div className="flex min-h-[540px] flex-col justify-center px-5 py-16 sm:min-h-[600px] sm:px-14 lg:px-20">
            <h1 className="max-w-4xl text-[2rem] leading-[1.18] font-extrabold tracking-tight uppercase sm:text-5xl lg:text-[3.4rem]">
              <span className="strip-in block">
                <span className="strip bg-pop">Türkiye&apos;nin en güzel deneyimleri,</span>
              </span>
              <span className="strip-in mt-1 block" style={{ animationDelay: "250ms" }}>
                <span className="strip bg-white">tek yerden rezerve edin</span>
              </span>
            </h1>
            <div className="tab-in relative z-20 mt-8 max-w-[880px]" style={{ animationDelay: "450ms" }}>
              <HeroSearch />
            </div>
            {destinations.length > 0 && (
              <div className="tab-in mt-5 flex flex-wrap gap-2" style={{ animationDelay: "600ms" }}>
                {destinations.slice(0, 5).map((d) => (
                  <Link key={d.slug} href={`/magaza/ara?sehir=${d.slug}`} className="rounded-full bg-white/85 px-4 py-1.5 text-sm font-semibold backdrop-blur transition-colors hover:bg-pop">
                    {d.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* GÜVEN SATIRI */}
      <section className={`${wrap} grid gap-8 py-14 md:grid-cols-3`}>
        {trust.map(({ Icon, title, body }, i) => (
          <div key={title} data-reveal style={{ "--d": `${i * 100}ms` } as React.CSSProperties} className="flex gap-5">
            <span className="relative grid size-16 shrink-0 place-items-center">
              <span className="absolute inset-0 rotate-6 rounded-2xl bg-pop" />
              <span className="absolute inset-0 -rotate-3 rounded-2xl border-2 border-ink" />
              <Icon className="relative size-7" />
            </span>
            <div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ÜRÜNLER */}
      <div className={`${wrap}`}>
        <div className="rounded-[28px] bg-mist px-5 py-12 sm:px-10 sm:py-16">
          <div className="mb-12 empty:hidden"><RecentlyViewed /></div>
          <section aria-label="Şu an popüler">
            <SectionTitle href="/magaza/ara">Şu an popüler</SectionTitle>
            <Carousel label="Popüler deneyimler">
              {popular.map((p) => <ProductCard key={p.slug} p={p} />)}
            </Carousel>
          </section>

          {inspirations.length > 0 && (
            <section aria-label="İlham alın" className="mt-12">
              <SectionTitle>İlham alın</SectionTitle>
              <Carousel label="İlham" itemClass="w-[82%] sm:w-[46%] lg:w-[calc((100%-3*20px)/4)]">
                {inspirations.map((s) => (
                  <Link key={s.title} href={s.href} className="group relative block aspect-[4/5] overflow-hidden rounded-[22px]">
                    <Image src={s.image} alt="" fill sizes="(min-width: 1024px) 300px, 82vw" className="object-cover transition-transform duration-[1.2s] group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent" />
                    <p className="absolute inset-x-4 bottom-4 text-xl leading-[1.35] font-extrabold">
                      <span className="strip bg-pop">{s.title}</span>
                    </p>
                  </Link>
                ))}
              </Carousel>
            </section>
          )}

          {deals.length > 0 && (
            <section aria-label="Fırsatlar" className="mt-12">
              <SectionTitle href="/magaza/ara?firsat=1">Fırsatlar</SectionTitle>
              <Carousel label="Fırsatlar">
                {deals.map((p) => <ProductCard key={p.slug} p={p} />)}
              </Carousel>
            </section>
          )}
        </div>
      </div>

      {/* DESTİNASYONLAR — bento */}
      {destinations.length > 0 && (
        <section aria-label="Destinasyonunuzu seçin" className={`${wrap} pt-20`}>
          <SectionTitle href="/magaza/ara">Destinasyonunuzu seçin</SectionTitle>
          <ul className="grid grid-flow-dense grid-cols-2 gap-3 [grid-auto-rows:180px] sm:gap-4 sm:[grid-auto-rows:220px] lg:grid-cols-4">
            {destinations.map((d, i) => {
              const count = products.filter((p) => p.city === d.slug).length;
              const span = i === 0 ? "col-span-2 row-span-2" : i === 3 ? "lg:col-span-2" : "";
              return (
                <li key={d.slug} data-reveal style={{ "--d": `${(i % 4) * 70}ms` } as React.CSSProperties} className={span}>
                  <Link href={`/magaza/ara?sehir=${d.slug}`} className="group relative block h-full overflow-hidden rounded-[22px]">
                    <Image src={d.image} alt={d.name} fill sizes={i === 0 ? "(min-width: 1024px) 640px, 100vw" : "(min-width: 1024px) 320px, 50vw"} className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/5 to-transparent transition-opacity duration-500 group-hover:opacity-80" />
                    <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-white sm:inset-x-5 sm:bottom-5">
                      <span>
                        <span className={`block font-extrabold tracking-tight ${i === 0 ? "text-3xl sm:text-5xl" : "text-xl sm:text-2xl"}`}>{d.name}</span>
                        <span className="text-sm text-white/80">{count} deneyim</span>
                      </span>
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pop text-ink transition-transform duration-500 group-hover:-rotate-45">
                        <ArrowRight className="size-5" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* KOLEKSİYON BANDI */}
      {collection.length > 0 && (
        <section className={`${wrap} pt-20`}>
          <div className="grid overflow-hidden rounded-[28px] bg-ink text-white lg:grid-cols-[1.1fr_1fr]">
            <div className="relative min-h-[320px] overflow-hidden">
              <Image src={boats.length ? "/images/v/oludeniz-2.jpg" : collection[0].image} alt="" fill sizes="(min-width: 1024px) 680px, 100vw" className="zoom-on-scroll object-cover" />
              <p className="absolute top-6 left-6 rounded-full bg-pop px-4 py-1.5 text-sm font-bold text-ink">Koleksiyon</p>
            </div>
            <div className="p-8 sm:p-12">
              <h2 className="font-display text-[2.2rem] leading-[1.05] sm:text-5xl">{boats.length ? "Ege'de mavi yolculuk" : "Öne çıkanlar"}</h2>
              <p className="mt-4 max-w-md text-white/70">
                {boats.length ? "Koydan koya tekne turları ve özel gulet seçenekleri. Yaz boyunca en çok tercih edilen deniz deneyimleri bir arada." : "En çok tercih edilen deneyimler bir arada."}
              </p>
              <ul className="mt-8 flex flex-col divide-y divide-white/10">
                {collection.map((p) => (
                  <li key={p.slug}>
                    <Link href={p.href ?? `/magaza/urun/${p.slug}`} className="group flex items-center gap-4 py-4">
                      <span className="relative size-16 shrink-0 overflow-hidden rounded-xl">
                        <Image src={p.image} alt="" fill sizes="64px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-white/60">{destName(p.city)}</span>
                        <span className="block truncate font-bold group-hover:underline">{p.title}</span>
                      </span>
                      <span className="text-right font-extrabold tabular-nums">{tl(fromPrice(p))}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={collectionHref} className="btn-arrow mt-6 inline-flex items-center gap-2 rounded-xl bg-pop px-6 py-3 font-bold text-ink hover:bg-white">
                Koleksiyonu gör <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* KATEGORİLER */}
      <section className={`${wrap} pt-20`}>
        <SectionTitle>Ne yapmak istersiniz?</SectionTitle>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {vCategories.map((c, i) => (
            <li key={c.key} data-reveal style={{ "--d": `${i * 70}ms` } as React.CSSProperties}>
              <Link href={`/magaza/ara?kategori=${c.key}`} className="group flex flex-col items-center gap-4 rounded-[22px] p-4 text-center transition-colors hover:bg-mist">
                <span className="relative size-28 overflow-hidden rounded-full ring-4 ring-transparent transition-all duration-300 group-hover:ring-pop sm:size-32">
                  <Image src={c.image} alt="" fill sizes="128px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                </span>
                <span className="font-bold">{c.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ACENTE BANDI */}
      <section className={`${wrap} pt-20`}>
        <div className="grain relative grid items-center gap-10 overflow-hidden rounded-[28px] bg-pop p-8 sm:p-14 lg:grid-cols-[1.2fr_1fr]">
          <div className="relative">
            <p className="text-sm font-bold tracking-wide uppercase">{agency.name} hakkında</p>
            <h2 className="font-display mt-3 text-[2.2rem] leading-[1.05] sm:text-5xl">Yerel ekip, özenle seçilmiş deneyimler.</h2>
            <p className="mt-5 max-w-lg text-lg text-ink-2">
              Her deneyimi güvendiğimiz yerel tedarikçilerle sunuyoruz. Sorunuz olursa bize telefonla ya da e-postayla ulaşın.
            </p>
          </div>
          <div className="relative h-64 sm:h-72" aria-hidden="true">
            <div className="polaroid absolute top-0 left-[8%] w-[48%] -rotate-6"><div className="relative aspect-[4/5]"><Image src="/images/v/alacati.jpg" alt="" fill sizes="240px" className="object-cover" /></div></div>
            <div className="polaroid float absolute top-6 right-[6%] w-[46%] rotate-6"><div className="relative aspect-[4/5]"><Image src="/images/v/bodrum-2.jpg" alt="" fill sizes="240px" className="object-cover" /></div></div>
          </div>
        </div>
      </section>

      {/* NASIL REZERVASYON */}
      <section className={`${wrap} pt-20`}>
        <SectionTitle>3 adımda rezervasyon</SectionTitle>
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            { Icon: Search, t: "Keşfedin", b: "Destinasyona, kategoriye ya da tarihe göre deneyimleri inceleyin." },
            { Icon: CalendarDays, t: "Tarih seçin", b: "Takvimden müsait günü ve bilet sayısını seçin; fiyatı hemen görün." },
            { Icon: Smartphone, t: "Voucher'ınızı alın", b: "Onaydan sonra mobil voucher'ınız e-postanıza gelir; telefonunuzdan gösterin." },
          ].map(({ Icon, t, b }, i) => (
            <li key={t} data-reveal style={{ "--d": `${i * 120}ms` } as React.CSSProperties} className="group relative overflow-hidden rounded-[22px] border-2 border-ink/10 p-7 transition-colors hover:border-ink">
              <span className="font-display absolute -top-4 right-4 text-[7rem] leading-none text-ink/[0.06] transition-colors group-hover:text-pop">{i + 1}</span>
              <span className="relative grid size-12 place-items-center rounded-xl bg-ink text-pop"><Icon className="size-6" /></span>
              <h3 className="relative mt-5 text-xl font-bold">{t}</h3>
              <p className="relative mt-2 text-ink-2">{b}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* SSS */}
      {vitrinFaq.length > 0 && (
        <section className={`${wrap} grid gap-10 pt-20 lg:grid-cols-[0.8fr_1.2fr]`}>
          <div>
            <h2 className="text-[1.6rem] font-extrabold tracking-tight sm:text-[2.2rem]">Sıkça sorulanlar</h2>
            <p className="mt-3 max-w-sm text-ink-2">Aradığınızı bulamadınız mı? {agency.phone || agency.email} üzerinden bize ulaşın.</p>
          </div>
          <div className="border-t-2 border-ink">
            {vitrinFaq.map((f) => (
              <details key={f.q} name="vitrin-sss" className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-bold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mist transition-all duration-300 group-open:rotate-45 group-open:bg-pop">
                    <Plus className="size-4" />
                  </span>
                </summary>
                <p className="max-w-2xl pb-5 text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </PageTransition>
  );
}
