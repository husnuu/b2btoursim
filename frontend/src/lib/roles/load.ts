import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

/** Rol → kapsam listesi; `role_scope` tablosundan (JWT'ye yazılanla aynı kaynak). */
export const listRoleScopes = cache(async (): Promise<{ role: UserRole; scopes: string[] }[]> => {
  const db = await createClient();
  const { data } = await db.from("role_scope").select("role, scope").order("role").order("scope");
  const map = new Map<UserRole, string[]>();
  for (const r of data ?? []) map.set(r.role, [...(map.get(r.role) ?? []), r.scope]);
  const order: UserRole[] = ["platform_admin", "agency_admin", "sales", "accounting"];
  return order.filter((r) => map.has(r)).map((role) => ({ role, scopes: map.get(role)! }));
});
