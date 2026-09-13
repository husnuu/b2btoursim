import type { UserRole } from "@/lib/types";

/**
 * JWT'deki uygulama talepleri — `custom_access_token_hook` yazar.
 *
 * `role` Supabase'in kendi talebi (anon/authenticated); bizim rol
 * `app_role` adıyla gelir. Talepler yoksa hook etkin değil demektir;
 * `parseAppClaims` bunu null ile değil `hookMissing` ile ayırt eder ki
 * "giriş yapılamadı" ile "kurulum eksik" karışmasın.
 */
export type AppClaims = {
  authUserId: string;
  email: string | null;
  appUserId: string;
  tenantId: string;
  agencyId: string | null;
  role: UserRole;
  scopes: string[];
};

const ROLES: UserRole[] = ["platform_admin", "agency_admin", "sales", "accounting"];

type RawClaims = Record<string, unknown> | null | undefined;

/** Oturum var mı? (hook'tan bağımsız) */
export function hasSession(raw: RawClaims): boolean {
  return typeof raw?.sub === "string";
}

/** Oturum var ama uygulama talepleri yok: hook Dashboard'da etkinleştirilmemiş. */
export function hookMissing(raw: RawClaims): boolean {
  return hasSession(raw) && typeof raw?.tenant_id !== "string";
}

export function parseAppClaims(raw: RawClaims): AppClaims | null {
  if (!raw || typeof raw.sub !== "string") return null;
  if (typeof raw.tenant_id !== "string" || typeof raw.app_user_id !== "string") return null;
  const role = raw.app_role;
  if (typeof role !== "string" || !ROLES.includes(role as UserRole)) return null;
  return {
    authUserId: raw.sub,
    email: typeof raw.email === "string" ? raw.email : null,
    appUserId: raw.app_user_id,
    tenantId: raw.tenant_id,
    agencyId: typeof raw.agency_id === "string" ? raw.agency_id : null,
    role: role as UserRole,
    scopes: Array.isArray(raw.scopes) ? raw.scopes.filter((s): s is string => typeof s === "string") : [],
  };
}

export function hasScope(claims: AppClaims, scope: string): boolean {
  if (claims.scopes.includes(scope)) return true;
  return scope.endsWith(":read") && claims.scopes.includes("*:read");
}

/** Rolün açılış sayfası. */
export function homeForRole(role: UserRole): string {
  return role === "platform_admin" ? "/admin" : "/extranet";
}

/** `next` parametresi yalnız site içi göreli yol olabilir (açık yönlendirme yok). */
export function safeNext(next: unknown, fallback: string): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
