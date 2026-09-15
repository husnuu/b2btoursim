import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Invoice, LedgerEntry, Payment } from "@/lib/types";

/**
 * Cari hesap: bakiye tek kaynak defterdir (`agency_balance` görünümü);
 * ekstre yürüyen bakiyeyi pencere fonksiyonuyla üretir (`agency_statement`).
 */
export type AgencyFinance = {
  agencyId: string;
  name: string;
  currency: string;
  creditLimit: number;
  balance: number;
  available: number;
  paymentTermDays: number;
};

export async function getAgencyFinance(tenantId: string, agencyId: string): Promise<AgencyFinance | null> {
  const db = await createClient();
  const [a, b] = await Promise.all([
    db.from("agency").select("id, name, currency, credit_limit, payment_term_days").eq("id", agencyId).eq("tenant_id", tenantId).maybeSingle(),
    db.from("agency_balance").select("balance, available").eq("agency_id", agencyId).eq("tenant_id", tenantId).maybeSingle(),
  ]);
  if (!a.data) return null;
  return {
    agencyId: a.data.id,
    name: a.data.name,
    currency: a.data.currency,
    creditLimit: Number(a.data.credit_limit),
    balance: Number(b.data?.balance ?? 0),
    available: Number(b.data?.available ?? a.data.credit_limit),
    paymentTermDays: a.data.payment_term_days,
  };
}

export async function listLedger(tenantId: string, agencyId: string): Promise<LedgerEntry[]> {
  const db = await createClient();
  const { data } = await db
    .from("agency_statement")
    .select("id, entry_date, account, description, debit, credit, reference_type, reference_id, running_balance")
    .eq("tenant_id", tenantId)
    .eq("agency_id", agencyId)
    .order("entry_date", { ascending: false })
    .order("id", { ascending: false })
    .limit(200);
  return (data ?? []).map((e) => ({
    id: String(e.id),
    date: e.entry_date ?? "",
    account: e.account ?? "",
    description: e.description ?? "",
    debit: Number(e.debit ?? 0),
    credit: Number(e.credit ?? 0),
    referenceType: (e.reference_type ?? "adjustment") as LedgerEntry["referenceType"],
    referenceId: e.reference_id ?? "",
    runningBalance: Number(e.running_balance ?? 0),
  }));
}

export async function listPayments(tenantId: string, agencyId: string): Promise<Payment[]> {
  const db = await createClient();
  const { data } = await db
    .from("payment")
    .select("id, amount, method, status, gateway_reference, created_at, booking(ref, agency_id)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(100);
  type Row = { id: string; amount: number; method: Payment["method"]; status: Payment["status"]; gateway_reference: string | null; created_at: string; booking: { ref: string; agency_id: string } | { ref: string; agency_id: string }[] | null };
  return ((data ?? []) as unknown as Row[])
    .map((p) => ({ ...p, b: Array.isArray(p.booking) ? p.booking[0] ?? null : p.booking }))
    .filter((p) => !p.b || p.b.agency_id === agencyId)
    .map((p) => ({ id: p.id, bookingRef: p.b?.ref ?? "", amount: Number(p.amount), method: p.method, status: p.status, gatewayReference: p.gateway_reference, createdAt: p.created_at }));
}

export async function listInvoices(tenantId: string, agencyId: string): Promise<Invoice[]> {
  const db = await createClient();
  const { data } = await db
    .from("invoice")
    .select("id, number, agency_id, period_start, period_end, amount, tax_amount, status, due_date, e_invoice_ref")
    .eq("tenant_id", tenantId)
    .eq("agency_id", agencyId)
    .order("period_end", { ascending: false })
    .limit(100);
  return (data ?? []).map((i) => ({
    id: i.id, number: i.number, agencyId: i.agency_id, periodStart: i.period_start, periodEnd: i.period_end,
    amount: Number(i.amount), taxAmount: Number(i.tax_amount), status: i.status, dueDate: i.due_date, eInvoiceRef: i.e_invoice_ref,
  }));
}
