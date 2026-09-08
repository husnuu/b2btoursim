import type { Money, Uuid } from "./types";
import type { CancellationTemplate, TourImage } from "./tour";
import type { TransferOperationStatus } from "./transfer";

/**
 * Villa Kiralama Modülü — "Villa Kiralama Modülü Spesifikasyonu"
 * (MVP + FAZ2 + FAZ3 kapsamı). Dördüncü ürün tipi; Tur/Tekne'nin
 * tek-sihirbaz biçimini izler ama gruplama editöryeldir — gözlemlenen
 * ekranda sol menüde tek, düz bir 9 adımlık liste var (bkz. plan
 * dokümanı). Belgenin kendi talimatıyla `CancellationTemplate` ve
 * `TourImage` tur.ts'ten doğrudan yeniden kullanılır.
 *
 * Gerçek bir harita widget'ı yok (bkz. plan Varsayım 1); "Gecelik Fiyat"
 * alanı, belgenin alan tablosundaki bir boşluğu dolduran çıkarımdır
 * (bkz. plan Varsayım 3).
 */

export type VillaCategory = { id: Uuid; title: string };
export type VillaRegion = { id: Uuid; name: string };
export type VillaFeature = { id: Uuid; name: string };

export type DistanceUnit = "m" | "km";
export type PoiDistance = { id: Uuid; label: string; distance: number; unit: DistanceUnit };

export type VillaBookingMethod =
  | "talepTopla"
  | "onlineOdemeIleAl"
  | "belirliOranOdeme"
  | "belirliOranOdemeYuvarla";

export type VillaTranslation = { title: string; description: string; auto: boolean };

export type VillaDraft = {
  id: Uuid;
  status: "taslak" | "aktif" | "pasif" | "arsivlendi";

  /* 3.1 Villa Adı ve Açıklama */
  title: string;
  slug: string;
  priceCurrency: string;
  nightlyRate: Money;
  description: string;
  translations: { en?: VillaTranslation };

  /* 3.2 Kategori ve Fiyat Ayarları */
  categoryId: string | null;
  askForPrice: boolean;
  forcedCurrency: boolean;
  tourismLicenseNo: string;
  listCurrencyOverride: string | null;
  listPrice: Money | null;

  /* 3.3 Lokasyon ve İletişim */
  province: string;
  district: string;
  addressDetail: string;
  regionIds: string[];
  mapLat: number | null;
  mapLng: number | null;

  /* 3.4 Galeri */
  images: TourImage[];
  coverImageId: Uuid | null;
  videoUrl: string | null;

  /* 4.1 Villa Genel Bilgileri */
  poiDistances: PoiDistance[];
  capacity: number;
  sizeM2: number | null;
  featureIds: string[];

  /* 4.2 Villa İle İlgili Koşullar */
  checkInTime: string;
  checkOutTime: string;
  petsAllowed: boolean;

  /* 5.1 İptal ve İade Politikası */
  cancellationTemplate: CancellationTemplate;
  customPolicyText: string;

  /* 5.2 Rezervasyon Süreci */
  bookingCutoffDays: number;
  bookingMethods: VillaBookingMethod[];

  /* Faz3 — Minimum Konaklama Süresi Kuralı (Bölüm 6) */
  minNights: number;

  /* 5.3 Müşteriden İstenilecek Bilgiler (Önerilen) */
  collectEstimatedArrival: boolean;
  collectGuestBreakdown: boolean;
  collectSpecialRequests: boolean;

  createdAt: string;
  updatedAt: string;
};

const DEFAULT_POI_LABELS = ["Hastane", "Market", "Restoran", "Toplu Taşıma", "Deniz", "Havalimanı", "Şehir Merkezi"];

