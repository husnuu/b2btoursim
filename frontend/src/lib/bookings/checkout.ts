"use server";

import { revalidatePath } from "next/cache";
import { getWorkingAgency } from "@/lib/auth/agency";
import { log } from "@/lib/log";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CartLine } from "@/lib/types";

export type CheckoutResult = { ok: true; ref: string; total: number; currency: string } | { ok: false; error: string };

/**
 * Operatör checkout'u: sepet → tek rezervasyon. Fiyat ve kontenjan sunucu
 * fonksiyonunda (vitrinle aynı RPC); satır marjı satış fiyatını türetir.
 * Kendi envanterinde onay beklenmez: CONFIRMED açılır, cari deftere düşer.
 * Pazaryeri satırları henüz bağlı değil (satır hedefi karşı kiracının
 * turu; tipli FK bunu ayrı bir varlık ister).
 */
export async function createOperatorBooking(input: { lead: { name: string; email: string; phone: string; note: string }; lines: CartLine[] }): Promise<CheckoutResult> {
  const agency = await getWorkingAgency();
  if (!agency) return { ok: false, error: "auth" };
  if (!input.lines.length) return { ok: false, error: "EMPTY_CART" };
  if (input.lines.some((l) => l.supplier.id === "mp" || l.productId.startsWith("mp-"))) return { ok: false, error: "MARKETPLACE_NOT_LINKED" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "config" };

  const items = input.lines.map((l) => ({
    kind: "tour",
    id: l.productId,
    departure_id: /^[0-9a-f-]{36}$/i.test(l.variantId) ? l.variantId : null,
    adults: l.pax.adults,
    children: l.pax.children,
    margin_pct: Math.max(0, l.marginPct),
    detail: {},
  }));
  const { data, error } = await admin.rpc("create_storefront_booking", {
    p_tenant_id: agency.tenantId,
    p_customer: { full_name: input.lead.name, email: input.lead.email, phone: input.lead.phone },
    p_items: items,
    p_agency_id: agency.agencyId,
    p_status: "CONFIRMED",
    p_note: input.lead.note || undefined,
  });
  if (error || !data?.[0]) {
    const code = (error?.message ?? "").match(/[A-Z_]{4,}/)?.[0] ?? error?.code ?? "unknown";
    log.warn("checkout.failed", { tenantId: agency.tenantId, code });
    return { ok: false, error: code };
  }
  const row = data[0];
  // Defter kaydı: satırlar başlıktan sonra yazıldığı için onay tutarı burada düşer.
  await admin.rpc("booking_ledger_touch", { p_booking_id: row.booking_id });
  log.info("checkout.ok", { tenantId: agency.tenantId, ref: row.ref });
  revalidatePath("/extranet/rezervasyonlar");
  revalidatePath("/extranet");
  return { ok: true, ref: row.ref, total: Number(row.total), currency: row.currency };
}
