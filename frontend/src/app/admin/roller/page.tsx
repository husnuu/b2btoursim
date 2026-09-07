import { ROLE_TEMPLATES } from "@/data/mock";
import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { AdminTable, AdminRow, Cell } from "@/components/admin/AdminTable";

/** Rol ve izin şablonları — Sitemap Bölüm 1 (MVP), TDD Bölüm 7 RBAC. */
const ROLE: Record<string, MessageKey> = {
  platform_admin: "role.platform_admin",
  agency_admin: "role.agency_admin",
  sales: "role.sales",
  accounting: "role.accounting",
};

export default function RollerPage() {
  return (
    <>
      <h1 className="text-xl font-medium text-ink">{t("admin.roles.title")}</h1>
      <p className="mt-2 max-w-[70ch] text-ink-2">{t("admin.roles.lead")}</p>

      <div className="mt-5 max-w-4xl">
        <AdminTable
          columns={[
            { key: "role", label: t("admin.roles.col.role"), width: "w-56" },
            { key: "scopes", label: t("admin.roles.col.scopes") },
          ]}
        >
          {ROLE_TEMPLATES.map((r) => (
            <AdminRow key={r.role}>
              <Cell>{t(ROLE[r.role])}</Cell>
              <Cell>
                <span className="flex flex-wrap gap-1.5 py-1">
                  {r.scopes.map((sc) => (
                    <code
                      key={sc}
                      className="rounded-[2px] border border-line bg-sunken px-1.5 text-[length:var(--font-ui-xs)] text-ink-2"
                    >
                      {sc}
                    </code>
                  ))}
                </span>
              </Cell>
            </AdminRow>
          ))}
        </AdminTable>
      </div>
    </>
  );
}
