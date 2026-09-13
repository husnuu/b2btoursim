import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct } from "@/data/mock";
import { formatDuration, formatMoney, formatNumber, formatShortDate, formatTime, t } from "@/lib/i18n";
import { getPublishedSite } from "@/lib/site/load";
import { getTourExtra } from "@/lib/storefront/details";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { getPublishedTour, listPublishedTours } from "@/lib/storefront/tours";
import { Breadcrumb, CancellationTable, Chips, DetailSection, GalleryGrid, IncludeList, WhatsAppLink } from "@/components/b2c/detail/DetailShell";
import { ProductCard } from "@/components/b2c/ProductCard";
import { StickyBookingWidget } from "@/components/b2c/StickyBookingWidget";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getStorefrontTenant();
  const product = tenant ? await getPublishedTour(tenant.id, id) : getProduct(id);
  return { title: product ? `${product.title} — ${tenant?.name ?? "Kontuar"}` : "Tur" };
}

const DIFFICULTY: Record<string, string> = { kolay: "Kolay", orta: "Orta", zor: "Zor", uzman: "Uzman" };

/**
 * Tur detayı. Kiracı adresinde `tour.slug` ile veritabanından: galeri,
 * meta çipler, program, kalkış tarihleri ve fiyatlar, dahil/hariç,
 * bilinmesi gerekenler, iptal koşulları, benzer turlar; sağda rezervasyon
 * kutusu (sepete gider). Örnek vitrinde mock.
 */
