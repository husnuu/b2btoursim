import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth/current-user";
import { t } from "@/lib/i18n";
import { getDraftSite, getStorefrontData } from "@/lib/site/load";
import { getStorefrontProfile } from "@/lib/storefront/profile";
import { createClient } from "@/lib/supabase/server";
import { SiteEditor } from "@/components/extranet/site/SiteEditor";

/**
 * Site tasarımı — acentenin müşteri sitesini kendisinin düzenlediği yer.
 * Sol: bölümler ve karakter. Sağ: taslağın canlı önizlemesi (iframe).
 */
export default async function SitePage() {
  const current = await getCurrentUser();
  if (current.state !== "ready") return null;
  const { tenantId, role } = current.user;
  const canEdit = role === "agency_admin" || role === "platform_admin";

  const supabase = await createClient();
  const [{ draft, publishedAt }, profile, { data: tenantRow }] = await Promise.all([
    getDraftSite(tenantId),
    getStorefrontProfile(tenantId),
    supabase.from("tenant").select("slug").eq("id", tenantId).maybeSingle(),
  ]);
  // Hangi bölümlerin içeriği var: editör "boş — gizlenir" etiketini basar.
  const data = await getStorefrontData(tenantId, { ...draft, sections: draft.sections.map((s) => ({ ...s, enabled: true })) });
  const content = {
    tours: data.tours.length,
    departures: data.tours.filter((r) => r.startsAt).length,
    transfers: data.modules.transfers?.length ?? 0,
    boats: data.modules.boats?.length ?? 0,
    villas: data.modules.villas?.length ?? 0,
    visa: data.modules.visa?.length ?? 0,
    about: profile.about.trim() ? 1 : 0,
    contact: profile.contactPhone || profile.contactEmail || profile.address ? 1 : 0,
  };

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const port = host.includes(":") ? `:${host.split(":")[1]}` : "";
  const liveUrl = tenantRow ? (root ? `https://${tenantRow.slug}.${root}` : `http://${tenantRow.slug}.localhost${port}`) : "";

  if (!canEdit) {
    return (
      <div className="mx-auto w-full max-w-[76rem] px-[var(--pad-x)] py-6">
        <h1 className="text-xl font-medium text-ink">{t("site.title")}</h1>
        <p className="mt-2 text-ink-2">{t("site.forbidden")}</p>
      </div>
    );
  }

  return <SiteEditor initial={draft} publishedAt={publishedAt} content={content} liveUrl={liveUrl} />;
}
