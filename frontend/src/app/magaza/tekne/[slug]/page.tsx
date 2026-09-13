import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatMoney, t } from "@/lib/i18n";
import { getPublishedSite } from "@/lib/site/load";
import { getBoatDetail } from "@/lib/storefront/details";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { Breadcrumb, CancellationTable, Chips, DetailSection, GalleryGrid, IncludeList, SpecList, WhatsAppLink } from "@/components/b2c/detail/DetailShell";
import { RequestForm } from "@/components/b2c/detail/RequestForm";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getStorefrontTenant();
  const boat = tenant ? await getBoatDetail(tenant.id, slug) : null;
  return { title: boat ? `${boat.title} — ${tenant?.name}` : "Tekne" };
}

export default async function TekneDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getStorefrontTenant();
  if (!tenant) notFound();
  const [boat, config] = await Promise.all([getBoatDetail(tenant.id, slug), getPublishedSite(tenant.id)]);
  if (!boat) notFound();

  const section = config.sections.find((s) => s.kind === "boats");
  const unitLabel = boat.pricingModel === "saatlik" ? t("b2c.unit.perHour") : boat.pricingModel === "cokGunlu" ? (boat.multidayUnit === "gun" ? t("b2c.unit.perDay") : t("b2c.unit.perNight")) : t("b2c.unit.perPerson");
  const unitPrice = boat.pricingModel === "saatlik" ? boat.hourlyRate : boat.pricingModel === "cokGunlu" ? boat.multidayUnitPrice : boat.perPersonPrice;
  const captainShared = { captainFee: boat.captainFee, captainUnit: boat.captainFeeUnit, captainOption: boat.captainOption } as const;
  const pricing =
    boat.pricingModel === "saatlik"
      ? { model: "hourly" as const, rate: boat.hourlyRate ?? 0, minHours: boat.minRentalHours, tiers: boat.tiers, ...captainShared }
      : boat.pricingModel === "cokGunlu"
        ? { model: "multiday" as const, unitPrice: boat.multidayUnitPrice ?? 0, minUnits: boat.multidayMin ?? 1, ...captainShared }
        : { model: "perPerson" as const, price: boat.perPersonPrice ?? 0, minGroup: boat.perPersonMinGroup ?? 1, ...captainShared };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">
      <Breadcrumb items={[{ label: section?.title ?? "Tekne kiralama", href: "/magaza/tekneler" }, { label: boat.title }]} />
      <h1 className="mt-3 max-w-[22ch] font-dense text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-[1.02] tracking-[-0.01em] text-ink">{boat.title}</h1>
      <Chips items={[boat.brandModel, `${boat.legalCapacity} kişi`, boat.cabinCount ? `${boat.cabinCount} kabin` : null, boat.lengthMeters ? `${boat.lengthMeters} m` : null, boat.marina?.name, boat.captainOption === "kaptanli" ? "Kaptanlı" : boat.captainOption === "kaptansiz" ? "Kaptansız" : "Kaptanlı / kaptansız"]} />
      <GalleryGrid gallery={boat.gallery} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_24rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {boat.description && <p className="max-w-[68ch] whitespace-pre-line text-[length:calc(var(--font-ui)*1.1)] leading-relaxed text-ink-2">{boat.description}</p>}

          <DetailSection title={t("b2c.detail.pricing")}>
            <SpecList items={[
              [`${unitLabel} başı`, unitPrice ? formatMoney(unitPrice, boat.currency) : null],
              [t("b2c.detail.captain"), boat.captainFee ? `${formatMoney(boat.captainFee, boat.currency)} / ${boat.captainFeeUnit === "saatlik" ? t("b2c.unit.perHour") : t("b2c.unit.perDay")}` : boat.captainOption === "kaptansiz" ? "Yok" : "Dahil"],
              ["Asgari süre", boat.pricingModel === "saatlik" ? `${boat.minRentalHours} saat` : boat.pricingModel === "cokGunlu" ? `${boat.multidayMin ?? 1} ${unitLabel}` : `${boat.perPersonMinGroup ?? 1} kişi`],
              [t("b2c.detail.deposit"), boat.securityDeposit ? formatMoney(boat.securityDeposit, boat.currency) : null],
              ["Yakıt", boat.fuelIncluded ? "Dahil" : "Hariç"],
            ]} />
            {boat.tiers.length > 0 && (
              <ul className="mt-3 text-[length:var(--font-ui-sm)]">
                {boat.tiers.map((x) => <li key={x.afterHours} className="tnum">{x.afterHours} saatten sonra %{x.discountPct} indirim</li>)}
              </ul>
            )}
          </DetailSection>

          <DetailSection title={t("b2c.detail.specs")}>
            <SpecList items={[["Marka / model", boat.brandModel], ["Yapım yılı", boat.buildYear], ["Boy", boat.lengthMeters ? `${boat.lengthMeters} m` : null], ["Motor", boat.engineInfo], ["Kabin", boat.cabinCount], ["Yatak", boat.bedCount], ["Yasal kapasite", boat.legalCapacity]]} />
          </DetailSection>

          {boat.features.length > 0 && <DetailSection title={t("b2c.detail.features")}><Chips items={boat.features} /></DetailSection>}
          {(boat.includes.length > 0 || boat.excludes.length > 0) && <DetailSection title={t("product.includes")}><IncludeList includes={boat.includes} excludes={boat.excludes} /></DetailSection>}
          <DetailSection title={t("b2c.detail.safety")}>
            <SpecList items={[["Can yeleği", boat.safety.lifejackets], ["Can salı", boat.safety.lifeRaft ? "Var" : "Yok"], ["Yangın söndürücü", boat.safety.fireExtinguisher ? "Var" : "Yok"]]} />
            {boat.safety.notes && <p className="mt-2">{boat.safety.notes}</p>}
          </DetailSection>
          {boat.whatToBring && <DetailSection title={t("b2c.detail.whatToBring")}><p className="whitespace-pre-line">{boat.whatToBring}</p></DetailSection>}
          {boat.marina && <DetailSection title={t("b2c.detail.location")}><p>{boat.marina.name} — {boat.marina.address}</p></DetailSection>}
          <DetailSection title={t("b2c.detail.cancellation")}>
            <CancellationTable template={boat.cancellation?.template ?? null} cutoffs={boat.cancellation?.cutoffs ?? []} />
            {boat.weatherCancellation && <p className="mt-2 text-ink-3">Hava koşulları nedeniyle iptalde ücret iade edilir.</p>}
          </DetailSection>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <RequestForm kind="boat" refKey={boat.slug} title={boat.title} currency={boat.currency} pricing={pricing} />
          <div className="mt-3"><WhatsAppLink number={config.footer.whatsapp} title={boat.title} /></div>
        </aside>
      </div>
    </div>
  );
}
