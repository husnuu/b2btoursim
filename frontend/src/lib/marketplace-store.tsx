"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { AGENCY } from "@/data/mock";
import type {
  Contract,
  ContractListing,
  ContractStatus,
  MarketplaceAccess,
  MarketplaceListing,
  MarketplaceProfile,
  MarketplacePricingRule,
} from "./marketplace";
import { notifySessionChange, useSessionValue, writeSession } from "./session-store";

/**
 * Pazaryeri durumu — sepet ve tur kataloğu gibi **sekme başına**
 * sessionStorage'da (bkz. `cart.tsx`, `tour-store.tsx`). Backend
 * bağlandığında bu dosya silinir, `marketplace.ts` tipleri kalır.
 */

const KEY = "kontuar.pazaryeri.v1";

/** Pazaryerindeki diğer acenteler — bizim kiracımız değil, karşı taraf. */
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

export const PEER_AGENCIES: PeerAgency[] = [
  {
    id: "pa-efes", name: "Efes Turizm", city: "İzmir", country: "Türkiye",
    description: "Ege bölgesinde günübirlik tur ve antik kent gezileri. 1998'den beri kendi rehber kadromuzla çalışıyoruz.",
    listingCount: 14, defaultModel: "komisyon", imageTone: "#4a6b47",
  },
  {
    id: "pa-likya", name: "Likya Seyahat", city: "Antalya", country: "Türkiye",
    description: "Likya yolu, tekne turları ve Akdeniz transferleri. Kendi araç filomuz var.",
    listingCount: 9, defaultModel: "netFiyat", imageTone: "#4b6b78",
  },
  {
    id: "pa-nemrut", name: "Nemrut Tur", city: "Adıyaman", country: "Türkiye",
    description: "Güneydoğu turları, Nemrut gün doğumu ve Göbeklitepe programları.",
    listingCount: 6, defaultModel: "komisyon", imageTone: "#96552f",
  },
  {
    id: "pa-karadeniz", name: "Yayla Turizm", city: "Trabzon", country: "Türkiye",
    description: "Karadeniz yayla turları ve Batum geçişli programlar.",
    listingCount: 11, defaultModel: "netFiyat", imageTone: "#3f5f4f",
  },
  {
    id: "pa-marmaris", name: "Marmaris Blue", city: "Muğla", country: "Türkiye",
    description: "Günlük tekne turları ve havalimanı transferleri.",
    listingCount: 8, defaultModel: "komisyon", imageTone: "#2f6b78",
  },
];

export const peerById = (id: string) => PEER_AGENCIES.find((p) => p.id === id);

type Store = {
  profile: MarketplaceProfile | null;
  /** Bizim paylaştıklarımız + karşı acentelerin paylaştıkları. */
  listings: MarketplaceListing[];
  contracts: Contract[];
  contractListings: ContractListing[];
  access: MarketplaceAccess;
};

const rule = (
  model: "komisyon" | "netFiyat",
  value: number,
): MarketplacePricingRule => ({
  id: `pr-${model}-${value}`,
  model,
  commissionPct: model === "komisyon" ? value : null,
  netAmount: model === "netFiyat" ? value : null,
  currency: "TRY",
});

