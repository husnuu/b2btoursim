import "server-only";

import { emptyVisaDraft, type VisaDraft } from "@/lib/visa";
import { createClient } from "@/lib/supabase/server";

/** `visa_product` satırı → sihirbaz taslağı; `syncVisa`'nın tersi. */
const SELECT = "id, status, title, country, description, price, currency, processing_days_min, processing_days_max, required_documents, created_at, updated_at";

type Row = {
  id: string; status: VisaDraft["status"]; title: string; country: string; description: string;
  price: number; currency: string; processing_days_min: number | null; processing_days_max: number | null;
  required_documents: string[]; created_at: string; updated_at: string;
};

export function rowToVisa(r: Row): VisaDraft {
  return {
    ...emptyVisaDraft(r.id, r.created_at),
    status: r.status,
    title: r.title,
    country: r.country,
    description: r.description,
    price: Number(r.price),
    currency: r.currency,
    processingDaysMin: r.processing_days_min,
    processingDaysMax: r.processing_days_max,
    requiredDocuments: r.required_documents ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listTenantVisas(tenantId: string): Promise<VisaDraft[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("visa_product")
    .select(SELECT)
    .eq("tenant_id", tenantId)
    .neq("status", "arsivlendi")
    .order("updated_at", { ascending: false });
  return ((data ?? []) as unknown as Row[]).map(rowToVisa);
}
