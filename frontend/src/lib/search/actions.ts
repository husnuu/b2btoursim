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
    ...(suppliers.data ?? []).map((s) => ({
      supplier: { id: s.id, name: s.name, code: s.code, adapterType: s.adapter_type, status: s.status, credentialsRef: s.credentials_ref ?? "", uptimePct: 100, avgLatencyMs: 0, errorRatePct: 0 } as Supplier,
      state: "failed" as const,
      resultCount: 0,
    })),
  ];
  return { results: [...ownHits, ...mpHits], progress };
}
