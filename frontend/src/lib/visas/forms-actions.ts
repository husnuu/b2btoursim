"use server";

import { getSessionState } from "@/lib/auth/session";
import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import type { VisaApplication, VisaApplicationForm } from "@/lib/visa";

/** Vize başvuru formları ve başvurular — operatör tarafı, RLS ile. */
export type ActionResult = { ok: true } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function ctx() {
  const session = await getSessionState();
  if (session.kind !== "ready") return null;
  return { tenantId: session.claims.tenantId, db: await createClient() };
}

export async function syncVisaForm(form: VisaApplicationForm): Promise<ActionResult> {
  if (!UUID.test(form.id)) return { ok: false, error: "legacy_id" };
  const c = await ctx();
  if (!c) return { ok: false, error: "auth" };
  const { tenantId, db } = c;

  const { error } = await db.from("visa_form").upsert(
    {
      id: form.id, tenant_id: tenantId, name: form.name.trim() || "Yeni form", description: form.description,
      accepting_submissions: form.acceptingSubmissions, thank_you_message: form.thankYouMessage, updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) {
    log.warn("visa.form.sync.failed", { tenantId, code: error.code, message: error.message });
    return { ok: false, error: error.code };
  }
  await db.from("visa_form_field").delete().eq("form_id", form.id);
  const fields = form.fields.filter((f) => f.label.trim());
  if (fields.length) {
    const { error: fErr } = await db.from("visa_form_field").insert(
      fields.map((f, i) => ({
        id: UUID.test(f.id) ? f.id : undefined, tenant_id: tenantId, form_id: form.id, position: i + 1,
        label: f.label.trim(), type: f.type, required: f.required, options: f.type === "select" ? f.options : [],
      })),
    );
    if (fErr) {
      log.warn("visa.form.fields.failed", { tenantId, code: fErr.code });
      return { ok: false, error: fErr.code };
    }
  }
  return { ok: true };
}

export async function deleteVisaForm(id: string): Promise<ActionResult> {
  const c = await ctx();
  if (!c) return { ok: false, error: "auth" };
  const { error } = await c.db.from("visa_form").delete().eq("id", id).eq("tenant_id", c.tenantId);
  return error ? { ok: false, error: error.code } : { ok: true };
}

export async function setVisaApplicationStatus(id: string, status: VisaApplication["status"], message?: string): Promise<ActionResult> {
  const c = await ctx();
  if (!c) return { ok: false, error: "auth" };
  const { error } = await c.db.from("visa_application").update({ status }).eq("id", id).eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.code };
  if (message) {
    // Gerçek e-posta/SMS yok; bildirim kaydı tutulur.
    await c.db.from("visa_application_notification").insert({ tenant_id: c.tenantId, application_id: id, message });
  }
  return { ok: true };
}

export async function sendVisaExtraDocRequest(id: string): Promise<ActionResult> {
  const c = await ctx();
  if (!c) return { ok: false, error: "auth" };
  const { error } = await c.db.from("visa_application").update({ extra_doc_request_sent_at: new Date().toISOString() }).eq("id", id).eq("tenant_id", c.tenantId);
  return error ? { ok: false, error: error.code } : { ok: true };
}
