import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSessionState } from "./session";

/**
 * Oturumdaki kullanıcının çalıştığı acente: talepteki acente, yoksa
 * (platform yöneticisi) kiracının ana acentesi. Rezervasyon, bakiye ve
 * ekstre bu acenteye göre okunur/yazılır.
 */
export const getWorkingAgency = cache(async (): Promise<{ tenantId: string; agencyId: string; type: "master" | "sub_agency" } | null> => {
  const session = await getSessionState();
  if (session.kind !== "ready") return null;
  const { tenantId, agencyId } = session.claims;
  const db = await createClient();
  if (agencyId) {
    const { data } = await db.from("agency").select("id, type").eq("id", agencyId).maybeSingle();
    if (data) return { tenantId, agencyId: data.id, type: data.type };
  }
  const { data: master } = await db.from("agency").select("id").eq("tenant_id", tenantId).eq("type", "master").limit(1).maybeSingle();
  return master ? { tenantId, agencyId: master.id, type: "master" } : null;
});
