import "server-only";

import type { VisaApplication, VisaApplicationForm } from "@/lib/visa";
import { createClient } from "@/lib/supabase/server";

type FormRow = {
  id: string; name: string; description: string; accepting_submissions: boolean; thank_you_message: string;
  created_at: string; updated_at: string;
  visa_form_field: { id: string; position: number; label: string; type: VisaApplicationForm["fields"][number]["type"]; required: boolean; options: string[] }[];
};

export function rowToForm(r: FormRow): VisaApplicationForm {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    acceptingSubmissions: r.accepting_submissions,
    thankYouMessage: r.thank_you_message,
    fields: [...r.visa_form_field].sort((a, b) => a.position - b.position).map((f) => ({ id: f.id, label: f.label, type: f.type, required: f.required, options: f.options ?? [] })),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const FORM_SELECT = "id, name, description, accepting_submissions, thank_you_message, created_at, updated_at, visa_form_field(id, position, label, type, required, options)";

export async function listTenantForms(tenantId: string): Promise<VisaApplicationForm[]> {
  const db = await createClient();
  const { data } = await db.from("visa_form").select(FORM_SELECT).eq("tenant_id", tenantId).order("updated_at", { ascending: false });
  return ((data ?? []) as unknown as FormRow[]).map(rowToForm);
}

type AppRow = {
  id: string; form_id: string | null; form_name_snapshot: string; applicant_name: string; status: VisaApplication["status"];
  answers: Record<string, string>; document_names: string[]; extra_doc_request_sent_at: string | null; submitted_at: string;
  visa_application_notification: { id: string; message: string; sent_at: string }[];
};

export async function listTenantApplications(tenantId: string): Promise<VisaApplication[]> {
  const db = await createClient();
  const { data } = await db
    .from("visa_application")
    .select("id, form_id, form_name_snapshot, applicant_name, status, answers, document_names, extra_doc_request_sent_at, submitted_at, visa_application_notification(id, message, sent_at)")
    .eq("tenant_id", tenantId)
    .order("submitted_at", { ascending: false });
  return ((data ?? []) as unknown as AppRow[]).map((r) => ({
    id: r.id,
    formId: r.form_id ?? "",
    formNameSnapshot: r.form_name_snapshot,
    applicantName: r.applicant_name,
    submittedAt: r.submitted_at,
    status: r.status,
    answers: r.answers ?? {},
    documentNames: r.document_names ?? [],
    notifications: [...r.visa_application_notification].sort((a, b) => a.sent_at.localeCompare(b.sent_at)).map((n) => ({ id: n.id, message: n.message, sentAt: n.sent_at })),
    extraDocRequestSentAt: r.extra_doc_request_sent_at,
  }));
}
