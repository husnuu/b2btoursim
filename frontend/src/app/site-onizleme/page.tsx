import type { Metadata } from "next";
import { getSessionState } from "@/lib/auth/session";
import { getDraftSite, getStorefrontData } from "@/lib/site/load";
import { getStorefrontProfile } from "@/lib/storefront/profile";
import { createClient } from "@/lib/supabase/server";
import { StorefrontFrame } from "@/components/b2c/StorefrontFrame";
import { StorefrontHome, moduleNavLinks } from "@/components/b2c/StorefrontHome";

export const metadata: Metadata = { title: "Önizleme", robots: { index: false } };

/**
 * Editörün önizlemesi. Kiracı OTURUMDAN gelir (adresten değil): aynı
 * origin'de kaldığı için iframe çerezi görür, farklı alan adı sorunu
 * yaşanmaz. Taslağı gösterir; bağlantılar kapalı.
 */
export default async function SiteOnizlemePage() {
  const session = await getSessionState();
  if (session.kind !== "ready") return null;
  const { tenantId } = session.claims;

  const supabase = await createClient();
  const [{ data: tenant }, { draft }, profile] = await Promise.all([
    supabase.from("tenant").select("name").eq("id", tenantId).maybeSingle(),
    getDraftSite(tenantId),
    getStorefrontProfile(tenantId),
  ]);
  const data = await getStorefrontData(tenantId, draft);
  const name = tenant?.name ?? "";

  return (
    <StorefrontFrame name={name} config={draft} profile={profile} preview moduleLinks={moduleNavLinks(draft, data, profile)}>
      <StorefrontHome name={name} config={draft} data={data} profile={profile} preview />
    </StorefrontFrame>
  );
}
