import "server-only";

import { cache } from "react";
import { getSessionState } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Supplier, Tenant } from "@/lib/types";

/**
 * Süper Admin okumaları kiracılar arasıdır; RLS kiracı içine kilitler.
 * Bu yüzden yönetici istemcisi — ama YALNIZ platform_admin oturumu için
 * ve yalnız bu dosyadan. Rol denetimi her okumada.
 */
async function adminDb() {
  const session = await getSessionState();
  if (session.kind !== "ready" || session.claims.role !== "platform_admin") throw new Error("platform_admin gerekir");
  const admin = createAdminClient();
  if (!admin) throw new Error("SUPABASE_SECRET_KEY yok");
  return admin;
}

export type PlanRow = { id: string; code: string; name: string; monthlyPrice: number; currency: string; bookingQuota: number; agencyQuota: number; supplierQuota: number; isActive: boolean; tenantCount: number };

export const listPlans = cache(async (): Promise<PlanRow[]> => {
  const db = await adminDb();
  const [p, t] = await Promise.all([
    db.from("plan").select("id, code, name, monthly_price, currency, booking_quota, agency_quota, supplier_quota, is_active").order("monthly_price"),
    db.from("tenant").select("plan_id"),
  ]);
  const counts = new Map<string, number>();
  for (const x of t.data ?? []) counts.set(x.plan_id, (counts.get(x.plan_id) ?? 0) + 1);
  return (p.data ?? []).map((x) => ({
    id: x.id, code: x.code, name: x.name, monthlyPrice: Number(x.monthly_price), currency: x.currency,
    bookingQuota: x.booking_quota, agencyQuota: x.agency_quota, supplierQuota: x.supplier_quota, isActive: x.is_active, tenantCount: counts.get(x.id) ?? 0,
  }));
});

export type TenantRow = Tenant & { planId: string; planName: string; slug: string };

export const listTenants = cache(async (): Promise<TenantRow[]> => {
  const db = await adminDb();
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const [t, a, b, plans] = await Promise.all([
    db.from("tenant").select("id, name, slug, plan_id, status, default_currency, created_at").order("created_at", { ascending: false }),
    db.from("agency").select("tenant_id"),
    db.from("booking").select("id, tenant_id, created_at, status").gte("created_at", since).neq("status", "DRAFT"),
    listPlans(),
  ]);
  const ids = (b.data ?? []).map((x) => x.id);
  const totals = ids.length ? await db.from("booking_totals").select("booking_id, sale_total").in("booking_id", ids) : { data: [] as { booking_id: string; sale_total: number | null }[] };
  const sale = new Map((totals.data ?? []).map((x) => [x.booking_id, Number(x.sale_total ?? 0)]));
  const agencies = new Map<string, number>();
  for (const x of a.data ?? []) agencies.set(x.tenant_id, (agencies.get(x.tenant_id) ?? 0) + 1);
  const bookings = new Map<string, { n: number; gmv: number }>();
  for (const x of b.data ?? []) {
    const cur = bookings.get(x.tenant_id) ?? { n: 0, gmv: 0 };
    bookings.set(x.tenant_id, { n: cur.n + 1, gmv: cur.gmv + (sale.get(x.id) ?? 0) });
  }
  const planById = new Map(plans.map((p) => [p.id, p]));
  return (t.data ?? []).map((x) => {
    const plan = planById.get(x.plan_id);
    return {
      id: x.id, name: x.name, slug: x.slug, planId: x.plan_id, planName: plan?.name ?? "—",
      plan: (plan?.code ?? "starter") as Tenant["plan"], status: x.status, defaultCurrency: x.default_currency, createdAt: x.created_at,
      agencyCount: agencies.get(x.id) ?? 0, bookingsLast30d: bookings.get(x.id)?.n ?? 0, gmvLast30d: bookings.get(x.id)?.gmv ?? 0,
      mrr: x.status === "active" ? (plan?.monthlyPrice ?? 0) : 0,
    };
  });
});

