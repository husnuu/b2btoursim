import type { Iso, Money, Uuid } from "./types";

/**
 * B2B Pazaryeri — "B2B Pazaryeri Modülü Spesifikasyonu" Bölüm 7 (5 yeni varlık).
 *
 * Pazaryeri bir ürün tipi değil, **yatay bir dağıtım katmanı**: kendi
 * envanterini yaratmaz, Tur ve Transfer envanterini acenteler arasında taşır.
 * Bu yüzden burada TourDraft/Vehicle kopyalanmaz, referans verilir.
 *
 * Spesifikasyondan üç sapma — hepsi bilinçli:
 *
 * 1. `MARKETPLACE_LISTING` polimorfik referans yerine **tipli nullable FK**
 *    kullanır (`tourId` XOR `vehicleId`). Polimorfik FK Postgres'te referans
 *    bütünlüğünü kırar ve RLS politikası yazmayı zorlaştırır.
 * 2. `CONTRACT.kapsam` bir alan değil **çoka-çok ilişki**; `ContractListing`
 *    olarak ayrıldı.
 * 3. Fiyat **iki kademede** dondurulur: kontrat şartı kurulduğunda,
 *    her rezervasyon ayrıca uygulanan kuralı snapshot'lar. Spesifikasyon
 *    "donmuş olabilir" diyor; parada "olabilir" olmaz — tedarikçi komisyonu
 *    değiştirince geçmiş rezervasyonlar değişmemeli.
 *
 * PARA AKIŞI: Spesifikasyon Bölüm 6 komisyonu "Tedarikçi → platform → Satıcı"
 * olarak öneriyor. Platform parayı taşımaz (TÜRSAB/1618 gerekçesi, bkz.
 * DEVOPS/mimari kararı): her iki modelde de ödeme **taraflar arasında** akar,
 * platform yalnızca hakedişi hesaplar ve mutabakat raporu üretir.
 */

/* --- Fiyatlandırma -------------------------------------------------------- */

/** Spesifikasyon Bölüm 4.2 — gözlemlenen iki model. */
export type PricingModel = "komisyon" | "netFiyat";

export type MarketplacePricingRule = {
  id: Uuid;
  model: PricingModel;
  /** "komisyon" modelinde: tedarikçiye ödenecek yüzde. */
  commissionPct: number | null;
  /** "netFiyat" modelinde: tedarikçiye kalacak sabit tutar. */
  netAmount: Money | null;
  currency: string;
};

/* --- Tedarikçi vitrini ---------------------------------------------------- */

/** Spesifikasyon Bölüm 2.2–2.6 — kurulum sihirbazının ürettiği kayıt. */
export type MarketplaceProfile = {
  agencyId: Uuid;
  country: string;
  city: string;
  /** Bölüm 2.3 — satıcı acentelerin profilde göreceği tanıtım. */
  description: string;
  /** Boş bırakılırsa şirket ayarlarındaki iletişim kullanılır (Bölüm 2.3). */
  contactEmail: string | null;
  contactPhone: string | null;
  defaultPricing: MarketplacePricingRule;
  /**
   * Bölüm 2.6 toggle'ı. Kapatmak yalnızca **yeni kontrat isteklerini**
   * durdurur; mevcut kontratlar ve devam eden satışlar etkilenmez.
   */
  isVisible: boolean;
  setupCompletedAt: Iso | null;
};

/* --- Listeleme ------------------------------------------------------------ */

export type ListingKind = "tur" | "arac";

