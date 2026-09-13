import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type StorefrontOrder = {
  ref: string;
  status: string;
  currency: string;
  createdAt: string;
  customer: { fullName: string; email: string | null };
  items: { title: string; startsAt: string | null; quantity: number; unitPrice: number }[];
  total: number;
};

/**
 * Onay sayfası için sipariş. Referans tahmin edilebilir değil (rastgele 6
 * karakter) ve kiracıya bağlı; yine de yalnız ad/tutar/kalem gösterilir,
 * telefon ve adres gösterilmez.
 */
export async function getStorefrontOrder(tenantId: string, ref: string): Promise<StorefrontOrder | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("booking")
    .select(
      "ref, status, currency, created_at, customer:customer(full_name, email), booking_item(title_snapshot, starts_at, quantity, unit_net_price)",
    )
    .eq("tenant_id", tenantId)
    .eq("ref", ref)
    .maybeSingle();
  if (!data) return null;
  const customer = Array.isArray(data.customer) ? data.customer[0] : data.customer;
  const items = data.booking_item.map((i) => ({
    title: i.title_snapshot,
    startsAt: i.starts_at,
    quantity: i.quantity,
    unitPrice: i.unit_net_price,
  }));
  return {
    ref: data.ref,
    status: data.status,
    currency: data.currency,
    createdAt: data.created_at,
    customer: { fullName: customer?.full_name ?? "", email: customer?.email ?? null },
    items,
    total: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
  };
}
