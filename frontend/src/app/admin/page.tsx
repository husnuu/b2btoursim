import Link from "next/link";
import { PLATFORM_STATS, SUPPLIERS, TENANTS } from "@/data/mock";
import { formatMoney, formatNumber, formatShortDate, t } from "@/lib/i18n";
import { AdminTable, AdminRow, Cell } from "@/components/admin/AdminTable";
import { TenantStatusBadge } from "@/components/admin/TenantStatusBadge";
import { SupplierHealthRow } from "@/components/admin/SupplierHealthRow";

/** Platform dashboard — Sitemap Bölüm 1, /admin/dashboard (MVP). */
export default function AdminDashboardPage() {
  const newest = [...TENANTS]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const watch = SUPPLIERS.filter((s) => s.status !== "disabled").slice(0, 5);

  return (
    <>
      <h1 className="text-xl font-medium text-ink">{t("admin.nav.dashboard")}</h1>

      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-line-strong bg-line lg:grid-cols-3 xl:grid-cols-6">
        <Stat label={t("admin.stats.activeTenants")} value={formatNumber(PLATFORM_STATS.activeTenants)} />
        <Stat label={t("admin.stats.trial")} value={formatNumber(PLATFORM_STATS.trialTenants)} />
        <Stat label={t("admin.stats.mrr")} value={formatMoney(PLATFORM_STATS.mrr)} />
        <Stat label={t("admin.stats.gmv")} value={formatMoney(PLATFORM_STATS.gmvLast30d)} />
        <Stat label={t("admin.stats.bookings")} value={formatNumber(PLATFORM_STATS.bookingsLast30d)} />
        <Stat
          label={t("admin.stats.degraded")}
          value={formatNumber(PLATFORM_STATS.degradedSuppliers)}
          tone={PLATFORM_STATS.degradedSuppliers > 0 ? "warning" : "default"}
        />
      </dl>

      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-dense text-base font-medium text-ink">
              {t("admin.tenants.title")}
            </h2>
            <Link
              href="/admin/kiracilar"
              className="text-[length:var(--font-ui-sm)] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
            >
              {t("home.seeAll")}
            </Link>
          </div>
          <AdminTable
            columns={[
              { key: "name", label: t("admin.tenants.col.name") },
              { key: "plan", label: t("admin.tenants.col.plan"), width: "w-24" },
              { key: "status", label: t("admin.tenants.col.status"), width: "w-28" },
              { key: "created", label: t("admin.tenants.col.created"), align: "end", width: "w-24" },
            ]}
          >
            {newest.map((tn) => (
              <AdminRow key={tn.id}>
                <Cell>
                  <Link
                    href={`/admin/kiracilar/${tn.id}`}
                    className="underline decoration-transparent underline-offset-2 hover:decoration-ink"
                  >
                    {tn.name}
                  </Link>
                </Cell>
                <Cell tone="muted">{tn.plan}</Cell>
                <Cell><TenantStatusBadge status={tn.status} /></Cell>
                <Cell align="end" tone="muted" className="tnum">
                  {formatShortDate(tn.createdAt)}
                </Cell>
              </AdminRow>
            ))}
          </AdminTable>
        </section>

        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-dense text-base font-medium text-ink">
              {t("admin.suppliers.title")}
            </h2>
            <Link
              href="/admin/tedarikciler"
              className="text-[length:var(--font-ui-sm)] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
            >
              {t("home.seeAll")}
            </Link>
          </div>
          <AdminTable
            columns={[
              { key: "name", label: t("admin.suppliers.col.name") },
              { key: "status", label: t("admin.suppliers.col.status"), width: "w-28" },
              { key: "uptime", label: t("admin.suppliers.col.uptime"), align: "end", width: "w-24" },
              { key: "latency", label: t("admin.suppliers.col.latency"), align: "end", width: "w-28" },
              { key: "err", label: t("admin.suppliers.col.errors"), align: "end", width: "w-24" },
            ]}
          >
            {watch.map((s) => (
              <SupplierHealthRow key={s.id} supplier={s} />
            ))}
          </AdminTable>
        </section>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="bg-surface p-3">
      <dt className="text-[length:var(--font-ui-sm)] text-ink-2">{label}</dt>
      <dd
        className={`tnum mt-1 text-[length:calc(var(--font-ui)*1.7)] font-semibold leading-none ${
          tone === "warning" ? "text-warning" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
