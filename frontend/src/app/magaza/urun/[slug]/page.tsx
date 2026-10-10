import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight, Clock, ExternalLink, Languages, MapPin, MessageSquareText, Smartphone, Truck, X, Zap, CalendarCheck } from "lucide-react";
import { catLabel, destNameIn, fromPrice, tl, type Product } from "@/content/vitrin";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { getPublishedTour } from "@/lib/storefront/tours";
import { getVitrinData } from "@/lib/storefront/vitrin-data";
import { PageTransition } from "@/components/effects/PageTransition";
import { BookingWidget } from "@/components/vitrin/BookingWidget";
import { Carousel } from "@/components/vitrin/Carousel";
import { HeartButton } from "@/components/vitrin/Favorites";
import { ProductCard } from "@/components/vitrin/ProductCard";
import { ProductGallery } from "@/components/vitrin/ProductGallery";
import { ReadMore } from "@/components/vitrin/ReadMore";
import { StickyTabs } from "@/components/vitrin/StickyTabs";
import { ProductTopBar, ShareButton } from "@/components/vitrin/ProductTopBar";
import { RecentlyViewed, TrackView } from "@/components/vitrin/RecentlyViewed";
import { ctaPrimary } from "@/components/vitrin/cta";

type Params = { params: Promise<{ slug: string }> };

async function load(slug: string): Promise<{ p: Product | null; products: Product[]; destName: (s: string) => string }> {
  const tenant = await getStorefrontTenant();
  const data = await getVitrinData(tenant ? { id: tenant.id, name: tenant.name } : null);
  const base = data.products.find((x) => x.slug === slug && !x.href) ?? null;
  if (!base) return { p: null, products: data.products, destName: (s) => destNameIn(data.destinations, s) };
  let p = base;
  // Kiracı vitrini: gerçek kalkışlar sepete girer; tutar sunucuda hesaplanır.
  if (tenant) {
    const real = await getPublishedTour(tenant.id, slug);
    if (real) {
      p = {
        ...base,
        summary: base.summary || real.summary,
        description: base.description || real.summary,
        included: real.includes,
        excluded: real.excludes,
        meeting: base.meeting || real.meetingPoint,
        cart: {
          productId: slug,
          supplier: real.supplier,
          marginPct: 0,
          variants: real.variants.map((v) => ({ id: v.id, name: v.name, startsAt: v.startsAt, net: v.basePrice, currency: v.currency })),
        },
      };
    }
  }
  return { p, products: data.products, destName: (s) => destNameIn(data.destinations, s) };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { p } = await load(slug);
  return p ? { title: p.title, description: p.summary || undefined } : {};
}

const baseTabs = [
  { id: "hizli-bilgi", label: "Hızlı bilgi" },
  { id: "program", label: "Program" },
  { id: "ne-beklemeli", label: "Ne beklemeli" },
  { id: "bulusma", label: "Buluşma noktası" },
  { id: "iptal", label: "İptal koşulları" },
  { id: "degerlendirmeler", label: "Değerlendirmeler" },
];

const H2 = ({ children }: { children: string }) => <h2 className="text-[1.6rem] font-extrabold tracking-tight sm:text-3xl">{children}</h2>;

