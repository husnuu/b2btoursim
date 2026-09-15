"use server";

import { revalidatePath } from "next/cache";
import { getWorkingAgency } from "@/lib/auth/agency";
import { getSessionState } from "@/lib/auth/session";
import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";

export type CreateAgencyResult = { ok: true; id: string } | { ok: false; error: string };

/** Ana acentenin altına alt acente açar. Yalnız yönetici rolleri. */
export async function createSubAgency(input: { name: string; creditLimit: number; paymentTermDays: number; currency: string }): Promise<CreateAgencyResult> {
  const session = await getSessionState();
  if (session.kind !== "ready") return { ok: false, error: "auth" };
  if (!["platform_admin", "agency_admin"].includes(session.claims.role)) return { ok: false, error: "forbidden" };
  const working = await getWorkingAgency();
  if (!working) return { ok: false, error: "agency" };
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "name" };

  const db = await createClient();
  const { data: master } = await db.from("agency").select("id").eq("tenant_id", working.tenantId).eq("type", "master").limit(1).maybeSingle();
  if (!master) return { ok: false, error: "master" };
  const { data, error } = await db
    .from("agency")
    .insert({
      tenant_id: working.tenantId, parent_agency_id: master.id, name, type: "sub_agency",
      credit_limit: Math.max(0, Math.round(input.creditLimit)), currency: input.currency || "TRY", payment_term_days: Math.max(0, Math.round(input.paymentTermDays)),
    })
    .select("id")
    .single();
  if (error || !data) {
    log.warn("agency.create.failed", { tenantId: working.tenantId, code: error?.code });
    return { ok: false, error: error?.code ?? "unknown" };
  }
  revalidatePath("/extranet/acenteler");
  return { ok: true, id: data.id };
}
