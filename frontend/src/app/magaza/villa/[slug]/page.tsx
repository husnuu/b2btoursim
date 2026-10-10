import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatMoney, t } from "@/lib/i18n";
import { getPublishedSite } from "@/lib/site/load";
import { getVillaDetail } from "@/lib/storefront/details";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { Breadcrumb, KindPill, CancellationTable, Chips, DetailSection, SpecList, WhatsAppLink } from "@/components/b2c/detail/DetailShell";
import { RequestForm } from "@/components/b2c/detail/RequestForm";
import { Gallery } from "@/components/b2c/Gallery";
import { SectionNav } from "@/components/b2c/SectionNav";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getStorefrontTenant();
  const villa = tenant ? await getVillaDetail(tenant.id, slug) : null;
  return { title: villa ? `${villa.title} — ${tenant?.name}` : "Villa" };
}

export default async function VillaDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getStorefrontTenant();
  if (!tenant) notFound();
  const [villa, config] = await Promise.all([getVillaDetail(tenant.id, slug), getPublishedSite(tenant.id)]);
  if (!villa) notFound();
  const section = config.sections.find((s) => s.kind === "villas");

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-4 sm:pt-6">
      <div className="mb-8"><Gallery gallery={villa.gallery} title={villa.title} /></div>
      <Breadcrumb items={[{ label: section?.title ?? "Villalar", href: "/magaza/villalar" }, { label: villa.title }]} />
      <div className="mt-5"><KindPill>{t("b2c.kind.villa")}</KindPill></div>
      <h1 className="mt-4 text-[2rem] leading-[1.12] font-extrabold tracking-tight text-ink sm:text-[2.7rem]">{villa.title}</h1>
      <Chips items={[[villa.district, villa.province].filter(Boolean).join(", "), `${villa.capacity} kişi`, `En az ${villa.minNights} gece`, villa.petsAllowed ? "Evcil hayvan kabul" : null, ...villa.regions]} />
      <div className="mt-10">
      <SectionNav sections={[
        { id: "fiyat", label: t("b2c.detail.pricing") },
        ...(villa.features.length ? [{ id: "donanim", label: t("b2c.detail.features") }] : []),
        ...(villa.poi.length ? [{ id: "mesafeler", label: t("b2c.detail.distances") }] : []),
        { id: "iptal", label: t("b2c.detail.cancellation") },
      ]} />

      </div>
<div className="mt-8 grid gap-12 lg:grid-cols-[1fr_400px] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-6">
          {villa.description && <p className="max-w-[68ch] whitespace-pre-line text-lg leading-relaxed text-ink-2">{villa.description}</p>}
          <DetailSection id="fiyat" title={t("b2c.detail.pricing")}>
            <SpecList items={[[`${t("b2c.unit.perNight")} başı`, formatMoney(villa.nightlyRate, villa.currency)], ["Giriş", villa.checkIn], ["Çıkış", villa.checkOut], ["Asgari konaklama", `${villa.minNights} gece`]]} />
          </DetailSection>
          {villa.features.length > 0 && <DetailSection id="donanim" title={t("b2c.detail.features")}><Chips items={villa.features} /></DetailSection>}
          {villa.poi.length > 0 && (
            <DetailSection id="mesafeler" title={t("b2c.detail.distances")}>
              <SpecList items={villa.poi.map((p) => [p.label, `${p.distance} ${p.unit}`] as [string, string])} />
            </DetailSection>
          )}
          <DetailSection id="iptal" title={t("b2c.detail.cancellation")}>
            <CancellationTable template={villa.cancellation?.template ?? null} cutoffs={villa.cancellation?.cutoffs ?? []} />
          </DetailSection>
          {villa.tursabLicense && <p className="text-[length:var(--font-ui-sm)] text-ink-3">Turizm işletme belgesi: {villa.tursabLicense}</p>}
        </div>
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <RequestForm kind="villa" refKey={villa.slug} title={villa.title} currency={villa.currency} pricing={{ model: "nightly", rate: villa.nightlyRate, minNights: villa.minNights, capacity: villa.capacity }} />
          <div className="mt-3"><WhatsAppLink number={config.footer.whatsapp} title={villa.title} /></div>
        </aside>
      </div>
    </div>
  );
}
