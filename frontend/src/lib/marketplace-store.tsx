"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContractStatus, MarketplaceListing, MarketplacePricingRule, MarketplaceProfile } from "./marketplace";
import type { MarketplaceState, PeerAgency } from "./marketplace/load";
import {
  requestMarketplaceContract, saveMarketplaceProfile, setMarketplaceContractStatus, setMarketplaceListingPricing,
  setMarketplaceVisibility, shareMarketplaceListing, toggleMarketplaceListing,
} from "./marketplace/actions";

/**
 * Pazaryeri durumu: KAYNAK VERİTABANI (`loadMarketplaceState` → `initial`).
 * Eylemler iyimser uygulanır, sunucu eylemi yazar, sayfa tazelenir.
 * Sekme deposu yok: kontratın iki tarafı farklı kiracılarda, yerel kopya
 * yanıltır.
 */
export type { PeerAgency };

type Ctx = MarketplaceState & {
  myListings: MarketplaceListing[];
  peerListings: MarketplaceListing[];
  acquiredListings: MarketplaceListing[];
  peerById: (id: string) => PeerAgency | undefined;
  saveProfile: (p: MarketplaceProfile) => void;
  setVisibility: (v: boolean) => void;
  toggleListing: (id: string) => void;
  setListingPricing: (id: string, pricing: MarketplacePricingRule) => void;
  shareOwn: (listing: MarketplaceListing) => void;
  requestContract: (supplierAgencyId: string, message: string) => void;
  setContractStatus: (id: string, status: ContractStatus) => void;
};

const C = createContext<Ctx | null>(null);

export function MarketplaceProvider({ initial, children }: { initial: MarketplaceState; children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<MarketplaceState>(initial);
  // Sunucu tazelenince (router.refresh) yeni durum kazanır; render sırasında türetilir.
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    setState(initial);
  }

  const after = useCallback(
    (p: Promise<{ ok: boolean }>) => {
      void p.then(() => router.refresh());
    },
    [router],
  );

  const saveProfile = useCallback(
    (profile: MarketplaceProfile) => {
      setState((s) => ({ ...s, profile: { ...profile, agencyId: s.agencyId, setupCompletedAt: profile.setupCompletedAt ?? new Date().toISOString() } }));
      after(saveMarketplaceProfile(profile));
    },
    [after],
  );
  const setVisibility = useCallback(
    (isVisible: boolean) => {
      setState((s) => (s.profile ? { ...s, profile: { ...s.profile, isVisible } } : s));
      after(setMarketplaceVisibility(isVisible));
    },
    [after],
  );
  const toggleListing = useCallback(
    (id: string) => {
      const cur = state.listings.find((l) => l.id === id);
      if (!cur) return;
      setState((s) => ({ ...s, listings: s.listings.map((l) => (l.id === id ? { ...l, isActive: !l.isActive } : l)) }));
      after(toggleMarketplaceListing(id, !cur.isActive));
    },
    [after, state.listings],
  );
  const setListingPricing = useCallback(
    (id: string, pricing: MarketplacePricingRule) => {
      setState((s) => ({ ...s, listings: s.listings.map((l) => (l.id === id ? { ...l, pricing } : l)) }));
      after(setMarketplaceListingPricing(id, pricing));
    },
    [after],
  );
  const shareOwn = useCallback(
    (listing: MarketplaceListing) => {
      const withId = { ...listing, id: /^[0-9a-f-]{36}$/i.test(listing.id) ? listing.id : crypto.randomUUID(), supplierAgencyId: state.agencyId };
      setState((s) => ({ ...s, listings: [withId, ...s.listings] }));
      after(shareMarketplaceListing(withId));
    },
    [after, state.agencyId],
  );
  const requestContract = useCallback(
    (supplierAgencyId: string, message: string) => {
      setState((s) => ({
        ...s,
        contracts: [{ id: `pending-${supplierAgencyId}`, supplierAgencyId, sellerAgencyId: s.agencyId, status: "beklemede", requestedAt: new Date().toISOString(), decidedAt: null, message: message || null, agreedPricing: null }, ...s.contracts],
      }));
      after(requestMarketplaceContract(supplierAgencyId, message));
    },
    [after],
  );
  const setContractStatus = useCallback(
    (id: string, status: ContractStatus) => {
      setState((s) => ({ ...s, contracts: s.contracts.map((c) => (c.id === id ? { ...c, status, decidedAt: new Date().toISOString() } : c)) }));
      after(setMarketplaceContractStatus(id, status));
    },
    [after],
  );

  const value = useMemo<Ctx>(() => {
    const myListings = state.listings.filter((l) => l.supplierAgencyId === state.agencyId);
    const peerListings = state.listings.filter((l) => l.supplierAgencyId !== state.agencyId);
    const approved = new Set(state.contracts.filter((c) => c.status === "onaylandi" && c.sellerAgencyId === state.agencyId).map((c) => c.supplierAgencyId));
    const peers = new Map(state.peers.map((p) => [p.id, p]));
    return {
      ...state,
      myListings,
      peerListings,
      acquiredListings: peerListings.filter((l) => approved.has(l.supplierAgencyId)),
      peerById: (id: string) => peers.get(id),
      saveProfile, setVisibility, toggleListing, setListingPricing, shareOwn, requestContract, setContractStatus,
    };
  }, [state, saveProfile, setVisibility, toggleListing, setListingPricing, shareOwn, requestContract, setContractStatus]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useMarketplace() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useMarketplace, MarketplaceProvider içinde çağrılmalı");
  return ctx;
}
