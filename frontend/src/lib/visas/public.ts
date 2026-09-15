import "server-only";

import type { VisaApplicationForm } from "@/lib/visa";
import { createAdminClient } from "@/lib/supabase/admin";
import { FORM_SELECT, rowToForm } from "./forms-load";

/**
 * `/basvuru/[formId]` girişsizdir: form yönetici istemcisiyle kimliğe göre
 * okunur (yalnız o form; kiracı listesi sızmaz). Anon politikası açmak
 * yerine sunucu okuması — form kimliği bilinmeden hiçbir şey görülemez.
 */
export async function getPublicVisaForm(formId: string): Promise<VisaApplicationForm | null> {
  if (!/^[0-9a-f-]{36}$/i.test(formId)) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin.from("visa_form").select(FORM_SELECT).eq("id", formId).maybeSingle();
  return data ? rowToForm(data as unknown as Parameters<typeof rowToForm>[0]) : null;
}
