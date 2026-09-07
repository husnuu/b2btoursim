import Link from "next/link";
import { notFound } from "next/navigation";
import { PLANS, TENANTS } from "@/data/mock";
import { formatDate, formatMoney, formatNumber, t } from "@/lib/i18n";
import { TenantStatusBadge } from "@/components/admin/TenantStatusBadge";
import { Button } from "@/components/primitives/Button";

/** Kiracı detay ve ayarları — Sitemap Bölüm 1 (MVP). */
const FEATURE_FLAGS = [
  { id: "white_label", label: "White-label vitrin", phase: "Faz 2" },
  { id: "sub_agencies", label: "Alt acente yönetimi", phase: "Faz 2" },
  { id: "hotel_search", label: "Otel araması", phase: "MVP" },
  { id: "tour_search", label: "Tur ve aktivite araması", phase: "MVP" },
  { id: "flight_search", label: "Uçuş araması", phase: "Faz 2" },
  { id: "public_api", label: "Public/Partner API", phase: "Faz 3" },
];

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = TENANTS.find((x) => x.id === id);
  if (!tenant) notFound();
  const plan = PLANS.find((p) => p.id === tenant.plan)!;

  return (
    <>
      <Link
        href="/admin/kiracilar"
        className="text-[length:var(--font-ui-sm)] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
      >
        {t("admin.tenants.title")}
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <h1 className="font-dense text-xl font-medium text-ink">{tenant.name}</h1>
          <TenantStatusBadge status={tenant.status} />
        </div>
        <div className="flex gap-2">
          {tenant.status === "active" ? (
            <Button variant="danger">{t("admin.tenant.suspend")}</Button>
          ) : (
            <Button variant="primary">{t("admin.tenant.activate")}</Button>
          )}
        </div>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section>
          <h2 className="mb-2 font-dense text-base font-medium text-ink">
            {t("admin.tenant.detail")}
          </h2>
          <dl className="grid grid-cols-[12rem_1fr] gap-x-6 gap-y-2 font-dense text-[length:var(--font-ui)]">
            <dt className="text-ink-3">{t("admin.tenants.col.plan")}</dt>
            <dd className="text-ink">
              {plan.name} — <span className="tnum">{formatMoney(plan.monthlyPrice)}</span>
            </dd>
            <dt className="text-ink-3">{t("admin.onboarding.currency")}</dt>
            <dd className="tnum text-ink">{tenant.defaultCurrency}</dd>
            <dt className="text-ink-3">{t("admin.tenants.col.created")}</dt>
            <dd className="tnum text-ink">{formatDate(tenant.createdAt)}</dd>
            <dt className="text-ink-3">{t("admin.tenants.col.agencies")}</dt>
            <dd className="tnum text-ink">{formatNumber(tenant.agencyCount)}</dd>
            <dt className="text-ink-3">{t("admin.tenants.col.bookings")}</dt>
            <dd className="tnum text-ink">{formatNumber(tenant.bookingsLast30d)}</dd>
            <dt className="text-ink-3">{t("admin.tenants.col.gmv")}</dt>
            <dd className="tnum text-ink">{formatMoney(tenant.gmvLast30d)}</dd>
            <dt className="text-ink-3">{t("admin.tenants.col.mrr")}</dt>
            <dd className="tnum font-semibold text-ink">{formatMoney(tenant.mrr)}</dd>
          </dl>

          <h2 className="mb-2 mt-8 font-dense text-base font-medium text-ink">
            {t("admin.tenant.quotas")}
          </h2>
          <dl className="grid grid-cols-[12rem_1fr] gap-x-6 gap-y-2 font-dense text-[length:var(--font-ui)]">
            <dt className="text-ink-3">{t("admin.plans.col.bookings")}</dt>
            <dd className="tnum text-ink">
              {plan.bookingQuota < 0 ? t("admin.plans.unlimited") : formatNumber(plan.bookingQuota)}
            </dd>
            <dt className="text-ink-3">{t("admin.plans.col.agencies")}</dt>
            <dd className="tnum text-ink">
              {plan.agencyQuota < 0 ? t("admin.plans.unlimited") : formatNumber(plan.agencyQuota)}
            </dd>
            <dt className="text-ink-3">{t("admin.plans.col.suppliers")}</dt>
            <dd className="tnum text-ink">
              {plan.supplierQuota < 0 ? t("admin.plans.unlimited") : formatNumber(plan.supplierQuota)}
            </dd>
          </dl>
        </section>

        <section>
          <h2 className="mb-2 font-dense text-base font-medium text-ink">
            {t("admin.tenant.features")}
          </h2>
          <ul className="border-t border-line font-dense">
            {FEATURE_FLAGS.map((f) => {
              const on = f.phase === "MVP" || (f.id === "sub_agencies" && tenant.plan !== "starter");
              return (
                <li
                  key={f.id}
                  className="flex items-center gap-3 border-b border-line py-2"
                >
                  <input
                    type="checkbox"
                    defaultChecked={on}
                    disabled={f.phase !== "MVP" && f.phase !== "Faz 2"}
                    aria-label={f.label}
                    className="h-4 w-4 accent-[var(--action-primary)]"
                  />
                  <span className="flex-1 text-[length:var(--font-ui)] text-ink">
                    {f.label}
                  </span>
                  <span className="rounded-[2px] border border-line px-1.5 text-[length:var(--font-ui-xs)] text-ink-3">
                    {f.phase}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
