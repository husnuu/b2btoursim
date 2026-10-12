"use server";

import { getWorkingAgency } from "@/lib/auth/agency";
import { listTenantToursForSearch } from "@/lib/storefront/tours";
import { createClient } from "@/lib/supabase/server";
import type { SearchResult, Supplier, SupplierProgress } from "@/lib/types";

/**
 * Operatör araması — kaynaklar: kendi envanteri (tur tablosu), onaylı
 * kontratla satın alınan pazaryeri listelemeleri ve dış tedarikçi
 * adaptörleri (bağlı adaptör yoksa boş yanıt, "yanıt verdi: 0").
 *
 * Kademeli yükleme sözleşmesi korunur: her kaynak kendi durumunu taşır,
 * biri düşerse arama çökmez. Şu an tüm kaynaklar tek sunucu turunda
 * çözülür; SSE'ye geçildiğinde bu şekil değişmez.
 */
export type SearchInput = { kind: "tour" | "hotel"; destination: string; date: string; adults: number; children: number };
export type SearchOutput = { results: SearchResult[]; progress: SupplierProgress[] };

const OWN: Supplier = { id: "own", name: "Kendi envanteri", code: "KE", adapterType: "own_contracted", status: "active", credentialsRef: "", uptimePct: 100, avgLatencyMs: 0, errorRatePct: 0 };
const MP: Supplier = { id: "mp", name: "Pazaryeri", code: "MP", adapterType: "marketplace", status: "active", credentialsRef: "", uptimePct: 100, avgLatencyMs: 0, errorRatePct: 0 };

const norm = (s: string) => s.toLocaleLowerCase("tr").trim();