export type MarketplaceListing = {
  id: Uuid;
  /** Envanteri paylaşan acente (Tedarikçi rolü). */
  supplierAgencyId: Uuid;
  kind: ListingKind;
  /** kind === "tur" ise dolu, diğerinde null. */
  tourId: Uuid | null;
  /** kind === "arac" ise dolu, diğerinde null. */
  vehicleId: Uuid | null;
  /** Liste ekranlarında gösterilecek ad — kaynak kayıttan kopyalanır. */
  title: string;
  /** Pazaryerinde aktif mi (Bölüm 4.1/4.2 toggle'ı). */
  isActive: boolean;
  /** Profildeki varsayılanı bu listeleme için geçersiz kılar. */
  pricing: MarketplacePricingRule;
  /** Tedarikçinin kendi satış fiyatı — komisyon modelinde taban. */
  listPrice: Money;
  currency: string;
  destination: string;
  imageTone: string;
  sharedAt: Iso;
};

/** Referans bütünlüğü: tam olarak bir kaynak dolu olmalı. */
export function isValidListing(l: MarketplaceListing): boolean {
  return (l.tourId !== null) !== (l.vehicleId !== null);
}

/**
 * Satıcının müşteriye çıkacağı taban fiyat.
 *
 * - komisyon: tedarikçinin liste fiyatı taban; satıcı üstüne kendi marjını
 *   koyar, tedarikçiye komisyon öder.
 * - netFiyat: tedarikçinin net tutarı taban; satıcı üstünü serbestçe belirler.
 */
export function listingBasePrice(l: MarketplaceListing): Money {
  return l.pricing.model === "netFiyat"
    ? (l.pricing.netAmount ?? l.listPrice)
    : l.listPrice;
}

/** Tedarikçiye kalan tutar — hakediş hesabı, platform tahsil etmez. */
export function supplierPayout(l: MarketplaceListing, salePrice: Money): Money {
  if (l.pricing.model === "netFiyat") return l.pricing.netAmount ?? l.listPrice;
  const pct = l.pricing.commissionPct ?? 0;
  return Math.round(salePrice * (1 - pct / 100));
}

/* --- Kontrat -------------------------------------------------------------- */

export type ContractStatus =
  | "beklemede"
  | "onaylandi"
  | "reddedildi"
  | "sonlandirildi";

export type Contract = {
  id: Uuid;
  supplierAgencyId: Uuid;
  sellerAgencyId: Uuid;
  status: ContractStatus;
  requestedAt: Iso;
  decidedAt: Iso | null;
  /** Talep sırasında satıcının yazdığı not. */
  message: string | null;
  /**
   * Kontrat kurulduğu andaki fiyat şartı — sonradan tedarikçi listelemeyi
   * değiştirse bile bu kontrat için geçerli kalan koşul.
   */
  agreedPricing: MarketplacePricingRule | null;
};

/** Spesifikasyon Bölüm 5.1 "kapsam" alanının doğru hali: çoka-çok. */
export type ContractListing = {
  contractId: Uuid;
  listingId: Uuid;
};

/* --- Abonelik ------------------------------------------------------------- */

/**
 * Spesifikasyon ayrı bir `MARKETPLACE_SUBSCRIPTION` varlığı öneriyor. Bu
 * ikinci bir faturalama yüzeyi doğurur; pazaryeri erişimi **mevcut planın
 * bir özelliği** olarak modellendi (Süper Admin'de özellik bayrağı arayüzü
 * zaten var). Durum yine de açıkça taşınıyor ki duvar tek yerden karar versin.
 */
export type MarketplaceAccess = {
  agencyId: Uuid;
  active: boolean;
  /** Erişimi veren plan — "growth" | "enterprise". */
  viaPlan: string | null;
  validUntil: Iso | null;
};

/* --- Rezervasyon bağlantısı ----------------------------------------------- */

/**
 * Spesifikasyon Bölüm 7 tasarım notu: yeni rezervasyon tablosu açılmaz,
 * mevcut BOOKING'e iki alan eklenir. Uygulanan fiyat kuralı da burada
 * snapshot'lanır (sapma 3).
 */
export type BookingMarketplaceSource = {
  sourceChannel: "direkt" | "pazaryeri";
  contractId: Uuid | null;
  listingId: Uuid | null;
  appliedPricing: MarketplacePricingRule | null;
  supplierAgencyName: string | null;
};
