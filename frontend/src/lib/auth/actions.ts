"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MessageKey } from "@/lib/i18n";
import { log } from "@/lib/log";
import type { UserRole } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/supabase/env";
import { homeForRole, safeNext } from "./claims";
import { getSessionState } from "./session";

/**
 * Kimlik eylemleri — hepsi sunucuda çalışır. Formlar `useActionState`
 * ile bağlanır; sonuç bir i18n anahtarı taşır, metin bileşende çevrilir.
 */
export type ActionState = {
  error?: MessageKey;
  ok?: boolean;
  /** Başarı mesajında gösterilecek değer (ör. e-posta). */
  value?: string;
};

const INITIAL: ActionState = {};
export const initialActionState = async () => INITIAL;

function field(fd: FormData, name: string): string {
  const v = fd.get(name);
  return typeof v === "string" ? v.trim() : "";
}

/* --- Giriş ------------------------------------------------------------ */

export async function signIn(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = field(fd, "email");
  const password = field(fd, "password");
  const next = safeNext(field(fd, "next"), "");
  if (!email || !password) return { error: "auth.error.missing" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Hook'un 403'ü (davetsiz / devre dışı) ile yanlış şifre ayrılır.
    const msg = error.message.toLowerCase();
    if (error.status === 403 || msg.includes("acente") || msg.includes("devre dışı")) {
      return { error: "auth.error.notLinked" };
    }
    if (msg.includes("invalid login credentials")) return { error: "auth.error.invalidCredentials" };
    if (msg.includes("email not confirmed")) return { error: "auth.error.notConfirmed" };
    log.warn("auth.signIn.failed", { status: error.status, code: error.code });
    return { error: "auth.error.generic" };
  }

  // Rol JWT'den ya da app_user'dan (hook kapalıysa) okunur.
  const state = await getSessionState();
  revalidatePath("/", "layout");
  redirect(next || (state.kind === "ready" ? homeForRole(state.claims.role) : "/extranet"));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/giris");
}

/* --- Şifre ------------------------------------------------------------ */

export async function requestPasswordReset(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = field(fd, "email");
  if (!email) return { error: "auth.error.missing" };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/sifre-belirle`,
  });
  // Var olmayan adres için de aynı yanıt: hesap keşfine izin verilmez.
  if (error) log.warn("auth.reset.failed", { status: error.status, code: error.code });
  return { ok: true, value: email };
}

export async function setPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const password = field(fd, "password");
  const confirm = field(fd, "confirm");
  if (password.length < 10) return { error: "auth.error.passwordShort" };
  if (password !== confirm) return { error: "auth.error.passwordMismatch" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    log.warn("auth.setPassword.failed", { status: error.status, code: error.code });
    return { error: error.status === 401 ? "auth.error.linkExpired" : "auth.error.generic" };
  }

  const state = await getSessionState();
  revalidatePath("/", "layout");
  redirect(state.kind === "ready" ? homeForRole(state.claims.role) : "/extranet");
}

/* --- E-posta bağlantısı doğrulama ------------------------------------ */

/**
 * `token_hash` (sunucu tarafı şablon) ya da `code` (PKCE) ile oturum açar.
 * Server Action olduğu için çerez yazabilir; Server Component yazamazdı.
 */
export async function confirmEmailLink(input: {
  tokenHash?: string | null;
  type?: string | null;
  code?: string | null;
}): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  if (input.tokenHash && input.type) {
    const { error } = await supabase.auth.verifyOtp({
      type: input.type as EmailOtpType,
      token_hash: input.tokenHash,
    });
    return { ok: !error };
  }
  if (input.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(input.code);
    return { ok: !error };
  }
  return { ok: false };
}

/* --- Davet ------------------------------------------------------------ */

const INVITABLE: UserRole[] = ["agency_admin", "sales", "accounting"];

/**
 * Davet iki adım: (1) kullanıcının kendi oturumuyla `app_user` (invited)
 * satırı — RLS kiracıyı garanti eder; (2) yönetici istemcisiyle Auth
 * daveti. Auth kaydı oluşunca DB tetikleyicisi iki satırı bağlar.
 */
export async function inviteUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = field(fd, "email").toLowerCase();
  const fullName = field(fd, "fullName");
  const role = field(fd, "role") as UserRole;
  if (!email || !fullName) return { error: "auth.error.missing" };
  if (!INVITABLE.includes(role)) return { error: "users.invite.error.role" };

  const supabase = await createClient();
  const state = await getSessionState();
  if (state.kind !== "ready") return { error: "auth.error.generic" };
  const { claims } = state;
  if (claims.role !== "agency_admin" && claims.role !== "platform_admin") {
    return { error: "users.invite.error.forbidden" };
  }
  if (!claims.agencyId) return { error: "users.invite.error.noAgency" };

  const admin = createAdminClient();
  if (!admin) return { error: "users.invite.error.noSecretKey" };

  const { data: row, error: insertError } = await supabase
    .from("app_user")
    .insert({
      tenant_id: claims.tenantId,
      agency_id: claims.agencyId,
      role,
      email,
      full_name: fullName,
      status: "invited",
    })
    .select("id")
    .single();

  if (insertError || !row) {
    if (insertError?.code === "23505") return { error: "users.invite.error.exists" };
    log.warn("users.invite.insertFailed", { code: insertError?.code });
    return { error: "auth.error.generic" };
  }

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { app_user_id: row.id, full_name: fullName },
    redirectTo: `${siteUrl()}/auth/confirm?next=/sifre-belirle`,
  });

  if (inviteError) {
    // Auth daveti gitmediyse yarım kayıt bırakılmaz.
    await supabase.from("app_user").delete().eq("id", row.id);
    log.warn("users.invite.authFailed", { status: inviteError.status, code: inviteError.code });
    return {
      error: inviteError.status === 422 ? "users.invite.error.exists" : "auth.error.generic",
    };
  }

  revalidatePath("/extranet/ayarlar");
  return { ok: true, value: email };
}

export async function updateUserRole(appUserId: string, role: UserRole): Promise<ActionState> {
  if (!INVITABLE.includes(role)) return { error: "users.invite.error.role" };
  const supabase = await createClient();
  const { error } = await supabase.from("app_user").update({ role }).eq("id", appUserId);
  if (error) return { error: "auth.error.generic" };
  revalidatePath("/extranet/ayarlar");
  return { ok: true };
}
