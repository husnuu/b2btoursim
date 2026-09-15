import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Agency } from "@/lib/types";

/** Alt acenteler + defterden türetilen bakiye. */
export async function listSubAgencies(tenantId: string): Promise<Agency[]> {
  const db = await createClient();
  const [a, b] = await Promise.all([
    db.from("agency").select("id, tenant_id, parent_agency_id, name, type, credit_limit, currency, payment_term_days").eq("tenant_id", tenantId).eq("type", "sub_agency").order("name"),
    db.from("agency_balance").select("agency_id, available").eq("tenant_id", tenantId),
  ]);
  const avail = new Map((b.data ?? []).map((x) => [x.agency_id, Number(x.available ?? 0)]));
  return (a.data ?? []).map((x) => ({
    id: x.id, tenantId: x.tenant_id, parentAgencyId: x.parent_agency_id, name: x.name, type: x.type,
    creditLimit: Number(x.credit_limit), balance: avail.get(x.id) ?? Number(x.credit_limit), currency: x.currency, paymentTermDays: x.payment_term_days,
  }));
}
