import { ROLE_TEMPLATES } from "@/data/mock";
import { formatDate, t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";
import { headers } from "next/headers";
import { BRAND_PALETTE } from "@/lib/theme";
import { InviteUserForm } from "@/components/extranet/InviteUserForm";
import { RoleSelect } from "@/components/extranet/RoleSelect";
import { StorefrontProfileForm } from "@/components/extranet/StorefrontProfileForm";

/**
 * Kullanıcı listesi ve rol atama — Sitemap Bölüm 2, /settings/users (MVP).
 *
 * İlk gerçek veri ekranı: liste `app_user` tablosundan, RLS kiracıyı
 * süzer. Davet formu yalnız acente yöneticisine görünür; eylem de
 * sunucuda aynı kuralı uygular (görünürlük yetki değildir).
 */
const ROLE: Record<string, MessageKey> = {
  platform_admin: "role.platform_admin",
  agency_admin: "role.agency_admin",
  sales: "role.sales",
  accounting: "role.accounting",
};
const USTATUS: Record<string, MessageKey> = {
  active: "userStatus.active",
  invited: "userStatus.invited",
  disabled: "userStatus.disabled",
};

export default async function AyarlarPage() {
  const current = await getCurrentUser();
  const canInvite =
    current.state === "ready" &&
    (current.user.role === "agency_admin" || current.user.role === "platform_admin");

  const supabase = await createClient();

  // Vitrin bilgileri: kiracının profili + markası. Adres, bulunduğumuz
  // host'tan türetilir (geliştirmede slug.localhost:port).
  // Platform yöneticisi tüm kiracıları görür; bu yüzden kiracı süzgeci şart.
  const tenantId = current.state === "ready" ? current.user.tenantId : "";
  const [{ data: tenantRow }, { data: profileRow }, { data: brandingRow }] = await Promise.all([
    supabase.from("tenant").select("slug").eq("id", tenantId).maybeSingle(),
    supabase.from("tenant_profile").select("about, contact_email, contact_phone, phone_hours, address, tursab_no").eq("tenant_id", tenantId).maybeSingle(),
    supabase.from("tenant_branding").select("brand_color").eq("tenant_id", tenantId).maybeSingle(),
  ]);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const port = host.includes(":") ? `:${host.split(":")[1]}` : "";
  const storefrontUrl = tenantRow
    ? root
      ? `https://${tenantRow.slug}.${root}`
      : `http://${tenantRow.slug}.localhost${port}`
    : "";
  const brandId =
    BRAND_PALETTE.find((b) => b.hex.toLowerCase() === (brandingRow?.brand_color ?? "").toLowerCase())?.id ??
    BRAND_PALETTE[0].id;

  const { data: users } = await supabase
    .from("app_user")
    .select("id, full_name, email, role, status, last_seen_at")
    .order("full_name");

  return (
    <div className="mx-auto w-full max-w-[76rem] px-[var(--pad-x)] py-6">
      <h1 className="text-xl font-medium text-ink">{t("users.title")}</h1>

      {canInvite && storefrontUrl && (
        <section className="mt-6">
          <h2 className="mb-3 font-dense text-base font-medium text-ink">{t("storefront.title")}</h2>
          <StorefrontProfileForm
            siteUrl={storefrontUrl}
            initial={{
              about: profileRow?.about ?? "",
              contactEmail: profileRow?.contact_email ?? "",
              contactPhone: profileRow?.contact_phone ?? "",
              phoneHours: profileRow?.phone_hours ?? "",
              address: profileRow?.address ?? "",
              tursabNo: profileRow?.tursab_no ?? "",
              brandId,
            }}
          />
        </section>
      )}

      {canInvite && (
        <section className="mt-8">
          <h2 className="font-dense text-base font-medium text-ink">{t("users.invite.title")}</h2>
          <p className="mb-3 mt-1 max-w-[62ch] text-[length:var(--font-ui-sm)] text-ink-2">
            {t("users.invite.lead")}
          </p>
          <InviteUserForm />
        </section>
      )}

      <table className="mt-6 w-full border-collapse font-dense">
        <thead>
          <tr className="border-b border-line-strong text-[length:var(--font-ui-xs)] text-ink-3">
            <th scope="col" className="w-48 py-1.5 text-start font-normal">{t("users.col.name")}</th>
            <th scope="col" className="px-2 py-1.5 text-start font-normal">{t("users.col.email")}</th>
            <th scope="col" className="w-56 px-2 py-1.5 text-start font-normal">{t("users.col.role")}</th>
            <th scope="col" className="w-32 px-2 py-1.5 text-start font-normal">{t("users.col.status")}</th>
            <th scope="col" className="w-44 py-1.5 text-end font-normal">{t("users.col.lastSeen")}</th>
          </tr>
        </thead>
        <tbody>
          {(users ?? []).map((u) => (
            <tr key={u.id} className="h-[var(--row-h)] border-b border-line hover:bg-action-tint">
              <td className="text-[length:var(--font-ui)] text-ink">{u.full_name}</td>
              <td className="truncate px-2 text-[length:var(--font-ui-sm)] text-ink-2">{u.email}</td>
              <td className="px-2">
                {u.role === "platform_admin" || !canInvite ? (
                  <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t(ROLE[u.role])}</span>
                ) : (
                  <RoleSelect userId={u.id} role={u.role as UserRole} name={u.full_name} />
                )}
              </td>
              <td className="px-2">
                <span
                  className={`text-[length:var(--font-ui-sm)] ${
                    u.status === "active"
                      ? "text-success"
                      : u.status === "invited"
                        ? "text-warning"
                        : "text-ink-3"
                  }`}
                >
                  {t(USTATUS[u.status])}
                </span>
              </td>
              <td className="tnum text-end text-[length:var(--font-ui-sm)] text-ink-2">
                {u.last_seen_at ? formatDate(u.last_seen_at) : t("users.never")}
              </td>
            </tr>
          ))}
          {(users ?? []).length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-[length:var(--font-ui-sm)] text-ink-3">
                {t("users.empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <section className="mt-10">
        <h2 className="mb-2 font-dense text-base font-medium text-ink">
          {t("admin.roles.title")}
        </h2>
        <p className="mb-3 max-w-[62ch] text-ink-2">{t("admin.roles.lead")}</p>
        <ul className="border-t border-line font-dense">
          {ROLE_TEMPLATES.filter((r) => r.role !== "platform_admin").map((r) => (
            <li
              key={r.role}
              className="grid gap-1 border-b border-line py-2.5 sm:grid-cols-[12rem_1fr] sm:gap-6"
            >
              <span className="text-[length:var(--font-ui)] text-ink">{t(ROLE[r.role])}</span>
              <span className="flex flex-wrap gap-1.5">
                {r.scopes.map((sc) => (
                  <code
                    key={sc}
                    className="rounded-[2px] border border-line bg-sunken px-1.5 text-[length:var(--font-ui-xs)] text-ink-2"
                  >
                    {sc}
                  </code>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