/** Karşı acentelerin pazaryerine açtığı envanter — keşif ekranlarını besler. */
const PEER_LISTINGS: MarketplaceListing[] = [
  { id: "ml-1", supplierAgencyId: "pa-efes", kind: "tur", tourId: "t-efes-1", vehicleId: null, title: "Efes Antik Kenti ve Meryem Ana — tam gün", isActive: true, pricing: rule("komisyon", 12), listPrice: 1_450_00, currency: "TRY", destination: "İzmir", imageTone: "#4a6b47", sharedAt: "2026-08-14T09:00:00.000Z" },
  { id: "ml-2", supplierAgencyId: "pa-efes", kind: "tur", tourId: "t-efes-2", vehicleId: null, title: "Şirince köyü ve şarap tadımı", isActive: true, pricing: rule("komisyon", 15), listPrice: 780_00, currency: "TRY", destination: "İzmir", imageTone: "#6d7a4e", sharedAt: "2026-08-14T09:00:00.000Z" },
  { id: "ml-3", supplierAgencyId: "pa-likya", kind: "tur", tourId: "t-likya-1", vehicleId: null, title: "Kekova batık şehir tekne turu", isActive: true, pricing: rule("netFiyat", 920_00), listPrice: 1_180_00, currency: "TRY", destination: "Antalya", imageTone: "#4b6b78", sharedAt: "2026-08-20T09:00:00.000Z" },
  { id: "ml-4", supplierAgencyId: "pa-likya", kind: "arac", tourId: null, vehicleId: "v-likya-1", title: "Antalya havalimanı — Kaş özel transfer (1-3 kişi)", isActive: true, pricing: rule("netFiyat", 2_400_00), listPrice: 3_100_00, currency: "TRY", destination: "Antalya", imageTone: "#3f5f6f", sharedAt: "2026-08-22T09:00:00.000Z" },
  { id: "ml-5", supplierAgencyId: "pa-nemrut", kind: "tur", tourId: "t-nemrut-1", vehicleId: null, title: "Nemrut Dağı gün doğumu — Adıyaman çıkışlı", isActive: true, pricing: rule("komisyon", 18), listPrice: 1_650_00, currency: "TRY", destination: "Adıyaman", imageTone: "#96552f", sharedAt: "2026-07-30T09:00:00.000Z" },
  { id: "ml-6", supplierAgencyId: "pa-nemrut", kind: "tur", tourId: "t-nemrut-2", vehicleId: null, title: "Göbeklitepe ve Şanlıurfa kültür turu", isActive: true, pricing: rule("komisyon", 16), listPrice: 1_320_00, currency: "TRY", destination: "Şanlıurfa", imageTone: "#a5762d", sharedAt: "2026-07-30T09:00:00.000Z" },
  { id: "ml-7", supplierAgencyId: "pa-karadeniz", kind: "tur", tourId: "t-kd-1", vehicleId: null, title: "Ayder yaylası ve Fırtına vadisi — 2 gün", isActive: true, pricing: rule("netFiyat", 2_150_00), listPrice: 2_800_00, currency: "TRY", destination: "Rize", imageTone: "#3f5f4f", sharedAt: "2026-08-02T09:00:00.000Z" },
  { id: "ml-8", supplierAgencyId: "pa-karadeniz", kind: "arac", tourId: null, vehicleId: "v-kd-1", title: "Trabzon havalimanı — Uzungöl minibüs (8 kişi)", isActive: false, pricing: rule("netFiyat", 1_900_00), listPrice: 2_450_00, currency: "TRY", destination: "Trabzon", imageTone: "#4a5f52", sharedAt: "2026-08-02T09:00:00.000Z" },
  { id: "ml-9", supplierAgencyId: "pa-marmaris", kind: "tur", tourId: "t-mar-1", vehicleId: null, title: "Marmaris günlük tekne turu — 6 koy", isActive: true, pricing: rule("komisyon", 14), listPrice: 890_00, currency: "TRY", destination: "Muğla", imageTone: "#2f6b78", sharedAt: "2026-08-25T09:00:00.000Z" },
  { id: "ml-10", supplierAgencyId: "pa-marmaris", kind: "arac", tourId: null, vehicleId: "v-mar-1", title: "Dalaman havalimanı — Marmaris VIP (1-6 kişi)", isActive: true, pricing: rule("komisyon", 10), listPrice: 2_200_00, currency: "TRY", destination: "Muğla", imageTone: "#3a6b6b", sharedAt: "2026-08-25T09:00:00.000Z" },
];

/**
 * Kendi pazaryerine açtığımız envanter. Tedarikçi rolündeki ekranlar
 * (Paylaştıklarım) bunu yönetir — komisyon/net fiyat satır üzerinde değişir.
 */
