"use server";

import { log } from "@/lib/log";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStorefrontTenant } from "./tenant";

/**
 * Vitrinden sipariş. Müşteri anonimdir; yazma yetkisi olmadığı için
 * sunucu, yönetici istemcisiyle veritabanı fonksiyonunu çağırır.
 * Fiyat buradan geçmez — fonksiyon turun güncel fiyatını kendisi okur.
 * Kiracı adresten çözülür; istemcinin kiracı seçme yolu yoktur.
 */
export type OrderKind = "tour" | "boat" | "villa" | "transfer" | "visa";

export type OrderLine = {
  kind?: OrderKind;
  /** Tur/tekne/villa slug ile; araç ve vize kimlikle. */
  slug?: string;
  id?: string;
  /** Tur: kalkış seçildiyse tour_departure.id; "kişi başı" seçeneğinde null. */
  departureId?: string | null;
  adults: number;
  children: number;
  /** Türe özgü alanlar: tekne {from_date, from_time, to_date, to_time, captain},
   *  villa {check_in, check_out}, transfer {date, time, hours, from, to}. */
  detail?: Record<string, string | number | null>;
};

export type OrderResult =
  | { ok: true; ref: string; total: number; currency: string }
  | { ok: false; error: string };

export async function placeStorefrontOrder(input: {
  customer: { fullName: string; email: string; phone: string };
  lines: OrderLine[];
}): Promise<OrderResult> {
  const tenant = await getStorefrontTenant();
  if (!tenant) return { ok: false, error: "NO_TENANT" };

  const fullName = input.customer.fullName.trim();
  const email = input.customer.email.trim();
  if (!fullName || !/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "INVALID_CUSTOMER" };
  if (!input.lines.length) return { ok: false, error: "EMPTY_CART" };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "NO_SECRET_KEY" };

  const { data, error } = await admin.rpc("create_storefront_booking", {
    p_tenant_id: tenant.id,
    p_customer: { full_name: fullName, email, phone: input.customer.phone.trim() },
    p_items: input.lines.map((l) => ({
      kind: l.kind ?? "tour",
      slug: l.slug ?? null,
      id: l.id ?? null,
      departure_id: l.departureId ?? null,
      adults: Math.max(0, Math.floor(l.adults)),
      children: Math.max(0, Math.floor(l.children)),
      detail: l.detail ?? {},
    })),
  });

  if (error || !data || data.length === 0) {
    // Fonksiyonun raise ettiği kod (SOLD_OUT, TOUR_NOT_FOUND ...) mesajda gelir.
    const code = error?.message?.match(/[A-Z_]{4,}/)?.[0] ?? "UNKNOWN";
    log.warn("storefront.order.failed", { tenantId: tenant.id, code, message: error?.message, details: error?.details });
    return { ok: false, error: code };
  }

  const row = data[0];
  log.info("storefront.order", { tenantId: tenant.id, ref: row.ref, total: row.total });
  return { ok: true, ref: row.ref, total: row.total, currency: row.currency };
}
