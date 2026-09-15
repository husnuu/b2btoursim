"use server";

import { getSessionState } from "@/lib/auth/session";
import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import type { VisaDraft } from "@/lib/visa";

/**
 * Vize ürününü `visa_product` tablosuna yazar — `boats/publish.ts` ile
 * aynı kalıp. Kimlik UUID; taslak ile satır aynı kimliği taşır. Başvuru
 * formları ve başvurular (B akışı) hâlâ tarayıcıda; taşındıkça eklenir.
 */
export type PublishResult = { ok: true; visaId: string } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const nonNeg = (n: number | null | undefined): number | null => (n != null && n >= 0 ? Math.round(n) : null);

export async function syncVisa(draft: VisaDraft): Promise<PublishResult> {
  if (!UUID.test(draft.id)) return { ok: false, error: "legacy_id" };

  const session = await getSessionState();
  if (session.kind !== "ready") return { ok: false, error: "auth" };
  const { tenantId } = session.claims;
  const supabase = await createClient();

  let agencyId = session.claims.agencyId;
  if (!agencyId) {
    const { data: master } = await supabase
      .from("agency").select("id").eq("tenant_id", tenantId).eq("type", "master").limit(1).maybeSingle();
    agencyId = master?.id ?? null;
  }
  if (!agencyId) return { ok: false, error: "agency" };

  const min = nonNeg(draft.processingDaysMin);
  const max = nonNeg(draft.processingDaysMax);
  const { data: row, error } = await supabase
    .from("visa_product")
    .upsert(
      {
        id: draft.id,
        tenant_id: tenantId,
        agency_id: agencyId,
        status: draft.status,
        title: draft.title.trim() || "Yeni vize",
        country: draft.country,
        description: draft.description,
        price: Math.max(0, Math.round(draft.price)),
        currency: draft.currency,
        processing_days_min: min,
        // Aralık kısıtı: maks < min ise maks düşer.
        processing_days_max: max != null && min != null && max < min ? null : max,
        required_documents: draft.requiredDocuments,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("id")
    .single();

  if (error || !row) {
    log.warn("visa.sync.failed", { tenantId, code: error?.code, message: error?.message });
    return { ok: false, error: error?.code ?? "unknown" };
  }
  log.info("visa.sync", { tenantId, visaId: row.id, status: draft.status });
  return { ok: true, visaId: row.id };
}