const MY_LISTINGS: MarketplaceListing[] = [
  { id: "my-1", supplierAgencyId: AGENCY.id, kind: "tur", tourId: "p-balon", vehicleId: null, title: "Kapadokya sıcak hava balonu — gün doğumu", isActive: true, pricing: rule("komisyon", 15), listPrice: 1_463_00, currency: "TRY", destination: "Kapadokya", imageTone: "#b8623a", sharedAt: "2026-08-10T10:00:00.000Z" },
  { id: "my-2", supplierAgencyId: AGENCY.id, kind: "tur", tourId: "p-yesil", vehicleId: null, title: "Yeşil tur — Ihlara Vadisi ve Derinkuyu", isActive: true, pricing: rule("komisyon", 18), listPrice: 781_00, currency: "TRY", destination: "Kapadokya", imageTone: "#4a6b47", sharedAt: "2026-08-10T10:00:00.000Z" },
  { id: "my-3", supplierAgencyId: AGENCY.id, kind: "tur", tourId: "p-kirmizi", vehicleId: null, title: "Kırmızı tur — Göreme, Paşabağ, Devrent", isActive: true, pricing: rule("netFiyat", 520_00), listPrice: 645_00, currency: "TRY", destination: "Kapadokya", imageTone: "#9d4a4a", sharedAt: "2026-08-12T10:00:00.000Z" },
  { id: "my-4", supplierAgencyId: AGENCY.id, kind: "tur", tourId: "p-atv", vehicleId: null, title: "Gün batımı ATV safari — Güvercinlik Vadisi", isActive: false, pricing: rule("komisyon", 20), listPrice: 371_00, currency: "TRY", destination: "Kapadokya", imageTone: "#a5762d", sharedAt: "2026-08-12T10:00:00.000Z" },
  { id: "my-5", supplierAgencyId: AGENCY.id, kind: "arac", tourId: null, vehicleId: "v-kapadokya-1", title: "Kayseri havalimanı — Göreme özel transfer (1-4 kişi)", isActive: true, pricing: rule("netFiyat", 1_400_00), listPrice: 1_850_00, currency: "TRY", destination: "Kapadokya", imageTone: "#4b6b78", sharedAt: "2026-08-15T10:00:00.000Z" },
  { id: "my-6", supplierAgencyId: AGENCY.id, kind: "arac", tourId: null, vehicleId: "v-kapadokya-2", title: "Nevşehir havalimanı — Ürgüp minibüs (8 kişi)", isActive: true, pricing: rule("komisyon", 12), listPrice: 2_100_00, currency: "TRY", destination: "Kapadokya", imageTone: "#3f5f4f", sharedAt: "2026-08-15T10:00:00.000Z" },
];

/** Kurulum tamamlanmış, tek kontrat onaylı bir başlangıç durumu. */
const SEED: Store = {
  profile: {
    agencyId: AGENCY.id,
    country: "Türkiye",
    city: "Nevşehir",
    description:
      "Kapadokya merkezli tur operatörü. Balon, ATV, at ve kültür turlarında kendi kontratımızla çalışıyoruz.",
    contactEmail: "b2b@anadoluseyahat.example",
    contactPhone: "+90 5XX XXX XX XX",
    defaultPricing: rule("komisyon", 15),
    isVisible: true,
    setupCompletedAt: "2026-08-10T10:00:00.000Z",
  },
  listings: [...MY_LISTINGS, ...PEER_LISTINGS],
  contracts: [
    {
      id: "ct-1", supplierAgencyId: "pa-efes", sellerAgencyId: AGENCY.id,
      status: "onaylandi", requestedAt: "2026-08-18T11:00:00.000Z",
      decidedAt: "2026-08-19T08:30:00.000Z",
      message: "Kapadokya müşterilerimize Ege bacağı eklemek istiyoruz.",
      agreedPricing: rule("komisyon", 12),
    },
    {
      id: "ct-2", supplierAgencyId: "pa-likya", sellerAgencyId: AGENCY.id,
      status: "beklemede", requestedAt: "2026-09-05T14:20:00.000Z",
      decidedAt: null,
      message: "Antalya transferleri için kontrat kurmak istiyoruz.",
      agreedPricing: null,
    },
    {
      id: "ct-3", supplierAgencyId: AGENCY.id, sellerAgencyId: "pa-nemrut",
      status: "beklemede", requestedAt: "2026-09-06T09:10:00.000Z",
      decidedAt: null,
      message: "Balon turlarınızı Güneydoğu paketlerimize eklemek istiyoruz.",
      agreedPricing: null,
    },
    {
      id: "ct-4", supplierAgencyId: "pa-marmaris", sellerAgencyId: AGENCY.id,
      status: "reddedildi", requestedAt: "2026-07-11T10:00:00.000Z",
      decidedAt: "2026-07-13T16:45:00.000Z",
      message: null, agreedPricing: null,
    },
  ],
  contractListings: [
    { contractId: "ct-1", listingId: "ml-1" },
    { contractId: "ct-1", listingId: "ml-2" },
  ],
  access: {
    agencyId: AGENCY.id,
    active: true,
    viaPlan: "growth",
    validUntil: null,
  },
};

