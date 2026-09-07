"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatMoney, formatNumber, formatShortDate, t } from "@/lib/i18n";
import type { Tenant } from "@/lib/types";
import { AdminTable, AdminRow, Cell } from "./AdminTable";
import { TenantStatusBadge } from "./TenantStatusBadge";
import { FilterChipBar, type ChipDef } from "@/components/primitives/FilterChipBar";
import { EmptyState } from "@/components/primitives/States";

const CHIPS: ChipDef[] = [
  { id: "active", label: "tenantStatus.active" },
  { id: "trial", label: "tenantStatus.trial" },
  { id: "suspended", label: "tenantStatus.suspended" },
  { id: "closed", label: "tenantStatus.closed" },
];

/** Arama ve durum filtresi — liste küçük olduğu için istemci tarafında. */
export function TenantFilters({ tenants }: { tenants: Tenant[] }) {
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return tenants.filter(
      (tn) =>
        (!statuses.length || statuses.includes(tn.status)) &&
        (!q || tn.name.toLocaleLowerCase("tr").includes(q)),
    );
  }, [tenants, query, statuses]);

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="w-full sm:max-w-xs">
          <span className="sr-only">{t("admin.tenants.col.name")}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.tenants.col.name")}
            className="h-8 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5
                       text-[length:var(--font-ui)] text-ink outline-none
                       placeholder:text-ink-3 focus:border-action"
          />
        </label>
        <FilterChipBar
          chips={CHIPS}
          active={statuses}
          onToggle={(id) =>
            setStatuses((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
            )
          }
          onClear={() => setStatuses([])}
        />
        <p className="tnum ms-auto text-[length:var(--font-ui-sm)] text-ink-3">
          {t("bookings.rowCount", { count: rows.length })}
        </p>
      </div>

      <div className="mt-4">
        {rows.length === 0 ? (
          <EmptyState
            title={t("results.emptyTitle")}
            body={t("results.emptyBody")}
          />
        ) : (
          <AdminTable
            columns={[
              { key: "name", label: t("admin.tenants.col.name") },
              { key: "plan", label: t("admin.tenants.col.plan"), width: "w-28" },
              { key: "status", label: t("admin.tenants.col.status"), width: "w-28" },
              { key: "agencies", label: t("admin.tenants.col.agencies"), align: "end", width: "w-20" },
              { key: "bookings", label: t("admin.tenants.col.bookings"), align: "end", width: "w-32" },
              { key: "gmv", label: t("admin.tenants.col.gmv"), align: "end", width: "w-40" },
              { key: "mrr", label: t("admin.tenants.col.mrr"), align: "end", width: "w-32" },
              { key: "created", label: t("admin.tenants.col.created"), align: "end", width: "w-24" },
            ]}
          >
            {rows.map((tn) => (
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
                <Cell align="end" className="tnum">{formatNumber(tn.agencyCount)}</Cell>
                <Cell align="end" className="tnum">{formatNumber(tn.bookingsLast30d)}</Cell>
                <Cell align="end" className="tnum">{formatMoney(tn.gmvLast30d)}</Cell>
                <Cell align="end" tone="strong" className="tnum">{formatMoney(tn.mrr)}</Cell>
                <Cell align="end" tone="muted" className="tnum">{formatShortDate(tn.createdAt)}</Cell>
              </AdminRow>
            ))}
          </AdminTable>
        )}
      </div>
    </>
  );
}
