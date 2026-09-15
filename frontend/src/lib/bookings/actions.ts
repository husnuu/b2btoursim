"use server";

import { revalidatePath } from "next/cache";
import { getSessionState } from "@/lib/auth/session";
import { canTransition, STATUS_META, type BookingStatus } from "@/lib/booking-status";
import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import { fromApiStatus } from "./load";

export type TransitionResult = { ok: true } | { ok: false; error: "auth" | "not_found" | "invalid_transition" | string };

/**
 * Durum makinesi geçişi: `booking.status` + satırlar + geçmiş kaydı.
 * Geçerlilik `canTransition` ile sunucuda da denetlenir; arayüzdeki
 * düğme listesi yetki değil, kısayoldur.
 */
export async function transitionBooking(bookingId: string, next: BookingStatus): Promise<TransitionResult> {
  const session = await getSessionState();
  if (session.kind !== "ready") return { ok: false, error: "auth" };
  const { tenantId, appUserId } = session.claims;
  const db = await createClient();

  const { data: current } = await db.from("booking").select("id, status").eq("id", bookingId).eq("tenant_id", tenantId).maybeSingle();
  if (!current) return { ok: false, error: "not_found" };
  const from = fromApiStatus(current.status);
  if (!canTransition(from, next)) return { ok: false, error: "invalid_transition" };

  const api = STATUS_META[next].apiValue as "DRAFT" | "PENDING" | "CONFIRMED" | "PARTIALLY_CANCELLED" | "CANCELLED" | "REFUNDED" | "FAILED" | "COMPLETED";
  const now = new Date().toISOString();
  const { error } = await db
    .from("booking")
    .update({ status: api, updated_at: now, confirmed_at: next === "confirmed" ? now : undefined, cancelled_at: next === "cancelled" ? now : undefined })
    .eq("id", bookingId)
    .eq("tenant_id", tenantId);
  if (error) {
    log.warn("booking.transition.failed", { tenantId, bookingId, code: error.code });
    return { ok: false, error: error.code };
  }
  // Tam iptal/onay/tamamlanma satırlara da iner; kısmi iptal satır bazında ayrı yönetilir.
  if (next === "cancelled" || next === "confirmed" || next === "completed" || next === "failed" || next === "refunded") {
    await db.from("booking_item").update({ status: api }).eq("booking_id", bookingId).eq("tenant_id", tenantId);
  }
  await db.from("booking_status_history").insert({ tenant_id: tenantId, booking_id: bookingId, from_status: current.status as typeof api, to_status: api, changed_by: appUserId });
  log.info("booking.transition", { tenantId, bookingId, from, to: next });
  revalidatePath("/extranet/rezervasyonlar");
  revalidatePath("/extranet");
  return { ok: true };
}