/** Seyyah `/vitrin/urun/[slug]` sayfası, birebir; veri `VitrinData`dan. */
export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const { p, products, destName } = await load(slug);
  if (!p) notFound();

  const tabs = baseTabs.filter((t) => (t.id !== "program" || p.itinerary) && (t.id !== "ne-beklemeli" || p.description || p.included.length || p.excluded.length) && (t.id !== "bulusma" || p.meeting));
  const related = products.filter((x) => x.slug !== p.slug && (x.city === p.city || x.category === p.category)).slice(0, 6);
  const quick = [
    { Icon: Clock, label: "Süre", value: p.duration || "—" },
    { Icon: Languages, label: "Diller", value: p.languages.length ? p.languages.join(", ") : "Türkçe" },
    { Icon: Smartphone, label: "Bilet", value: "Mobil voucher" },
    p.pickup ? { Icon: Truck, label: "Ulaşım", value: "Otelden alınış" } : { Icon: MapPin, label: "Başlangıç", value: destName(p.city) },
  ];

  return (
    <PageTransition>
      <TrackView slug={p.slug} />
      <ProductTopBar title={p.title} image={p.image} price={tl(fromPrice(p))} watchId="urun-baslik" />
      <div className="pb-20 lg:pb-0">
      {/* Galeri */}
      <section className="mx-auto max-w-[1320px] px-5 pt-4 sm:pt-6">
        <div className="relative h-[300px] overflow-hidden rounded-[24px] sm:h-[420px] lg:h-[480px]">
          <ProductGallery images={p.gallery} title={p.title} />
          <HeartButton id={p.slug} title={p.title} className="absolute top-5 right-5 size-12" />
        </div>
      </section>

      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 pt-8 lg:grid-cols-[1fr_400px] lg:gap-14">
        <article className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Konum" className="flex flex-wrap items-center gap-1 text-sm text-ink-3">
            <Link href="/magaza" className="underline underline-offset-2 hover:text-ink">Ana sayfa</Link>
            <ChevronRight className="size-3.5" />
            <Link href={`/magaza/ara?sehir=${p.city}`} className="underline underline-offset-2 hover:text-ink">{destName(p.city)}</Link>
            <ChevronRight className="size-3.5" />
            <span className="line-clamp-1 text-ink">{p.title}</span>
          </nav>
          <ShareButton title={p.title} />
          </div>

          <span className="mt-5 inline-block rounded-full bg-pop px-3.5 py-1 text-[13px] font-bold tracking-wide uppercase">{catLabel(p.category)}</span>
          <h1 id="urun-baslik" className="mt-4 text-[2rem] leading-[1.12] font-extrabold tracking-tight sm:text-[2.7rem]">{p.title}</h1>
          {p.summary && <p className="mt-3 text-lg text-ink-2">{p.summary}</p>}

          <div className="mt-6 flex flex-wrap gap-2">
            {p.instant && <span className="flex items-center gap-1.5 rounded-xl bg-mist px-3.5 py-2 text-[15px] font-semibold"><Zap className="size-4" /> Anında onay</span>}
            {p.freeCancel && <span className="flex items-center gap-1.5 rounded-xl bg-pop-soft px-3.5 py-2 text-[15px] font-semibold text-pop-deep"><CalendarCheck className="size-4" /> Ücretsiz iptal</span>}
            {p.chips.map((c) => <span key={c} className="rounded-xl bg-mist px-3.5 py-2 text-[15px] font-medium">{c}</span>)}
          </div>

          <div className="mt-10"><StickyTabs tabs={tabs} /></div>

          <section id="hizli-bilgi" className="scroll-mt-48 pt-10">
            <H2>Hızlı bilgi</H2>
            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
              {quick.map(({ Icon, label, value }) => (
                <div key={label} className="bg-white p-4">
                  <Icon className="size-5" />
                  <dt className="mt-3 text-sm text-ink-3">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            {p.highlights.length > 0 && (
              <>
                <h3 className="mt-10 text-xl font-bold">Neden seveceksiniz?</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex gap-3 text-[17px]">
                      <span className="mt-2 size-2.5 shrink-0 rotate-45 bg-pop-deep" /> {h}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {p.itinerary && (
            <section id="program" className="scroll-mt-48 pt-14">
              <H2>Program</H2>
              <ol className="relative mt-8 ml-3 border-l-2 border-dashed border-ink/20">
                {p.itinerary.map((s, i) => (
                  <li key={`${s.time}-${i}`} data-reveal style={{ "--d": `${i * 80}ms` } as React.CSSProperties} className="relative pb-8 pl-8 last:pb-0">
                    <span className={`absolute top-0 -left-[13px] grid size-6 place-items-center rounded-full border-[3px] border-white ${i === 0 || i === p.itinerary!.length - 1 ? "bg-ink" : "bg-pop"}`} />
                    {s.time && <span className="inline-block rounded-md bg-mist px-2 py-0.5 text-sm font-bold tabular-nums">{s.time}</span>}
                    <h3 className="mt-2 text-lg font-bold">{s.title}</h3>
                    {s.body && <p className="mt-1 text-ink-2">{s.body}</p>}
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-sm text-ink-3">Saatler yaklaşıktır; hava ve trafik koşullarına göre değişebilir.</p>
            </section>
          )}

          {(p.description || p.included.length > 0 || p.excluded.length > 0) && (
          <section id="ne-beklemeli" className="scroll-mt-48 pt-14">
            <H2>Ne beklemeli</H2>
            {p.description && (
              <div className="mt-5 text-[17px] leading-[1.75] text-ink-2">
                <ReadMore><p>{p.description}</p></ReadMore>
              </div>
            )}
            {(p.included.length > 0 || p.excluded.length > 0) && (
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="text-xl font-bold">Neler dahil</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {p.included.map((x) => <li key={x} className="flex gap-3"><Check className="mt-0.5 size-5 shrink-0 text-pop-deep" strokeWidth={3} /> {x}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold">Neler dahil değil</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {p.excluded.map((x) => <li key={x} className="flex gap-3"><X className="mt-0.5 size-5 shrink-0 text-amber" strokeWidth={3} /> {x}</li>)}
                </ul>
              </div>
            </div>
            )}
            <Link href={`/magaza/ara?sehir=${p.city}`} className="group mt-10 flex items-center gap-5 rounded-2xl bg-pop-soft p-5 transition-colors hover:bg-pop">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white"><MapPin className="size-6" /></span>
              <span className="flex-1">
                <span className="block text-lg font-bold">{destName(p.city)}</span>
                <span className="text-ink-2">Bu bölgedeki diğer deneyimleri keşfedin</span>
              </span>
              <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </section>
          )}

          {p.meeting && (
          <section id="bulusma" className="scroll-mt-48 pt-14">
            <H2>Buluşma noktası</H2>
            <div className="mt-6 overflow-hidden rounded-2xl border border-line">
              <div className="relative h-44 bg-pop-soft" aria-hidden="true">
                <svg viewBox="0 0 600 180" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full text-pop-deep/25">
                  <g fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round">
                    <path d="M-20 140 C 120 100, 200 160, 320 110 S 520 60, 640 90" />
                    <path d="M60 -10 C 90 60, 160 90, 200 200" strokeWidth="6" />
                    <path d="M420 -10 C 400 70, 460 110, 430 200" strokeWidth="6" />
                  </g>
                </svg>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
                  <span className="pulse absolute top-[70%] left-1/2 size-8 -translate-x-1/2 rounded-full bg-ink/20" />
                  <MapPin className="relative size-11 fill-ink text-pop" strokeWidth={1.5} />
                </span>
              </div>
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0" /> {p.meeting}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.meeting)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex shrink-0 items-center gap-1.5 font-semibold underline underline-offset-4"
                >
                  Haritada aç <ExternalLink className="size-4" />
                </a>
              </div>
            </div>
            {p.remember.length > 0 && (
              <>
                <h3 className="mt-10 text-xl font-bold">Bilmeniz gerekenler</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {p.remember.map((r) => <li key={r} className="flex gap-3 text-[17px] whitespace-pre-line text-ink-2"><span className="mt-2.5 size-2 shrink-0 rounded-full bg-ink" /> {r}</li>)}
                </ul>
              </>
            )}
            <p className="mt-8 text-ink-3">Tedarikçi: <b className="text-ink">{p.supplier}</b></p>
          </section>
          )}

          <section id="iptal" className="scroll-mt-48 pt-14">
            <H2>İptal koşulları</H2>
            <div className={`mt-5 flex gap-4 rounded-2xl p-5 ${p.freeCancel ? "bg-pop-soft" : "bg-amber-soft"}`}>
              <CalendarCheck className={`size-6 shrink-0 ${p.freeCancel ? "text-pop-deep" : "text-amber"}`} />
              <p className="text-[17px]">{p.cancellation || "İptal koşulları rezervasyon onayında paylaşılır."}</p>
            </div>
            <h3 className="mt-8 text-xl font-bold">Rezervasyon ücreti</h3>
            <p className="mt-2 text-[17px] text-ink-2">Gösterilen fiyatlara ek hizmet bedeli eklenmez.</p>
          </section>

          <section id="degerlendirmeler" className="scroll-mt-48 pt-14">
            <H2>Değerlendirmeler</H2>
            <div className="mt-6 flex flex-col items-center rounded-2xl border-2 border-dashed border-ink/15 px-6 py-12 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-mist"><MessageSquareText className="size-7" /></span>
              <p className="mt-4 text-lg font-bold">Henüz değerlendirme yok</p>
              <p className="mt-1 max-w-sm text-ink-3">Bu deneyime katılan misafirlerin doğrulanmış yorumları burada yayınlanacak.</p>
            </div>
          </section>
        </article>

        <aside className="scroll-mt-40">
          <div className="lg:sticky lg:top-24">
            <BookingWidget p={p} />
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mx-auto max-w-[1320px] px-5 pt-20">
          <h2 className="mb-6 text-[1.75rem] font-extrabold tracking-tight sm:text-[2.2rem]">Bunları da beğenebilirsiniz</h2>
          <Carousel label="Benzer deneyimler">
            {related.map((r) => <ProductCard key={r.slug} p={r} />)}
          </Carousel>
        </section>
      )}

      <div className="mx-auto max-w-[1320px] px-5 pt-16">
        <RecentlyViewed exclude={p.slug} title="Daha önce baktıklarınız" />
      </div>
      </div>
      {/* Mobil alt çubuk */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-line bg-white px-5 py-3 shadow-[var(--shadow-lift)] lg:hidden">
        <span>
          <span className="block text-xs text-ink-3">başlayan fiyatlarla</span>
          <b className="text-xl font-extrabold tabular-nums">{tl(fromPrice(p))}</b>
        </span>
        <a href="#rezervasyon" className={`${ctaPrimary} h-12`}>Tarih seçin</a>
      </div>
    </PageTransition>
  );
}