type Ctx = Store & {
  /** Bizim paylaştığımız envanter. */
  myListings: MarketplaceListing[];
  /** Karşı acentelerin envanteri. */
  peerListings: MarketplaceListing[];
  /** Onaylı kontratla satışa açtığımız envanter. */
  acquiredListings: MarketplaceListing[];
  saveProfile: (p: MarketplaceProfile) => void;
  setVisibility: (v: boolean) => void;
  toggleListing: (id: string) => void;
  setListingPricing: (id: string, pricing: MarketplacePricingRule) => void;
  shareOwn: (listing: MarketplaceListing) => void;
  requestContract: (supplierAgencyId: string, message: string) => void;
  setContractStatus: (id: string, status: ContractStatus) => void;
};

const C = createContext<Ctx | null>(null);

function read(raw: string | null): Store {
  if (!raw) return SEED;
  try {
    return { ...SEED, ...(JSON.parse(raw) as Partial<Store>) };
  } catch {
    return SEED;
  }
}

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const raw = useSessionValue(KEY);
  const store = useMemo(() => read(raw), [raw]);

  const commit = useCallback((next: Store) => {
    writeSession(KEY, JSON.stringify(next));
    notifySessionChange();
  }, []);

  const current = useCallback(() => {
    try {
      return read(sessionStorage.getItem(KEY));
    } catch {
      return SEED;
    }
  }, []);

  const saveProfile = useCallback(
    (profile: MarketplaceProfile) => commit({ ...current(), profile }),
    [commit, current],
  );

  const setVisibility = useCallback(
    (isVisible: boolean) => {
      const s = current();
      if (!s.profile) return;
      commit({ ...s, profile: { ...s.profile, isVisible } });
    },
    [commit, current],
  );

  const toggleListing = useCallback(
    (id: string) => {
      const s = current();
      commit({
        ...s,
        listings: s.listings.map((l) =>
          l.id === id ? { ...l, isActive: !l.isActive } : l,
        ),
      });
    },
    [commit, current],
  );

  const setListingPricing = useCallback(
    (id: string, pricing: MarketplacePricingRule) => {
      const s = current();
      commit({
        ...s,
        listings: s.listings.map((l) => (l.id === id ? { ...l, pricing } : l)),
      });
    },
    [commit, current],
  );

  const shareOwn = useCallback(
    (listing: MarketplaceListing) => {
      const s = current();
      commit({ ...s, listings: [...s.listings, listing] });
    },
    [commit, current],
  );

  const requestContract = useCallback(
    (supplierAgencyId: string, message: string) => {
      const s = current();
      commit({
        ...s,
        contracts: [
          ...s.contracts,
          {
            id: `ct-${s.contracts.length + 1}-${supplierAgencyId}`,
            supplierAgencyId,
            sellerAgencyId: AGENCY.id,
            status: "beklemede",
            requestedAt: "2026-09-08T09:00:00.000Z",
            decidedAt: null,
            message: message || null,
            agreedPricing: null,
          },
        ],
      });
    },
    [commit, current],
  );

  const setContractStatus = useCallback(
    (id: string, status: ContractStatus) => {
      const s = current();
      commit({
        ...s,
        contracts: s.contracts.map((c) =>
          c.id === id
            ? {
                ...c,
                status,
                decidedAt: "2026-09-08T09:00:00.000Z",
                // Onay anında fiyat şartı donar (sapma 3).
                agreedPricing:
                  status === "onaylandi" && !c.agreedPricing
                    ? (s.listings.find((l) => l.supplierAgencyId === c.supplierAgencyId)
                        ?.pricing ?? null)
                    : c.agreedPricing,
              }
            : c,
        ),
      });
    },
    [commit, current],
  );

  const value = useMemo<Ctx>(() => {
    const myListings = store.listings.filter((l) => l.supplierAgencyId === AGENCY.id);
    const peerListings = store.listings.filter((l) => l.supplierAgencyId !== AGENCY.id);
    const approvedSuppliers = new Set(
      store.contracts
        .filter((c) => c.status === "onaylandi" && c.sellerAgencyId === AGENCY.id)
        .map((c) => c.supplierAgencyId),
    );
    return {
      ...store,
      myListings,
      peerListings,
      acquiredListings: peerListings.filter((l) =>
        approvedSuppliers.has(l.supplierAgencyId),
      ),
      saveProfile,
      setVisibility,
      toggleListing,
      setListingPricing,
      shareOwn,
      requestContract,
      setContractStatus,
    };
  }, [
    store,
    saveProfile,
    setVisibility,
    toggleListing,
    setListingPricing,
    shareOwn,
    requestContract,
    setContractStatus,
  ]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useMarketplace() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useMarketplace, MarketplaceProvider içinde çağrılmalı");
  return ctx;
}
