import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hookMissing, parseAppClaims, type AppClaims } from "./claims";
import type { UserRole } from "@/lib/types";

export type SessionState =
  | { kind: "anonymous" }
  /** Oturum var ama bu Auth hesabına bağlı, aktif bir app_user yok. */
  | { kind: "unlinked"; email: string | null }
  | { kind: "ready"; claims: AppClaims };

/**
 * Sunucu tarafında oturum durumu. `getClaims` JWT'yi doğrular; çerezdeki
 * ham veriye güvenilmez.
 *
 * İki kademe: JWT'de uygulama talepleri varsa (hook açık) sorgu yok;
 * yoksa app_user tablosuna bakılır. Veritabanındaki RLS fonksiyonları da
 * aynı yedeği uygular — hook bir hızlandırmadır, doğruluk şartı değil.
 */
export async function getSessionState(): Promise<SessionState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const raw = data?.claims as Record<string, unknown> | undefined;
  const fromJwt = parseAppClaims(raw);
  if (fromJwt) return { kind: "ready", claims: fromJwt };
  if (!hookMissing(raw)) return { kind: "anonymous" };

  const sub = raw!.sub as string;
  const email = typeof raw?.email === "string" ? raw.email : null;

  const { data: u } = await supabase
    .from("app_user")
    .select("id, tenant_id, agency_id, role, status")
    .eq("auth_user_id", sub)
    .maybeSingle();
  if (!u || u.status === "disabled") return { kind: "unlinked", email };

  const { data: scopes } = await supabase.from("role_scope").select("scope").eq("role", u.role);

  return {
    kind: "ready",
    claims: {
      authUserId: sub,
      email,
      appUserId: u.id,
      tenantId: u.tenant_id,
      agencyId: u.agency_id,
      role: u.role as UserRole,
      scopes: (scopes ?? []).map((s) => s.scope),
    },
  };
}

/** Sayfa düzeyinde kapı: oturum yoksa girişe. Bağlantısız hesapta `null`
 *  döner ki layout açıklayıcı ekranı basabilsin. */
export async function requireClaims(next: string): Promise<AppClaims | null> {
  const state = await getSessionState();
  if (state.kind === "anonymous") redirect(`/giris?next=${encodeURIComponent(next)}`);
  return state.kind === "ready" ? state.claims : null;
}
