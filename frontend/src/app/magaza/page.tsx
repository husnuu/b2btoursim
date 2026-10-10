import type { Metadata } from "next";
import { getPublishedSite } from "@/lib/site/load";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { getVitrinData } from "@/lib/storefront/vitrin-data";
import { VitrinHome } from "@/components/vitrin/VitrinHome";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getStorefrontTenant();
  if (!tenant) return { title: "Acente vitrini (önizleme)", robots: { index: false } };
  const config = await getPublishedSite(tenant.id);
  return { title: config.seo.title || tenant.name, description: config.seo.description || undefined };
}

export default async function MagazaPage() {
  const tenant = await getStorefrontTenant();
  const data = await getVitrinData(tenant ? { id: tenant.id, name: tenant.name } : null);
  return <VitrinHome data={data} />;
}
