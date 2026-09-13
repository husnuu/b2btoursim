import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";
import { getSessionState, type SessionState } from "./session";

export type CurrentUser = {
  fullName: string;
  email: string | null;
  role: UserRole;
  agencyName: string | null;
  tenantId: string;
};

/**
 * Oturumdaki kullanıcı ve acentesi — istek başına bir kez sorgulanır
 * (`cache`): layout ve sayfa aynı bilgiyi ister, iki sorgu atılmaz.
 *
 * Talepler yalnız kimlik taşır (id, rol, kiracı); ad ve acente adı
 * tabloda. RLS: kullanıcı kendi kiracısındaki satırları görür.
 */
export const getCurrentUser = cache(async (): Promise<
  { state: "ready"; user: CurrentUser } | { state: Exclude<SessionState["kind"], "ready"> }
> => {
  const session = await getSessionState();
  if (session.kind !== "ready") return { state: session.kind };
  const { claims } = session;

  const supabase = await createClient();
  const [userRes, agencyRes] = await Promise.all([
    supabase.from("app_user").select("full_name, email").eq("id", claims.appUserId).maybeSingle(),
    claims.agencyId
      ? supabase.from("agency").select("name").eq("id", claims.agencyId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    state: "ready",
    user: {
      fullName: userRes.data?.full_name ?? claims.email ?? "",
      email: userRes.data?.email ?? claims.email,
      role: claims.role,
      agencyName: agencyRes.data?.name ?? null,
      tenantId: claims.tenantId,
    },
  };
});
