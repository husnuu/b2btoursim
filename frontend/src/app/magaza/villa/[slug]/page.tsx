import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatMoney, t } from "@/lib/i18n";
import { getPublishedSite } from "@/lib/site/load";
import { getVillaDetail } from "@/lib/storefront/details";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { Breadcrumb, CancellationTable, Chips, DetailSection, GalleryGrid, SpecList, WhatsAppLink } from "@/components/b2c/detail/DetailShell";
import { RequestForm } from "@/components/b2c/detail/RequestForm";

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
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">
      <Breadcrumb items={[{ label: section?.title ?? "Villalar", href: "/magaza/villalar" }, { label: villa.title }]} />
      <h1 className="mt-3 max-w-[22ch] font-dense text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-[1.02] tracking-[-0.01em] text-ink">{villa.title}</h1>
      <Chips items={[[villa.district, villa.province].filter(Boolean).join(", "), `${villa.capacity} kişi`, `En az ${villa.minNights} gece`, villa.petsAllowed ? "Evcil hayvan kabul" : null, ...villa.regions]} />
      <GalleryGrid gallery={villa.gallery} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_24rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {villa.description && <p className="max-w-[68ch] whitespace-pre-line text-[length:calc(var(--font-ui)*1.1)] leading-relaxed text-ink-2">{villa.description}</p>}
          <DetailSection title={t("b2c.detail.pricing")}>
            <SpecList items={[[`${t("b2c.unit.perNight")} başı`, formatMoney(villa.nightlyRate, villa.currency)], ["Giriş", villa.checkIn], ["Çıkış", villa.checkOut], ["Asgari konaklama", `${villa.minNights} gece`]]} />
          </DetailSection>
          {villa.features.length > 0 && <DetailSection title={t("b2c.detail.features")}><Chips items={villa.features} /></DetailSection>}
          {villa.poi.length > 0 && (
            <DetailSection title={t("b2c.detail.distances")}>
              <SpecList items={villa.poi.map((p) => [p.label, `${p.distance} ${p.unit}`] as [string, string])} />
            </DetailSection>
          )}
          <DetailSection title={t("b2c.detail.cancellation")}>
            <CancellationTable template={villa.cancellation?.template ?? null} cutoffs={villa.cancellation?.cutoffs ?? []} />
          </DetailSection>
          {villa.tursabLicense && <p className="text-[length:var(--font-ui-sm)] text-ink-3">Turizm işletme belgesi: {villa.tursabLicense}</p>}
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <RequestForm kind="villa" refKey={villa.slug} title={villa.title} currency={villa.currency} pricing={{ model: "nightly", rate: villa.nightlyRate, minNights: villa.minNights, capacity: villa.capacity }} />
          <div className="mt-3"><WhatsAppLink number={config.footer.whatsapp} title={villa.title} /></div>
        </aside>
      </div>
    </div>
  );
}