export const getTenant = cache(async (id: string): Promise<TenantRow | null> => (await listTenants()).find((t) => t.id === id) ?? null);

export type SupplierRow = Supplier & { tenantId: string; tenantName: string };

export const listSuppliers = cache(async (): Promise<SupplierRow[]> => {
  const db = await adminDb();
  const [s, h, t] = await Promise.all([
    db.from("supplier").select("id, tenant_id, name, code, adapter_type, status, credentials_ref").order("name"),
    db.from("supplier_health_snapshot").select("supplier_id, uptime_pct, avg_latency_ms, error_rate_pct, window_start").order("window_start", { ascending: false }).limit(500),
    db.from("tenant").select("id, name"),
  ]);
  const latest = new Map<string, { uptime_pct: number | string; avg_latency_ms: number; error_rate_pct: number | string }>();
  for (const x of h.data ?? []) if (!latest.has(x.supplier_id)) latest.set(x.supplier_id, x);
  const tenants = new Map((t.data ?? []).map((x) => [x.id, x.name]));
  return (s.data ?? []).map((x) => {
    const m = latest.get(x.id);
    return {
      id: x.id, tenantId: x.tenant_id, tenantName: tenants.get(x.tenant_id) ?? "—", name: x.name, code: x.code, adapterType: x.adapter_type, status: x.status,
      credentialsRef: x.credentials_ref ?? "", uptimePct: m ? Number(m.uptime_pct) : 100, avgLatencyMs: m?.avg_latency_ms ?? 0, errorRatePct: m ? Number(m.error_rate_pct) : 0,
    };
  });
});

export type CurrencyRow = { code: string; name: string; isBase: boolean; rate: number | null };
export type FxSourceRow = { id: string; code: string; name: string; isSelected: boolean; updatedAt: string | null };

export const listCurrencies = cache(async (): Promise<{ currencies: CurrencyRow[]; sources: FxSourceRow[] }> => {
  const db = await adminDb();
  const [c, s] = await Promise.all([
    db.from("currency").select("code, name, is_base").order("is_base", { ascending: false }).order("code"),
    db.from("fx_source").select("id, code, name, is_selected, updated_at").order("code"),
  ]);
  const selected = (s.data ?? []).find((x) => x.is_selected);
  const base = (c.data ?? []).find((x) => x.is_base)?.code;
  const rates = selected && base
    ? await db.from("fx_rate").select("quote_code, rate, valid_from").eq("source_id", selected.id).eq("base_code", base).order("valid_from", { ascending: false }).limit(200)
    : { data: [] as { quote_code: string; rate: number | string; valid_from: string }[] };
  const latest = new Map<string, number>();
  for (const r of rates.data ?? []) if (!latest.has(r.quote_code)) latest.set(r.quote_code, Number(r.rate));
  return {
    currencies: (c.data ?? []).map((x) => ({ code: x.code, name: x.name, isBase: x.is_base, rate: x.is_base ? 1 : latest.get(x.code) ?? null })),
    sources: (s.data ?? []).map((x) => ({ id: x.id, code: x.code, name: x.name, isSelected: x.is_selected, updatedAt: x.updated_at })),
  };
});

export async function platformStats() {
  const [tenants, suppliers] = await Promise.all([listTenants(), listSuppliers()]);
  return {
    activeTenants: tenants.filter((t) => t.status === "active").length,
    trialTenants: tenants.filter((t) => t.status === "trial").length,
    mrr: tenants.reduce((s, t) => s + t.mrr, 0),
    gmvLast30d: tenants.reduce((s, t) => s + t.gmvLast30d, 0),
    bookingsLast30d: tenants.reduce((s, t) => s + t.bookingsLast30d, 0),
    degradedSuppliers: suppliers.filter((s) => s.status === "degraded").length,
  };
}
