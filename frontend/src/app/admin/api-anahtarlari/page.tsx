import { SUPPLIERS, TENANTS } from "@/data/mock";
import { formatDate, t } from "@/lib/i18n";
import { AdminTable, AdminRow, Cell } from "@/components/admin/AdminTable";
import { Button } from "@/components/primitives/Button";

/**
 * API kimlik bilgileri — Sitemap Bölüm 1 (MVP).
 *
 * TDD Bölüm 7: anahtarın kendisi veritabanında tutulmaz, yalnızca secrets
 * manager referansı. Bu ekran o kuralı görünür kılıyor — listede değer
 * kolonu yok, "değeri göster" ayrı bir yetki isteyen eylem.
 */
const ROWS = SUPPLIERS.flatMap((s) =>
  (["sandbox", "production"] as const).map((env) => ({
    id: `${s.id}-${env}`,
    supplier: s,
    env,
    ref: `${s.credentialsRef}/${env}`,
    rotatedAt: env === "production" ? "2026-07-14T09:00:00.000Z" : "2026-02-02T09:00:00.000Z",
    tenants: env === "production" ? TENANTS.filter((x) => x.status === "active").length : 0,
  })),
);

export default function ApiAnahtarlariPage() {
  return (
    <>
      <h1 className="text-xl font-medium text-ink">{t("admin.apiKeys.title")}</h1>
      <p className="mt-2 max-w-[70ch] text-ink-2">{t("admin.apiKeys.lead")}</p>

      <div className="mt-5">
        <AdminTable
          columns={[
            { key: "supplier", label: t("admin.suppliers.col.name"), width: "w-56" },
            { key: "env", label: t("admin.apiKeys.col.env"), width: "w-32" },
            { key: "ref", label: t("admin.apiKeys.col.ref") },
            { key: "tenants", label: t("admin.tenants.title"), align: "end", width: "w-28" },
            { key: "rotated", label: t("admin.apiKeys.col.rotated"), align: "end", width: "w-32" },
            { key: "act", label: "", align: "end", width: "w-56" },
          ]}
        >
          {ROWS.map((r) => (
            <AdminRow key={r.id}>
              <Cell>{r.supplier.name}</Cell>
              <Cell>
                <span
                  className={`rounded-[2px] border px-1.5 text-[length:var(--font-ui-xs)] ${
                    r.env === "production"
                      ? "border-danger/30 bg-danger-tint text-danger"
                      : "border-line-strong bg-sunken text-ink-2"
                  }`}
                >
                  {r.env}
                </span>
              </Cell>
              <Cell tone="muted">
                <code className="rounded-[2px] border border-line bg-sunken px-1.5 text-[length:var(--font-ui-xs)]">
                  {r.ref}
                </code>
              </Cell>
              <Cell align="end" className="tnum">{r.tenants || "—"}</Cell>
              <Cell align="end" tone="muted" className="tnum">{formatDate(r.rotatedAt)}</Cell>
              <Cell align="end">
                <span className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost">{t("admin.apiKeys.reveal")}</Button>
                  <Button size="sm">{t("admin.apiKeys.rotate")}</Button>
                </span>
              </Cell>
            </AdminRow>
          ))}
        </AdminTable>
      </div>
    </>
  );
}
