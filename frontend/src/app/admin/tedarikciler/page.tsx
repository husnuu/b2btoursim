import { listSuppliers } from "@/lib/admin/load";
import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { AdminTable, AdminRow, Cell } from "@/components/admin/AdminTable";
import { SupplierStatusButton } from "@/components/admin/SupplierStatusButton";
import { SupplierMark } from "@/components/primitives/SupplierMark";
import { EmptyState } from "@/components/primitives/States";

/**
 * Tedarikçi adaptör kayıtları — Sitemap Bölüm 1 (MVP).
 *
 * Sağlık metrikleri (uptime/yanıt/hata) Faz 2'de ayrı bir izleme paneline
 * çıkacak; kayıt listesinde özet olarak duruyorlar çünkü bir adaptörü
 * devre dışı bırakma kararı bu sayılara bakılarak veriliyor.
 */
const ADAPTER: Record<string, MessageKey> = {
  gds: "adapter.gds",
  ndc: "adapter.ndc",
  bedbank: "adapter.bedbank",
  own_contracted: "adapter.own_contracted",
  payment: "adapter.payment",
  tax: "adapter.tax",
  marketplace: "adapter.marketplace",
};
const STATUS: Record<string, { label: MessageKey; cls: string; glyph: string }> = {
  sandbox: { label: "supplierStatus.sandbox", cls: "text-info", glyph: "◔" },
  active: { label: "supplierStatus.active", cls: "text-success", glyph: "✓" },
  degraded: { label: "supplierStatus.degraded", cls: "text-warning", glyph: "!" },
  disabled: { label: "supplierStatus.disabled", cls: "text-ink-3", glyph: "✕" },
};

export default async function TedarikcilerPage() {
  const SUPPLIERS = await listSuppliers();
  return (
    <>
      <h1 className="text-xl font-medium text-ink">{t("admin.suppliers.title")}</h1>
      {SUPPLIERS.length === 0 && <div className="mt-5"><EmptyState title={t("admin.suppliers.title")} body="Henüz tedarikçi adaptörü tanımlı değil; ilk adaptör bağlandığında burada listelenir." /></div>}

      <div className="mt-5">
        <AdminTable
          columns={[
            { key: "name", label: t("admin.suppliers.col.name") },
            { key: "type", label: t("admin.suppliers.col.type"), width: "w-36" },
            { key: "status", label: t("admin.suppliers.col.status"), width: "w-32" },
            { key: "uptime", label: t("admin.suppliers.col.uptime"), align: "end", width: "w-28" },
            { key: "latency", label: t("admin.suppliers.col.latency"), align: "end", width: "w-32" },
            { key: "err", label: t("admin.suppliers.col.errors"), align: "end", width: "w-28" },
            { key: "cred", label: t("admin.suppliers.col.credentials"), width: "w-64" },
            { key: "act", label: "", align: "end", width: "w-24" },
          ]}
        >
          {SUPPLIERS.map((s) => {
            const st = STATUS[s.status];
            return (
              <AdminRow key={s.id}>
                <Cell>
                  <span className="flex items-center gap-2">
                    <SupplierMark supplier={s} />
                    {s.name}
                  </span>
                </Cell>
                <Cell tone="muted">{ADAPTER[s.adapterType] ? t(ADAPTER[s.adapterType]) : s.adapterType}</Cell>
                <Cell>
                  <span className={`flex items-center gap-1.5 text-[length:var(--font-ui-sm)] ${st.cls}`}>
                    <span aria-hidden="true">{st.glyph}</span>
                    {t(st.label)}
                  </span>
                </Cell>
                <Cell align="end" className={`tnum ${s.uptimePct < 99 ? "text-warning" : "text-ink-2"}`}>
                  %{s.uptimePct.toFixed(2)}
                </Cell>
                <Cell align="end" className={`tnum ${s.avgLatencyMs > 5000 ? "text-warning" : "text-ink-2"}`}>
                  {s.avgLatencyMs} ms
                </Cell>
                <Cell align="end" className={`tnum ${s.errorRatePct > 5 ? "text-danger" : "text-ink-2"}`}>
                  %{s.errorRatePct.toFixed(1)}
                </Cell>
                <Cell tone="muted">
                  <code className="rounded-[2px] border border-line bg-sunken px-1.5 text-[length:var(--font-ui-xs)]">
                    {s.credentialsRef || "—"}
                  </code>
                </Cell>
                <Cell align="end">
                  <SupplierStatusButton id={s.id} status={s.status} />
                </Cell>
              </AdminRow>
            );
          })}
        </AdminTable>
      </div>
    </>
  );
}
