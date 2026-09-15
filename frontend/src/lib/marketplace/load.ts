import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Contract, ContractListing, MarketplaceAccess, MarketplaceListing, MarketplacePricingRule, MarketplaceProfile } from "@/lib/marketplace";

/** Pazaryerindeki diğer acenteler — görünür profiller (RLS süzer). */
export type PeerAgency = {
  id: string;
  name: string;
  city: string;
  country: string;
  description: string;
  listingCount: number;
  defaultModel: "komisyon" | "netFiyat";
  imageTone: string;
};

export type MarketplaceState = {
  agencyId: string;
  currency: string;
  profile: MarketplaceProfile | null;
  listings: MarketplaceListing[];
  contracts: Contract[];
  contractListings: ContractListing[];
  access: MarketplaceAccess;
  peers: PeerAgency[];
};

type RuleRow = { id: string; model: "komisyon" | "netFiyat"; commission_pct: number | string | null; net_amount: number | null; currency: string };
const one = <T,>(x: T | T[] | null | undefined): T | null => (Array.isArray(x) ? x[0] ?? null : x ?? null);
const toRule = (r: RuleRow | null, fallback: string): MarketplacePricingRule =>
  r
    ? { id: r.id, model: r.model, commissionPct: r.commission_pct == null ? null : Number(r.commission_pct), netAmount: r.net_amount == null ? null : Number(r.net_amount), currency: r.currency }
    : { id: "", model: "komisyon", commissionPct: 15, netAmount: null, currency: fallback };

function toneFor(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `oklch(0.55 0.08 ${h})`;
}

export async function loadMarketplaceState(tenantId: string, agencyId: string): Promise<MarketplaceState> {
  const db = await createClient();
  const [agency, profile, listings, contracts, access, profiles] = await Promise.all([
    db.from("agency").select("currency").eq("id", agencyId).maybeSingle(),
    db.from("marketplace_profile").select("agency_id, country, city, description, contact_email, contact_phone, is_visible, setup_completed_at, marketplace_pricing_rule(id, model, commission_pct, net_amount, currency)").eq("agency_id", agencyId).maybeSingle(),
    db.from("marketplace_listing").select("id, supplier_agency_id, kind, tour_id, vehicle_id, title, is_active, list_price, currency, destination, image_tone, shared_at, marketplace_pricing_rule(id, model, commission_pct, net_amount, currency)").order("shared_at", { ascending: false }),
    db.from("marketplace_contract").select("id, supplier_agency_id, seller_agency_id, status, message, requested_at, decided_at, marketplace_pricing_rule(id, model, commission_pct, net_amount, currency), marketplace_contract_listing(listing_id)").order("requested_at", { ascending: false }),
    db.from("marketplace_access").select("agency_id, active, via_plan, valid_until").eq("agency_id", agencyId).maybeSingle(),
    db.from("marketplace_profile").select("agency_id, country, city, description, is_visible, marketplace_pricing_rule(model), agency(name)").eq("is_visible", true).neq("agency_id", agencyId),
  ]);
  const currency = agency.data?.currency ?? "TRY";

  type PRow = { agency_id: string; country: string; city: string; description: string; contact_email: string | null; contact_phone: string | null; is_visible: boolean; setup_completed_at: string | null; marketplace_pricing_rule: RuleRow | RuleRow[] | null };
  const p = profile.data as unknown as PRow | null;

  type LRow = { id: string; supplier_agency_id: string; kind: "tur" | "arac"; tour_id: string | null; vehicle_id: string | null; title: string; is_active: boolean; list_price: number; currency: string; destination: string; image_tone: string | null; shared_at: string; marketplace_pricing_rule: RuleRow | RuleRow[] | null };
  const ls = ((listings.data ?? []) as unknown as LRow[]).map((l) => ({
    id: l.id, supplierAgencyId: l.supplier_agency_id, kind: l.kind, tourId: l.tour_id, vehicleId: l.vehicle_id, title: l.title, isActive: l.is_active,
    pricing: toRule(one(l.marketplace_pricing_rule), l.currency), listPrice: Number(l.list_price), currency: l.currency, destination: l.destination,
    imageTone: l.image_tone ?? toneFor(l.id), sharedAt: l.shared_at,
  }));

  type CRow = { id: string; supplier_agency_id: string; seller_agency_id: string; status: Contract["status"]; message: string | null; requested_at: string; decided_at: string | null; marketplace_pricing_rule: RuleRow | RuleRow[] | null; marketplace_contract_listing: { listing_id: string }[] };
  const cs = (contracts.data ?? []) as unknown as CRow[];

  type PeerRow = { agency_id: string; country: string; city: string; description: string; marketplace_pricing_rule: { model: "komisyon" | "netFiyat" } | { model: "komisyon" | "netFiyat" }[] | null; agency: { name: string } | { name: string }[] | null };
  const counts = new Map<string, number>();
  for (const l of ls) if (l.isActive) counts.set(l.supplierAgencyId, (counts.get(l.supplierAgencyId) ?? 0) + 1);

  return {
    agencyId,
    currency,
    profile: p
      ? { agencyId: p.agency_id, country: p.country, city: p.city, description: p.description, contactEmail: p.contact_email, contactPhone: p.contact_phone, defaultPricing: toRule(one(p.marketplace_pricing_rule), currency), isVisible: p.is_visible, setupCompletedAt: p.setup_completed_at }
      : null,
    listings: ls,
    contracts: cs.map((c) => ({ id: c.id, supplierAgencyId: c.supplier_agency_id, sellerAgencyId: c.seller_agency_id, status: c.status, requestedAt: c.requested_at, decidedAt: c.decided_at, message: c.message, agreedPricing: one(c.marketplace_pricing_rule) ? toRule(one(c.marketplace_pricing_rule), currency) : null })),
    contractListings: cs.flatMap((c) => c.marketplace_contract_listing.map((x) => ({ contractId: c.id, listingId: x.listing_id }))),
    access: access.data ? { agencyId, active: access.data.active && (!access.data.valid_until || access.data.valid_until > new Date().toISOString()), viaPlan: access.data.via_plan, validUntil: access.data.valid_until } : { agencyId, active: false, viaPlan: null, validUntil: null },
    peers: ((profiles.data ?? []) as unknown as PeerRow[]).map((x) => ({
      id: x.agency_id, name: one(x.agency)?.name ?? "Acente", city: x.city, country: x.country, description: x.description,
      listingCount: counts.get(x.agency_id) ?? 0, defaultModel: one(x.marketplace_pricing_rule)?.model ?? "komisyon", imageTone: toneFor(x.agency_id),
    })),
  };
}
