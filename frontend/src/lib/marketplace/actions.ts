"use server";

import { revalidatePath } from "next/cache";
import { getWorkingAgency } from "@/lib/auth/agency";
import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import type { ContractStatus, MarketplaceListing, MarketplacePricingRule, MarketplaceProfile } from "@/lib/marketplace";

export type MpResult = { ok: true; id?: string } | { ok: false; error: string };

async function ctx() {
  const w = await getWorkingAgency();
  if (!w) return null;
  return { ...w, db: await createClient() };
}

/** Fiyat kuralı satırı: değişmez; her değişiklik yeni satır (kontratlar eskisine bağlı kalır). */
async function insertRule(db: Awaited<ReturnType<typeof createClient>>, tenantId: string, rule: MarketplacePricingRule, currency: string): Promise<string | null> {
  const { data, error } = await db
    .from("marketplace_pricing_rule")
    .insert({
      owner_tenant_id: tenantId, model: rule.model, currency: rule.currency || currency,
      commission_pct: rule.model === "komisyon" ? Math.min(100, Math.max(0, rule.commissionPct ?? 0)) : null,
      net_amount: rule.model === "netFiyat" ? Math.max(0, Math.round(rule.netAmount ?? 0)) : null,
    })
    .select("id")
    .single();
  if (error) log.warn("mp.rule.failed", { code: error.code });
  return data?.id ?? null;
}

const refresh = () => {
  revalidatePath("/extranet/pazaryeri");
  revalidatePath("/extranet/pazaryeri", "layout");
};

export async function saveMarketplaceProfile(profile: MarketplaceProfile): Promise<MpResult> {
  const c = await ctx();
  if (!c) return { ok: false, error: "auth" };
  const { data: agency } = await c.db.from("agency").select("currency").eq("id", c.agencyId).maybeSingle();
  const ruleId = await insertRule(c.db, c.tenantId, profile.defaultPricing, agency?.currency ?? "TRY");
  if (!ruleId) return { ok: false, error: "rule" };
  const { error } = await c.db.from("marketplace_profile").upsert(
    {
      agency_id: c.agencyId, tenant_id: c.tenantId, country: profile.country, city: profile.city, description: profile.description,
      contact_email: profile.contactEmail, contact_phone: profile.contactPhone, default_pricing_rule_id: ruleId, is_visible: profile.isVisible,
      setup_completed_at: profile.setupCompletedAt ?? new Date().toISOString(),
    },
    { onConflict: "agency_id" },
  );
  if (error) return { ok: false, error: error.code };
  refresh();
  return { ok: true };
}

export async function setMarketplaceVisibility(isVisible: boolean): Promise<MpResult> {
  const c = await ctx();
  if (!c) return { ok: false, error: "auth" };
  const { error } = await c.db.from("marketplace_profile").update({ is_visible: isVisible }).eq("agency_id", c.agencyId);
  if (error) return { ok: false, error: error.code };
  refresh();
  return { ok: true };
}

