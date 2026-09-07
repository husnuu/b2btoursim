import { TENANTS } from "@/data/mock";
import { t } from "@/lib/i18n";
import { ButtonLink } from "@/components/primitives/Button";
import { TenantFilters } from "@/components/admin/TenantFilters";

/** Kiracı listesi — Sitemap Bölüm 1, /admin/tenants (MVP). */
export default function KiracilarPage() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-medium text-ink">{t("admin.tenants.title")}</h1>
        <ButtonLink href="/admin/kiracilar/yeni" variant="primary">
          {t("admin.tenants.new")}
        </ButtonLink>
      </div>

      <TenantFilters tenants={TENANTS} />
    </>
  );
}
