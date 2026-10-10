import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatMoney, t } from "@/lib/i18n";
import { getPublishedSite } from "@/lib/site/load";
import { getVehicleDetail } from "@/lib/storefront/details";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { Breadcrumb, KindPill, Chips, DetailSection, SpecList, WhatsAppLink } from "@/components/b2c/detail/DetailShell";
import { RequestForm } from "@/components/b2c/detail/RequestForm";
import { Gallery } from "@/components/b2c/Gallery";
import { SectionNav } from "@/components/b2c/SectionNav";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getStorefrontTenant();
  const v = tenant ? await getVehicleDetail(tenant.id, id) : null;
  return { title: v ? `${v.title} — ${tenant?.name}` : "Transfer" };
}

export default async function TransferDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getStorefrontTenant();
  if (!tenant) notFound();
  const [v, config] = await Promise.all([getVehicleDetail(tenant.id, id), getPublishedSite(tenant.id)]);
  if (!v) notFound();
  const section = config.sections.find((s) => s.kind === "transfers");
  const hourly = v.pricingModel === "saatlikKiralama" && v.hourlyRate;

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-4 sm:pt-6">
      <div className="mb-8"><Gallery gallery={v.gallery} title={v.title} /></div>
      <Breadcrumb items={[{ label: section?.title ?? "Transferler", href: "/magaza/transferler" }, { label: v.title }]} />
      <div className="mt-5"><KindPill>{t("b2c.kind.transfer")}</KindPill></div>
      <h1 className="mt-4 text-[2rem] leading-[1.12] font-extrabold tracking-tight text-ink sm:text-[2.7rem]">{v.title}</h1>
      <Chips items={[v.vehicleType === "shuttle" ? "Paylaşımlı" : "Özel araç", `${v.seats} koltuk`, `${v.luggage} bavul`, hourly ? "Saatlik kiralama" : "Noktadan noktaya"]} />
      <div className="mt-10">
      <SectionNav sections={[
        { id: "fiyat", label: t("b2c.detail.pricing") },
        ...(v.features.length ? [{ id: "donanim", label: t("b2c.detail.features") }] : []),
      ]} />
      </div>
<div className="mt-8 grid gap-12 lg:grid-cols-[1fr_400px] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-6">
          {v.description && <p className="max-w-[68ch] whitespace-pre-line text-lg leading-relaxed text-ink-2">{v.description}</p>}
          <DetailSection id="fiyat" title={t("b2c.detail.pricing")}>
            <SpecList items={[[`${t("b2c.unit.perHour")} başı`, hourly ? formatMoney(v.hourlyRate!, v.currency) : t("b2c.request.quote")]]} />
          </DetailSection>
          {v.features.length > 0 && <DetailSection id="donanim" title={t("b2c.detail.features")}><Chips items={v.features} /></DetailSection>}
        </div>
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <RequestForm kind="transfer" refKey={v.id} title={v.title} currency={v.currency} pricing={hourly ? { model: "transferHourly", rate: v.hourlyRate!, seats: v.seats } : { model: "transferQuote", seats: v.seats }} />
          <div className="mt-3"><WhatsAppLink number={config.footer.whatsapp} title={v.title} /></div>
        </aside>
      </div>
    </div>
  );
}