export async function toggleMarketplaceListing(id: string, isActive: boolean): Promise<MpResult> {
  const c = await ctx();
  if (!c) return { ok: false, error: "auth" };
  const { error } = await c.db.from("marketplace_listing").update({ is_active: isActive }).eq("id", id).eq("supplier_tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.code };
  refresh();
  return { ok: true };
}

export async function setMarketplaceListingPricing(id: string, pricing: MarketplacePricingRule): Promise<MpResult> {
  const c = await ctx();
  if (!c) return { ok: false, error: "auth" };
  const ruleId = await insertRule(c.db, c.tenantId, pricing, pricing.currency || "TRY");
  if (!ruleId) return { ok: false, error: "rule" };
  const { error } = await c.db.from("marketplace_listing").update({ pricing_rule_id: ruleId }).eq("id", id).eq("supplier_tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.code };
  refresh();
  return { ok: true };
}

/** Kendi tur/aracını pazaryerine açar; kimlik istemcide üretilmiş olabilir. */
export async function shareMarketplaceListing(listing: MarketplaceListing): Promise<MpResult> {
  const c = await ctx();
  if (!c) return { ok: false, error: "auth" };
  const ruleId = await insertRule(c.db, c.tenantId, listing.pricing, listing.currency);
  if (!ruleId) return { ok: false, error: "rule" };
  const { data, error } = await c.db
    .from("marketplace_listing")
    .insert({
      id: /^[0-9a-f-]{36}$/i.test(listing.id) ? listing.id : undefined,
      supplier_tenant_id: c.tenantId, supplier_agency_id: c.agencyId, kind: listing.kind,
      tour_id: listing.kind === "tur" ? listing.tourId : null, vehicle_id: listing.kind === "arac" ? listing.vehicleId : null,
      title: listing.title, is_active: listing.isActive, pricing_rule_id: ruleId, list_price: Math.max(0, Math.round(listing.listPrice)),
      currency: listing.currency, destination: listing.destination, image_tone: listing.imageTone,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.code ?? "unknown" };
  refresh();
  return { ok: true, id: data.id };
}

export async function requestMarketplaceContract(supplierAgencyId: string, message: string): Promise<MpResult> {
  const c = await ctx();
  if (!c) return { ok: false, error: "auth" };
  const { data: supplier } = await c.db.from("marketplace_profile").select("tenant_id").eq("agency_id", supplierAgencyId).maybeSingle();
  if (!supplier) return { ok: false, error: "supplier" };
  const { data, error } = await c.db
    .from("marketplace_contract")
    .insert({ supplier_tenant_id: supplier.tenant_id, supplier_agency_id: supplierAgencyId, seller_tenant_id: c.tenantId, seller_agency_id: c.agencyId, status: "beklemede", message: message.trim() || null })
    .select("id")
    .single();
  if (error || !data) {
    log.warn("mp.contract.request.failed", { code: error?.code });
    return { ok: false, error: error?.code ?? "unknown" };
  }
  refresh();
  return { ok: true, id: data.id };
}

/** Onayda fiyat şartı donar: tedarikçinin o anki varsayılan kuralı kopyalanır. */
export async function setMarketplaceContractStatus(id: string, status: ContractStatus): Promise<MpResult> {
  const c = await ctx();
  if (!c) return { ok: false, error: "auth" };
  const { data: contract } = await c.db.from("marketplace_contract").select("id, supplier_agency_id, supplier_tenant_id, agreed_pricing_rule_id").eq("id", id).maybeSingle();
  if (!contract) return { ok: false, error: "not_found" };
  let agreed = contract.agreed_pricing_rule_id;
  if (status === "onaylandi" && !agreed) {
    const { data: prof } = await c.db.from("marketplace_profile").select("default_pricing_rule_id").eq("agency_id", contract.supplier_agency_id).maybeSingle();
    agreed = prof?.default_pricing_rule_id ?? null;
    if (!agreed) return { ok: false, error: "no_pricing" };
  }
  const { error } = await c.db
    .from("marketplace_contract")
    .update({ status, decided_at: status === "beklemede" ? null : new Date().toISOString(), agreed_pricing_rule_id: agreed })
    .eq("id", id);
  if (error) return { ok: false, error: error.code };
  // Onaylanan kontratın kapsamı: tedarikçinin o anki aktif listelemeleri.
  if (status === "onaylandi" && contract.supplier_tenant_id === c.tenantId) {
    const { data: ls } = await c.db.from("marketplace_listing").select("id").eq("supplier_agency_id", contract.supplier_agency_id).eq("is_active", true);
    if (ls?.length) await c.db.from("marketplace_contract_listing").upsert(ls.map((l) => ({ contract_id: id, listing_id: l.id })), { onConflict: "contract_id,listing_id", ignoreDuplicates: true });
  }
  refresh();
  return { ok: true };
}
