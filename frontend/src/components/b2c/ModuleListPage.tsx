import { notFound } from "next/navigation";
import { t } from "@/lib/i18n";
import type { SectionKind } from "@/lib/site/config";
import { getPublishedSite, getStorefrontData } from "@/lib/site/load";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { Breadcrumb } from "./detail/DetailShell";
import { ModuleGrid } from "./StorefrontHome";
import { EmptyState } from "@/components/primitives/States";

/**
 * Modül liste sayfası (Tekneler, Villalar, Transferler, Vize):
 * breadcrumb + bölüm başlığı/alt metni (site tasarımından) + tüm kartlar.
 * Referans siteden: kategori sayfası = başlık + açıklama + kartlar.
 */
export async function ModuleListPage({ kind, fallbackTitle }: { kind: Exclude<SectionKind, "tours" | "hero" | "departures" | "about" | "faq" | "contact" | "custom">; fallbackTitle: string }) {
  const tenant = await getStorefrontTenant();
  if (!tenant) notFound();
  const config = await getPublishedSite(tenant.id);
  const section = config.sections.find((s) => s.kind === kind);
  const data = await getStorefrontData(tenant.id, { ...config, sections: [{ ...(section ?? { id: kind, kind, title: fallbackTitle, lead: "", limit: 24, body: "" }), enabled: true }] });
  const items = data.modules[kind] ?? [];
  const title = section?.title ?? fallbackTitle;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">
      <Breadcrumb items={[{ label: title }]} />
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
        <div>
          <h1 className="font-dense text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-tight text-ink">{title}</h1>
          {section?.lead && <p className="mt-1 max-w-[60ch] text-ink-2">{section.lead}</p>}
        </div>
        <span className="tnum text-[length:var(--font-ui-sm)] text-ink-3">{t("b2c.list.count", { count: items.length })}</span>
      </div>
      <div className="mt-8">
        {items.length === 0 ? <EmptyState title={t("b2c.emptyTitle")} body={t("b2c.emptyLead")} /> : <ModuleGrid items={items} />}
      </div>
    </div>
  );
}