export function emptyVillaDraft(id: Uuid, now: string): VillaDraft {
  return {
    id,
    status: "taslak",
    title: "",
    slug: "",
    priceCurrency: "TRY",
    nightlyRate: 0,
    description: "",
    translations: {},
    categoryId: null,
    askForPrice: false,
    forcedCurrency: false,
    tourismLicenseNo: "",
    listCurrencyOverride: null,
    listPrice: null,
    province: "",
    district: "",
    addressDetail: "",
    regionIds: [],
    mapLat: null,
    mapLng: null,
    images: [],
    coverImageId: null,
    videoUrl: null,
    poiDistances: DEFAULT_POI_LABELS.map((label) => ({ id: crypto.randomUUID(), label, distance: 0, unit: "km" as const })),
    capacity: 6,
    sizeM2: null,
    featureIds: [],
    checkInTime: "14:00",
    checkOutTime: "12:00",
    petsAllowed: false,
    cancellationTemplate: "orta",
    customPolicyText: "",
    bookingCutoffDays: 0,
    bookingMethods: ["talepTopla"],
    minNights: 1,
    collectEstimatedArrival: false,
    collectGuestBreakdown: false,
    collectSpecialRequests: false,
    createdAt: now,
    updatedAt: now,
  };
}

/** Zorunlu alanlar — yalnızca belgede * işaretli olanlar (Başlık, Slug, Bölgeler, Kapasite). */
export function missingVillaFields(villa: VillaDraft): string[] {
  const missing: string[] = [];
  if (!villa.title.trim()) missing.push("title");
  if (!villa.slug.trim()) missing.push("slug");
  if (villa.regionIds.length === 0) missing.push("regions");
  if (villa.capacity <= 0) missing.push("capacity");
  return missing;
}

export function canPublishVilla(villa: VillaDraft): boolean {
  return missingVillaFields(villa).length === 0;
}

export function villaCompletionPct(villa: VillaDraft): number {
  const required: [boolean, number][] = [
    [villa.title.trim().length > 0, 2],
    [villa.slug.trim().length > 0, 2],
    [villa.regionIds.length > 0, 2],
    [villa.capacity > 0, 2],
  ];
  const recommended: [boolean, number][] = [
    [villa.description.trim().length > 0, 1],
    [villa.images.length >= 5, 1],
    [villa.nightlyRate > 0, 1],
    [villa.categoryId !== null, 1],
    [villa.featureIds.length > 0, 1],
    [villa.bookingMethods.length > 0, 1],
  ];
  const all = [...required, ...recommended];
  const total = all.reduce((sum, [, w]) => sum + w, 0);
  const done = all.reduce((sum, [ok, w]) => sum + (ok ? w : 0), 0);
  return Math.round((done / total) * 100);
}

export function computeNightlyTotal(nightlyRate: Money, checkIn: string, checkOut: string): { nights: number; total: Money } {
  const inDate = new Date(`${checkIn}T00:00:00.000Z`);
  const outDate = new Date(`${checkOut}T00:00:00.000Z`);
  const nights = Math.max(0, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));
  return { nights, total: nightlyRate * nights };
}

/* --- Rezervasyon / Operasyon (Bölüm 6) ------------------------------------ */

export type VillaBooking = {
  id: Uuid;
  villaId: Uuid;
  villaTitleSnapshot: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  nights: number;
  price: Money;
  currency: string;
  bookingMethod: VillaBookingMethod;
  /** Transfer/Tekne'nin operasyon panel iskeletiyle aynı tip (bkz. transfer.ts). */
  operationStatus: TransferOperationStatus;
  createdAt: string;
};

/** MVP — Çakışma Önleme: aynı villa, çakışan check-in/check-out aralığında ikinci kez satılamaz. */
export function hasVillaConflict(
  bookings: VillaBooking[],
  villaId: string,
  checkInDate: string,
  checkOutDate: string,
  excludeBookingId?: string,
): boolean {
  return bookings
    .filter((b) => b.villaId === villaId && b.id !== excludeBookingId)
    .some((b) => checkInDate < b.checkOutDate && b.checkInDate < checkOutDate);
}
