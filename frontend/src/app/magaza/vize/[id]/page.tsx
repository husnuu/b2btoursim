import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatMoney, t } from "@/lib/i18n";
import { getPublishedSite } from "@/lib/site/load";
import { getVisaDetail } from "@/lib/storefront/details";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { Breadcrumb, KindPill, Chips, DetailSection, SpecList, WhatsAppLink } from "@/components/b2c/detail/DetailShell";
import { RequestForm } from "@/components/b2c/detail/RequestForm";
import { SectionNav } from "@/components/b2c/SectionNav";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getStorefrontTenant();
  const v = tenant ? await getVisaDetail(tenant.id, id) : null;
  return { title: v ? `${v.title} — ${tenant?.name}` : "Vize" };
}

export default async function VizeDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getStorefrontTenant();
  if (!tenant) notFound();
  const [v, config] = await Promise.all([getVisaDetail(tenant.id, id), getPublishedSite(tenant.id)]);
  if (!v) notFound();
  const section = config.sections.find((s) => s.kind === "visa");

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-4 sm:pt-6">
      <Breadcrumb items={[{ label: section?.title ?? "Vize hizmetleri", href: "/magaza/vize" }, { label: v.title }]} />
      <div className="mt-5"><KindPill>{t("b2c.kind.vize")}</KindPill></div>
      <h1 className="mt-4 text-[2rem] leading-[1.12] font-extrabold tracking-tight text-ink sm:text-[2.7rem]">{v.title}</h1>
      <Chips items={[v.country, v.daysMin != null && v.daysMax != null ? t("b2c.detail.processing", { min: v.daysMin, max: v.daysMax }) : null]} />
      <div className="mt-10">
      <SectionNav sections={[{ id: "fiyat", label: t("b2c.detail.pricing") }, ...(v.documents.length ? [{ id: "belgeler", label: t("b2c.detail.documents") }] : [])]} />
      </div>
<div className="mt-8 grid gap-12 lg:grid-cols-[1fr_400px] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-6">
          {v.description && <p className="max-w-[68ch] whitespace-pre-line text-lg leading-relaxed text-ink-2">{v.description}</p>}
          <DetailSection id="fiyat" title={t("b2c.detail.pricing")}>
            <SpecList items={[[`${t("b2c.unit.perPerson")} başı`, formatMoney(v.price, v.currency)]]} />
          </DetailSection>
          {v.documents.length > 0 && (
            <DetailSection id="belgeler" title={t("b2c.detail.documents")}>
              <ul className="list-disc space-y-1 ps-5">{v.documents.map((d) => <li key={d}>{d}</li>)}</ul>
            </DetailSection>
          )}
        </div>
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <RequestForm kind="visa" refKey={v.id} title={v.title} currency={v.currency} pricing={{ model: "visa", price: v.price }} />
          <div className="mt-3"><WhatsAppLink number={config.footer.whatsapp} title={v.title} /></div>
        </aside>
      </div>
    </div>
  );
}
