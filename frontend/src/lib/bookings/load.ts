import "server-only";

import { BOOKING_STATUSES, STATUS_META, type BookingStatus } from "@/lib/booking-status";
import { createClient } from "@/lib/supabase/server";
import type { Booking, BookingItem, Supplier } from "@/lib/types";

/**
 * Tek rezervasyon tablosu → arayüz tipi. Kendi envanterinden satılan
 * satırlarda dış tedarikçi yoktur; "KE" (kendi envanteri) işareti çizilir.
 */
export function fromApiStatus(api: string): BookingStatus {
  return BOOKING_STATUSES.find((s) => STATUS_META[s].apiValue === api) ?? "pending";
}

const SELECT = `
  id, ref, agency_id, status, currency, fx_rate_locked, created_at, travel_date, note,
  customer(id, agency_id, full_name, email, phone),
  supplier(id, name, code, adapter_type, status, credentials_ref),
  agency(name),
  booking_item(id, item_kind, supplier_variant_id, tour_id, vehicle_id, boat_id, villa_id, visa_product_id,
    title_snapshot, variant_name_snapshot, starts_at, quantity, unit_net_price, margin_pct, supplier_reference, status)
`;

type Row = {
  id: string; ref: string; agency_id: string; status: string; currency: string; fx_rate_locked: number | string | null;
  created_at: string; travel_date: string | null; note: string | null;
  customer: { id: string; agency_id: string; full_name: string; email: string | null; phone: string | null } | null;
  supplier: { id: string; name: string; code: string; adapter_type: Supplier["adapterType"]; status: Supplier["status"]; credentials_ref: string | null } | null;
  agency: { name: string } | null;
  booking_item: {
    id: string; item_kind: string; supplier_variant_id: string | null; tour_id: string | null; vehicle_id: string | null; boat_id: string | null;
    villa_id: string | null; visa_product_id: string | null; title_snapshot: string; variant_name_snapshot: string | null; starts_at: string | null;
    quantity: number; unit_net_price: number; margin_pct: number | string; supplier_reference: string | null; status: string;
  }[];
};

export function selfSupplier(name: string): Supplier {
  return { id: "self", name, code: "KE", adapterType: "own_contracted", status: "active", credentialsRef: "", uptimePct: 100, avgLatencyMs: 0, errorRatePct: 0 };
}

const KIND_LABEL: Record<string, string> = { tour: "Tur", transfer: "Transfer", boat: "Tekne", villa: "Villa", visa: "Vize", supplier_product: "Tedarikçi ürünü" };

export function rowToBooking(r: Row, tenantId: string): Booking {
  const items: BookingItem[] = r.booking_item.map((i) => ({
    id: i.id,
    variantId: i.supplier_variant_id ?? i.id,
    productId: i.tour_id ?? i.boat_id ?? i.villa_id ?? i.vehicle_id ?? i.visa_product_id ?? i.supplier_variant_id ?? "",
    title: i.title_snapshot,
    variantName: i.variant_name_snapshot ?? KIND_LABEL[i.item_kind] ?? i.item_kind,
    startsAt: i.starts_at ?? r.travel_date ?? r.created_at,
    quantity: i.quantity,
    unitPrice: Number(i.unit_net_price),
    marginPct: Number(i.margin_pct),
    supplierReference: i.supplier_reference,
    status: fromApiStatus(i.status),
  }));
  return {
    id: r.id,
    ref: r.ref,
    tenantId,
    agencyId: r.agency_id,
    customer: {
      id: r.customer?.id ?? "",
      agencyId: r.customer?.agency_id ?? r.agency_id,
      fullName: r.customer?.full_name ?? "—",
      email: r.customer?.email ?? null,
      phone: r.customer?.phone ?? null,
      passportNo: null,
    },
    supplier: r.supplier
      ? { id: r.supplier.id, name: r.supplier.name, code: r.supplier.code, adapterType: r.supplier.adapter_type, status: r.supplier.status, credentialsRef: r.supplier.credentials_ref ?? "", uptimePct: 100, avgLatencyMs: 0, errorRatePct: 0 }
      : selfSupplier(r.agency?.name ?? "Kendi envanteri"),
    status: fromApiStatus(r.status),
    currency: r.currency,
    fxRateLocked: r.fx_rate_locked == null ? null : Number(r.fx_rate_locked),
    createdAt: r.created_at,
    travelDate: r.travel_date ?? r.created_at,
    items: items.length ? items : [{ id: `${r.id}-empty`, variantId: "", productId: "", title: "—", variantName: "", startsAt: r.created_at, quantity: 1, unitPrice: 0, marginPct: 0, supplierReference: null, status: fromApiStatus(r.status) }],
    note: r.note,
  };
}

/** Kiracının rezervasyonları; alt acente kullanıcısı yalnız kendi acentesini görür. */
export async function listTenantBookings(tenantId: string, agencyId?: string | null): Promise<Booking[]> {
  const db = await createClient();
  let q = db.from("booking").select(SELECT).eq("tenant_id", tenantId).neq("status", "DRAFT").order("created_at", { ascending: false }).limit(500);
  if (agencyId) q = q.eq("agency_id", agencyId);
  const { data } = await q;
  return ((data ?? []) as unknown as Row[]).map((r) => rowToBooking(r, tenantId));
}

export async function getTenantBookingByRef(tenantId: string, ref: string): Promise<Booking | null> {
  const db = await createClient();
  const { data } = await db.from("booking").select(SELECT).eq("tenant_id", tenantId).eq("ref", ref).maybeSingle();
  return data ? rowToBooking(data as unknown as Row, tenantId) : null;
}