export async function searchInventory(input: SearchInput): Promise<SearchOutput> {
  const agency = await getWorkingAgency();
  if (!agency) return { results: [], progress: [] };
  const { tenantId, agencyId } = agency;
  const db = await createClient();
  const started = Date.now();
  const q = norm(input.destination);

  const [own, contracts, suppliers] = await Promise.all([
    input.kind === "tour" ? listTenantToursForSearch(tenantId) : Promise.resolve([] as SearchResult[]),
    db.from("marketplace_contract").select("id, supplier_agency_id, agreed_pricing_rule_id, marketplace_pricing_rule(model, commission_pct)").eq("seller_agency_id", agencyId).eq("status", "onaylandi"),
    db.from("supplier").select("id, name, code, adapter_type, status, credentials_ref").eq("tenant_id", tenantId).neq("adapter_type", "marketplace").neq("status", "disabled"),
  ]);

  // Kendi envanteri: hedef metni başlık/açıklamada geçen ya da hedef boşsa hepsi.
  const ownHits = own.filter((r) => !q || norm(r.title).includes(q));

  // Anlaşmalı otel kataloğu (`supplier_product`, type = hotel): her oda varyantı bir sonuç.
  let hotelHits: SearchResult[] = [];
  if (input.kind === "hotel") {
    type HRow = {
      id: string; title: string; summary: string; destination: string; stars: number | null; address: string | null; rating: number | string | null; review_count: number; image_tone: string | null;
      cancellation_type: "free" | "nonRefundable"; cancellation_hours_before: number | null;
      supplier: { id: string; name: string; code: string; adapter_type: Supplier["adapterType"]; status: Supplier["status"]; credentials_ref: string | null } | { id: string; name: string; code: string; adapter_type: Supplier["adapterType"]; status: Supplier["status"]; credentials_ref: string | null }[] | null;
      supplier_product_variant: { id: string; name: string; starts_at: string; base_price: number; currency: string; board: SearchResult["board"] | null; room_type: string | null; inventory: { quantity_available: number; stop_sale: boolean } | { quantity_available: number; stop_sale: boolean }[] | null }[];
    };
    const { data } = await db
      .from("supplier_product")
      .select("id, title, summary, destination, stars, address, rating, review_count, image_tone, cancellation_type, cancellation_hours_before, supplier(id, name, code, adapter_type, status, credentials_ref), supplier_product_variant(id, name, starts_at, base_price, currency, board, room_type, inventory(quantity_available, stop_sale))")
      .eq("tenant_id", tenantId)
      .eq("type", "hotel")
      .limit(100);
    const one = <T,>(x: T | T[] | null): T | null => (Array.isArray(x) ? x[0] ?? null : x);
    const target = input.date ? new Date(input.date).getTime() : Date.now();
    for (const h of (data ?? []) as unknown as HRow[]) {
      if (q && !norm(h.title).includes(q) && !norm(h.destination).includes(q)) continue;
      const sup = one(h.supplier);
      const supplier: Supplier = sup
        ? { id: sup.id, name: sup.name, code: sup.code, adapterType: sup.adapter_type, status: sup.status, credentialsRef: sup.credentials_ref ?? "", uptimePct: 100, avgLatencyMs: 0, errorRatePct: 0 }
        : OWN;
      // Her oda tipi için aranan tarihe en yakın (o gün ya da sonrası) varyant.
      const byRoom = new Map<string, HRow["supplier_product_variant"][number]>();
      for (const v of [...h.supplier_product_variant].sort((a, b) => a.starts_at.localeCompare(b.starts_at))) {
        const inv = one(v.inventory);
        if (inv?.stop_sale || (inv?.quantity_available ?? 0) <= 0) continue;
        if (new Date(v.starts_at).getTime() < target - 86_400_000) continue;
        const key = v.room_type ?? v.name;
        if (!byRoom.has(key)) byRoom.set(key, v);
      }
      for (const v of byRoom.values()) {
        const inv = one(v.inventory);
        hotelHits.push({
          id: v.id,
          productId: h.id,
          type: "hotel",
          title: h.title,
          supplier,
          startsAt: v.starts_at,
          durationMinutes: 0,
          languages: ["TR", "EN"],
          cancellation: h.cancellation_type === "free" ? { type: "free", hoursBefore: h.cancellation_hours_before ?? 24 } : { type: "nonRefundable" },
          net: Number(v.base_price),
          defaultMarginPct: 15,
          rating: h.rating == null ? undefined : Number(h.rating),
          reviewCount: h.review_count,
          remaining: inv?.quantity_available,
          instantConfirm: true,
          imageTone: h.image_tone ?? "oklch(0.62 0.09 40)",
          currency: v.currency,
          stars: h.stars ?? undefined,
          board: v.board ?? undefined,
          roomType: v.room_type ?? v.name,
          district: h.address ?? h.destination,
        });
      }
    }
    hotelHits = hotelHits.sort((a, b) => a.net - b.net);
  }

  // Pazaryeri: onaylı kontratların aktif tur listelemeleri.
  type CRow = { id: string; supplier_agency_id: string; agreed_pricing_rule_id: string | null; marketplace_pricing_rule: { model: "komisyon" | "netFiyat"; commission_pct: number | string | null } | { model: "komisyon" | "netFiyat"; commission_pct: number | string | null }[] | null };
  const crow = (contracts.data ?? []) as unknown as CRow[];
  const supplierIds = crow.map((c) => c.supplier_agency_id);
  let mpHits: SearchResult[] = [];
  if (supplierIds.length && input.kind === "tour") {
    const [listings, agencies] = await Promise.all([
      db.from("marketplace_listing").select("id, supplier_agency_id, kind, title, list_price, currency, destination, image_tone, marketplace_pricing_rule(model, commission_pct, net_amount)").in("supplier_agency_id", supplierIds).eq("is_active", true).eq("kind", "tur"),
      db.from("marketplace_profile").select("agency_id, agency(name)").in("agency_id", supplierIds),
    ]);
    type LRow = { id: string; supplier_agency_id: string; kind: string; title: string; list_price: number; currency: string; destination: string; image_tone: string | null; marketplace_pricing_rule: { model: "komisyon" | "netFiyat"; commission_pct: number | string | null; net_amount: number | null } | null };
    type ARow = { agency_id: string; agency: { name: string } | { name: string }[] | null };
    const names = new Map((agencies.data as unknown as ARow[] ?? []).map((a) => [a.agency_id, Array.isArray(a.agency) ? a.agency[0]?.name : a.agency?.name]));
    const one = <T,>(x: T | T[] | null): T | null => (Array.isArray(x) ? x[0] ?? null : x);
    mpHits = ((listings.data ?? []) as unknown as LRow[])
      .filter((l) => !q || norm(l.title).includes(q) || norm(l.destination).includes(q))
      .map((l) => {
        const c = crow.find((x) => x.supplier_agency_id === l.supplier_agency_id)!;
        const agreed = one(c.marketplace_pricing_rule);
        const rule = agreed ?? l.marketplace_pricing_rule;
        const net = rule?.model === "netFiyat" ? Number(l.marketplace_pricing_rule?.net_amount ?? l.list_price) : Number(l.list_price);
        return {
          id: `mp-${l.id}`,
          productId: `mp-${l.id}`,
          type: "tour" as const,
          title: l.title,
          supplier: MP,
          startsAt: `${input.date}T09:00:00.000Z`,
          durationMinutes: 0,
          languages: ["TR"],
          cancellation: { type: "free" as const, hoursBefore: 48 },
          net,
          defaultMarginPct: rule?.model === "komisyon" ? 0 : 15,
          instantConfirm: false,
          imageTone: l.image_tone ?? "oklch(0.62 0.09 200)",
          marketplace: { agencyName: names.get(l.supplier_agency_id) ?? "Pazaryeri acentesi", contractId: c.id, model: rule?.model ?? "komisyon", commissionPct: rule?.commission_pct == null ? null : Number(rule.commission_pct) },
        };
      });
  }

  const elapsed = Date.now() - started;
  const progress: SupplierProgress[] = [
    { supplier: OWN, state: "responded", resultCount: ownHits.length, latencyMs: elapsed },
    { supplier: MP, state: "responded", resultCount: mpHits.length, latencyMs: elapsed },
    // Dış adaptörler: bağlantı katmanı yok; "yanıt verdi, 0 sonuç" yerine dürüstçe "başarısız" işaretlenir.
    ...(suppliers.data ?? []).map((s) => {
      const count = hotelHits.filter((h) => h.supplier.id === s.id).length;
      return {
        supplier: { id: s.id, name: s.name, code: s.code, adapterType: s.adapter_type, status: s.status, credentialsRef: s.credentials_ref ?? "", uptimePct: 100, avgLatencyMs: 0, errorRatePct: 0 } as Supplier,
        // Anlaşmalı katalog (own_contracted) veritabanından yanıt verir; bağlantı katmanı olmayan adaptörler dürüstçe "başarısız".
        state: s.adapter_type === "own_contracted" ? ("responded" as const) : ("failed" as const),
        resultCount: count,
        latencyMs: s.adapter_type === "own_contracted" ? elapsed : undefined,
      };
    }),
  ];
  return { results: [...ownHits, ...hotelHits, ...mpHits], progress };
}
