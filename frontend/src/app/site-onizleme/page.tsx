import type { Metadata } from "next";
import { getSessionState } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getVitrinData } from "@/lib/storefront/vitrin-data";
import { VitrinHome } from "@/components/vitrin/VitrinHome";
import { VitrinShell } from "@/components/vitrin/VitrinShell";

export const metadata: Metadata = { title: "Önizleme", robots: { index: false } };

/**
 * Editörün önizlemesi. Kiracı OTURUMDAN gelir (adresten değil): aynı
 * origin'de kaldığı için iframe çerezi görür. Seyyah vitrinini acentenin
 * yayınlanmış ilanlarıyla gösterir.
 */
export default async function SiteOnizlemePage() {
  const session = await getSessionState();
  if (session.kind !== "ready") return null;
  const { tenantId } = session.claims;

  const supabase = await createClient();
  const { data: tenant } = await supabase.from("tenant").select("name").eq("id", tenantId).maybeSingle();
  const data = await getVitrinData({ id: tenantId, name: tenant?.name ?? "" });

  return (
    <VitrinShell data={data}>
      <VitrinHome data={data} />
    </VitrinShell>
  );
}