export default async function MagazaUrunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getStorefrontTenant();
  const product = tenant ? await getPublishedTour(tenant.id, id) : getProduct(id);
  if (!product) notFound();

  const [extra, config, all] = tenant
    ? await Promise.all([getTourExtra(tenant.id, id), getPublishedSite(tenant.id), listPublishedTours(tenant.id)])
    : [null, null, []];
  const similar = all.filter((r) => r.productId !== id).slice(0, 3);
  const toursSection = config?.sections.find((s) => s.kind === "tours");
  const showRating = product.reviewCount > 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 lg:pb-16">
      {tenant && <Breadcrumb items={[{ label: toursSection?.title ?? "Turlar", href: "/magaza/tur-arama" }, { label: product.title }]} />}
      <h1 className="mt-3 max-w-[24ch] font-dense text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-[1.02] tracking-[-0.01em] text-ink">
        {product.title}
      </h1>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-[length:var(--font-ui)] text-ink-2">
        {showRating && (
          <span className="tnum flex items-baseline gap-2">
            <b className="font-medium text-ink">{product.rating.toLocaleString("tr-TR", { minimumFractionDigits: 1 })}</b>
            <span>{t("b2c.reviews", { count: formatNumber(product.reviewCount) })}</span>
          </span>
        )}
        {product.durationMinutes > 0 && <span className="tnum">{formatDuration(product.durationMinutes)}</span>}
        <span>{t("b2c.languages", { languages: product.languages.join(", ") })}</span>
      </div>
      {extra && (
        <Chips items={[
          extra.startLocation ? `${t("b2c.detail.start")}: ${extra.startLocation}` : null,
          extra.endLocation && extra.endLocation !== extra.startLocation ? `${t("b2c.detail.end")}: ${extra.endLocation}` : null,
          extra.difficulty ? `${t("b2c.detail.difficulty")}: ${DIFFICULTY[extra.difficulty] ?? extra.difficulty}` : null,
          ...extra.categories,
        ]} />
      )}

      {extra ? (
        <GalleryGrid gallery={extra.gallery} />
      ) : (
        <div className="mt-6 aspect-[16/9] w-full rounded-[var(--radius-lg)]" style={{ background: product.imageTone, backgroundImage: "var(--image-sheen-wide)" }} />
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <p className="max-w-[68ch] whitespace-pre-line text-[length:calc(var(--font-ui)*1.1)] leading-relaxed text-ink-2">{product.summary}</p>

          {extra && extra.itinerary.length > 0 && (
            <DetailSection title={t("b2c.detail.program")}>
              <ol className="relative ms-3 border-s border-line ps-5">
                {extra.itinerary.map((s, i) => (
                  <li key={i} className="relative pb-5 last:pb-0">
                    <span aria-hidden="true" className="absolute -start-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full bg-action" />
                    <p className="flex flex-wrap items-baseline gap-x-3">
                      <span className="font-medium text-ink">{s.name}</span>
                      {s.durationMinutes > 0 && <span className="tnum text-[length:var(--font-ui-sm)] text-ink-3">{formatDuration(s.durationMinutes)}</span>}
                    </p>
                    {s.description && <p className="mt-1 text-[length:var(--font-ui-sm)]">{s.description}</p>}
                  </li>
                ))}
              </ol>
            </DetailSection>
          )}

          {extra && (
            <DetailSection title={t("b2c.detail.pricing")}>
              <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {extra.tiers.map((tier) => (
                  <div key={tier.key} className="flex justify-between gap-4 border-b border-line py-1.5">
                    <dt className="text-ink-2">{tier.key === "adult" ? "Yetişkin" : tier.key === "child" ? "Çocuk" : "Bebek"} <span className="tnum text-ink-3">({tier.minAge}–{tier.maxAge})</span></dt>
                    <dd className="tnum text-ink">{formatMoney(tier.price, product.variants[0]?.currency)}</dd>
                  </div>
                ))}
              </dl>
              <h3 className="mt-5 font-medium text-ink">{t("b2c.detail.departures")}</h3>
              {extra.departures.length === 0 ? (
                <p className="mt-1 text-[length:var(--font-ui-sm)] text-ink-3">{t("b2c.detail.noDepartures")}</p>
              ) : (
                <ul className="mt-2 divide-y divide-line border-y border-line">
                  {extra.departures.slice(0, 12).map((d) => (
                    <li key={d.id} className="tnum flex flex-wrap items-baseline justify-between gap-3 py-2 text-[length:var(--font-ui)]">
                      <span className="text-ink">{formatShortDate(d.startsAt)} · {formatTime(d.startsAt)}</span>
                      <span className={d.remaining <= 6 ? "text-warning" : "text-ink-2"}>{t("product.remaining", { count: d.remaining })}</span>
                      <span className="text-ink">{formatMoney(d.price ?? extra.tiers[0]?.price ?? 0, product.variants[0]?.currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </DetailSection>
          )}

          {(product.includes.length > 0 || product.excludes.length > 0) && (
            <DetailSection title={t("product.includes")}><IncludeList includes={product.includes} excludes={product.excludes} /></DetailSection>
          )}
          {extra?.knowBeforeYouGo && <DetailSection title={t("b2c.detail.knowBefore")}><p className="whitespace-pre-line">{extra.knowBeforeYouGo}</p></DetailSection>}
          {extra?.whatToBring && <DetailSection title={t("b2c.detail.whatToBring")}><p className="whitespace-pre-line">{extra.whatToBring}</p></DetailSection>}
          {product.meetingPoint && (
            <DetailSection title={t("product.meetingPoint")}>
              <p>{product.meetingPoint}</p>
              {extra?.meetingTimeMinutesBefore ? <p className="mt-1 text-[length:var(--font-ui-sm)] text-ink-3">Kalkıştan {extra.meetingTimeMinutesBefore} dakika önce hazır olun.</p> : null}
            </DetailSection>
          )}
          <DetailSection title={t("b2c.detail.cancellation")}>
            {extra ? (
              <CancellationTable template={extra.template} cutoffs={extra.cutoffs} />
            ) : (
              <p>{product.cancellation.type === "free" ? t("results.freeCancel", { hours: product.cancellation.hoursBefore }) : t("results.noCancel")}</p>
            )}
          </DetailSection>

          {similar.length > 0 && (
            <DetailSection title={t("b2c.detail.similar")}>
              <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((r) => <ProductCard key={r.id} result={r} />)}
              </div>
            </DetailSection>
          )}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <StickyBookingWidget product={product} retailMarginPct={tenant ? 0 : 22} cartProductId={id} />
          {config && <div className="mt-3 hidden lg:block"><WhatsAppLink number={config.footer.whatsapp} title={product.title} /></div>}
        </aside>
      </div>
    </div>
  );
}
