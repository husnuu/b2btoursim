import { PLANS } from "@/data/mock";
import { formatMoney, formatNumber, t } from "@/lib/i18n";
import { AdminTable, AdminRow, Cell } from "@/components/admin/AdminTable";

/** Plan ve paket tanımları — Sitemap Bölüm 1 (MVP). */
export default function PlanlarPage() {
  const q = (n: number) => (n < 0 ? t("admin.plans.unlimited") : formatNumber(n));

  return (
    <>
      <h1 className="text-xl font-medium text-ink">{t("admin.plans.title")}</h1>

      <div className="mt-5">
        <AdminTable
          columns={[
            { key: "name", label: t("admin.plans.col.name"), width: "w-32" },
            { key: "price", label: t("admin.plans.col.price"), align: "end", width: "w-36" },
            { key: "bookings", label: t("admin.plans.col.bookings"), align: "end", width: "w-40" },
            { key: "agencies", label: t("admin.plans.col.agencies"), align: "end", width: "w-32" },
            { key: "suppliers", label: t("admin.plans.col.suppliers"), align: "end", width: "w-32" },
            { key: "features", label: t("admin.tenant.features") },
            { key: "tenants", label: t("admin.plans.col.tenants"), align: "end", width: "w-32" },
          ]}
        >
          {PLANS.map((p) => (
            <AdminRow key={p.id}>
              <Cell tone="strong">{p.name}</Cell>
              <Cell align="end" className="tnum">{formatMoney(p.monthlyPrice)}</Cell>
              <Cell align="end" className="tnum">{q(p.bookingQuota)}</Cell>
              <Cell align="end" className="tnum">{q(p.agencyQuota)}</Cell>
              <Cell align="end" className="tnum">{q(p.supplierQuota)}</Cell>
              <Cell tone="muted">{p.features.join(", ")}</Cell>
              <Cell align="end" className="tnum">{formatNumber(p.tenantCount)}</Cell>
            </AdminRow>
          ))}
        </AdminTable>
      </div>
    </>
  );
}
