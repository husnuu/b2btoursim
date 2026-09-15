"use server";

import { log } from "@/lib/log";
import { missingApplicationAnswers } from "@/lib/visa";
import { getPublicVisaForm } from "./public";
import { createAdminClient } from "@/lib/supabase/admin";

export type SubmitResult = { ok: true; id: string } | { ok: false; error: "NOT_FOUND" | "CLOSED" | "INVALID" | "unknown" };

/** Public başvuru gönderimi — sunucuda doğrulanır, yönetici istemcisiyle yazılır. */
export async function submitVisaApplication(input: {
  formId: string;
  applicantName: string;
  answers: Record<string, string>;
  documentNames: string[];
}): Promise<SubmitResult> {
  const form = await getPublicVisaForm(input.formId);
  if (!form) return { ok: false, error: "NOT_FOUND" };
  if (!form.acceptingSubmissions) return { ok: false, error: "CLOSED" };
  const name = input.applicantName.trim().slice(0, 200);
  const known = new Set(form.fields.map((f) => f.id));
  const answers = Object.fromEntries(Object.entries(input.answers ?? {}).filter(([k, v]) => known.has(k) && typeof v === "string").map(([k, v]) => [k, v.slice(0, 2000)]));
  if (!name || missingApplicationAnswers(form, answers).length) return { ok: false, error: "INVALID" };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "unknown" };
  const { data: row } = await admin.from("visa_form").select("tenant_id").eq("id", form.id).single();
  if (!row) return { ok: false, error: "NOT_FOUND" };
  const { data, error } = await admin
    .from("visa_application")
    .insert({
      tenant_id: row.tenant_id, form_id: form.id, form_name_snapshot: form.name, applicant_name: name, status: "yeni",
      answers, document_names: (input.documentNames ?? []).filter((d) => typeof d === "string").slice(0, 20).map((d) => d.slice(0, 200)),
    })
    .select("id")
    .single();
  if (error || !data) {
    log.warn("visa.application.failed", { formId: form.id, code: error?.code });
    return { ok: false, error: "unknown" };
  }
  log.info("visa.application", { formId: form.id, tenantId: row.tenant_id });
  return { ok: true, id: data.id };
}
