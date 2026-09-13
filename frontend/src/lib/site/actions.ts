"use server";

import { revalidatePath } from "next/cache";
import { getSessionState } from "@/lib/auth/session";
import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import { normalizeSite, type SiteConfig } from "./config";

export type SiteActionResult = { ok: true; at: string } | { ok: false; error: string };

async function tenantForEdit(): Promise<{ tenantId: string } | { error: string }> {
  const session = await getSessionState();
  if (session.kind !== "ready") return { error: "auth" };
  const { role, tenantId } = session.claims;
  if (role !== "agency_admin" && role !== "platform_admin") return { error: "forbidden" };
  return { tenantId };
}

/** Taslağı kaydeder. Gelen yapı sunucuda yeniden doğrulanır; istemciye güvenilmez. */
export async function saveSiteDraft(raw: SiteConfig): Promise<SiteActionResult> {
  const ctx = await tenantForEdit();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const draft = normalizeSite(raw as unknown as Record<string, unknown>);
  const now = new Date().toISOString();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tenant_site")
    .upsert({ tenant_id: ctx.tenantId, draft, updated_at: now }, { onConflict: "tenant_id" });
  if (error) {
    log.warn("site.draft.saveFailed", { tenantId: ctx.tenantId, code: error.code });
    return { ok: false, error: error.code };
  }
  return { ok: true, at: now };
}

/** Taslağı yayınlar: müşteri bundan sonra bunu görür. */
export async function publishSite(): Promise<SiteActionResult> {
  const ctx = await tenantForEdit();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const supabase = await createClient();
  const { data } = await supabase.from("tenant_site").select("draft").eq("tenant_id", ctx.tenantId).maybeSingle();
  const draft = normalizeSite((data?.draft ?? null) as Record<string, unknown> | null);
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("tenant_site")
    .upsert({ tenant_id: ctx.tenantId, draft, published: draft, published_at: now, updated_at: now }, { onConflict: "tenant_id" });
  if (error) {
    log.warn("site.publishFailed", { tenantId: ctx.tenantId, code: error.code });
    return { ok: false, error: error.code };
  }
  log.info("site.published", { tenantId: ctx.tenantId });
  revalidatePath("/magaza", "layout");
  return { ok: true, at: now };
}

/** Taslağı yayınlanana geri döndürür. */
export async function revertSiteDraft(): Promise<SiteActionResult> {
  const ctx = await tenantForEdit();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const supabase = await createClient();
  const { data } = await supabase.from("tenant_site").select("published").eq("tenant_id", ctx.tenantId).maybeSingle();
  if (!data?.published) return { ok: false, error: "nothing_published" };
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("tenant_site")
    .update({ draft: data.published, updated_at: now })
    .eq("tenant_id", ctx.tenantId);
  if (error) return { ok: false, error: error.code };
  return { ok: true, at: now };
}
