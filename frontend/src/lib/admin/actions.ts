"use server";

import { revalidatePath } from "next/cache";
import { getSessionState } from "@/lib/auth/session";
import { siteUrl } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";

export type AdminResult = { ok: true; id?: string } | { ok: false; error: string };

async function adminDb() {
  const session = await getSessionState();
  if (session.kind !== "ready" || session.claims.role !== "platform_admin") return null;
  return createAdminClient();
}

export async function setTenantStatus(id: string, status: "trial" | "active" | "suspended" | "closed"): Promise<AdminResult> {
  const db = await adminDb();
  if (!db) return { ok: false, error: "forbidden" };
  const { error } = await db.from("tenant").update({ status, closed_at: status === "closed" ? new Date().toISOString() : null }).eq("id", id);
  if (error) return { ok: false, error: error.code };
  log.info("admin.tenant.status", { tenantId: id, status });
  revalidatePath("/admin");
  revalidatePath("/admin/kiracilar");
  revalidatePath(`/admin/kiracilar/${id}`);
  return { ok: true };
}

export async function setSupplierStatus(id: string, status: "sandbox" | "active" | "degraded" | "disabled"): Promise<AdminResult> {
  const db = await adminDb();
  if (!db) return { ok: false, error: "forbidden" };
  const { error } = await db.from("supplier").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.code };
  revalidatePath("/admin");
  revalidatePath("/admin/tedarikciler");
  return { ok: true };
}

export async function selectFxSource(id: string): Promise<AdminResult> {
  const db = await adminDb();
  if (!db) return { ok: false, error: "forbidden" };
  const off = await db.from("fx_source").update({ is_selected: false }).neq("id", id);
  if (off.error) return { ok: false, error: off.error.code };
  const { error } = await db.from("fx_source").update({ is_selected: true }).eq("id", id);
  if (error) return { ok: false, error: error.code };
  revalidatePath("/admin/para-birimleri");
  return { ok: true };
}

const slugify = (s: string) =>
  s.toLocaleLowerCase("tr").replace(/[çğışöü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ş: "s", ö: "o", ü: "u" })[c] ?? c).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "kiraci";

/**
 * Kiracı açılışı: kiracı + ana acente + davetli yönetici (agency_admin) +
 * Auth daveti. `scripts/bootstrap.mjs` ile aynı sıra; hata olursa kiracı
 * silinir (cascade acente ve kullanıcıyı götürür).
 */
export async function createTenant(input: { name: string; currency: string; planCode: string; adminName: string; adminEmail: string }): Promise<AdminResult> {
  const db = await adminDb();
  if (!db) return { ok: false, error: "forbidden" };
  const name = input.name.trim();
  const email = input.adminEmail.trim().toLowerCase();
  if (name.length < 2) return { ok: false, error: "name" };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "email" };

  const { data: plan } = await db.from("plan").select("id").eq("code", input.planCode).maybeSingle();
  if (!plan) return { ok: false, error: "plan" };

  let slug = slugify(name);
  const { data: taken } = await db.from("tenant").select("id").eq("slug", slug).maybeSingle();
  if (taken) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: tenant, error: tErr } = await db.from("tenant").insert({ name, slug, plan_id: plan.id, status: "trial", default_currency: input.currency || "TRY" }).select("id").single();
  if (tErr || !tenant) return { ok: false, error: tErr?.code ?? "tenant" };

  const rollback = async () => { await db.from("tenant").delete().eq("id", tenant.id); };
  const { data: agency, error: aErr } = await db.from("agency").insert({ tenant_id: tenant.id, name, type: "master", currency: input.currency || "TRY" }).select("id").single();
  if (aErr || !agency) { await rollback(); return { ok: false, error: aErr?.code ?? "agency" }; }

  const { data: user, error: uErr } = await db
    .from("app_user")
    .insert({ tenant_id: tenant.id, agency_id: agency.id, role: "agency_admin", email, full_name: input.adminName.trim() || name, status: "invited" })
    .select("id")
    .single();
  if (uErr || !user) { await rollback(); return { ok: false, error: uErr?.code ?? "user" }; }

  const { error: invErr } = await db.auth.admin.inviteUserByEmail(email, {
    data: { app_user_id: user.id, full_name: input.adminName.trim() || name },
    redirectTo: `${siteUrl()}/auth/confirm?next=/sifre-belirle`,
  });
  if (invErr) {
    await rollback();
    log.warn("admin.tenant.invite.failed", { message: invErr.message });
    return { ok: false, error: "invite" };
  }
  log.info("admin.tenant.created", { tenantId: tenant.id });
  revalidatePath("/admin");
  revalidatePath("/admin/kiracilar");
  return { ok: true, id: tenant.id };
}
