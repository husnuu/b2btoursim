import type { Money, Uuid } from "./types";
import type {
  CancellationCutoff,
  CancellationTemplate,
  ExtraLink,
  MeetingPoint,
  PaymentMode,
  TourImage,
} from "./tour";
import type { TransferOperationStatus } from "./transfer";

/**
 * Tekne Kiralama Modülü — "Tekne Kiralama Modülü Spesifikasyonu"
 * (MVP + FAZ2 + FAZ3 kapsamı). Üçüncü ürün tipi; Tur'un tek-sihirbaz
 * biçimini, Transfer'in Rezervasyonlar/Operasyon iskeletini izler ve
 * belgenin kendi talimatıyla ikisinden de tip seviyesinde yeniden
 * kullanır: marina noktaları için ayrı bir tablo yerine `MeetingPoint`
 * (Bölüm 7 Cross-Reference), ödeme modları için `PaymentMode`, iptal
 * kesintileri için `CancellationTemplate`/`CancellationCutoff`.
 *
 * Gerçek bir denizcilik otoritesi/ödeme-blokaj altyapısı yok
 * (bkz. READINESS.md) — bkz. plan dokümanındaki Varsayımlar 1 ve 4.
 */

export type MarinaPoint = MeetingPoint;

export type BoatCategory = { id: Uuid; title: string; slug: string };
export type BoatFeature = { id: Uuid; name: string };
export type BoatExtra = {
  id: Uuid;
  name: string;
  price: Money;
  currency: string;
  type: "perPerson" | "perBooking";
};

export type CaptainOption = "kaptanli" | "kaptansiz" | "herIkisi";
export type CaptainFeeUnit = "saatlik" | "gunluk";
export type CaptainPaymentMethod = "limandaNakit" | "platform";

export type PricingModel = "saatlik" | "cokGunlu" | "kisiBasi";

export type HourlyTier = { id: Uuid; afterHours: number; discountPct: number };
export type MultiDayPricing = {
  unit: "gece" | "gun";
  unitPrice: Money;
  minUnits: number;
  maxUnits: number;
};
export type PerPersonPricing = { pricePerPerson: Money; minGroupSize: number };

export type SafetyEquipment = {
  lifejacketCount: number;
  hasLifeRaft: boolean;
  hasFireExtinguisher: boolean;
  notes: string;
};

export type BoatTranslation = {
  title: string;
  description: string;
  whatToBring: string;
  includes: string[];
  excludes: string[];
  auto: boolean;
};

export type BoatDraft = {
  id: Uuid;
  status: "taslak" | "aktif" | "pasif" | "arsivlendi";

  /* 3.1 Başlık ve Kategori */
  title: string;
  slug: string;
  internalShortName: string;
  categoryId: string | null;
  legalCapacity: number;
  mainMarinaId: string | null;

  /* 3.2 Teknik Özellikler */
  brandModel: string;
  buildYear: number | null;
  lengthMeters: number | null;
  engineInfo: string;
  cabinCount: number;
  bedCount: number;
  featureIds: string[];

  /* 3.3 Açıklama ve Yanında Ne Getirmeli */
  description: string;
  whatToBring: string;
  translations: { en?: BoatTranslation };

  /* 3.4 Fotoğraf/Video */
  images: TourImage[];
  coverImageId: Uuid | null;
  videoUrl: string | null;

  /* 3.5 Dahil Olanlar / Güvenlik Ekipmanları */
  includes: string[];
  excludes: string[];
  safetyEquipment: SafetyEquipment;

  /* 4.1 Kaptan Seçeneği */
  captainOption: CaptainOption;
  captainFee: Money | null;
  captainFeeUnit: CaptainFeeUnit;
  captainPaymentMethod: CaptainPaymentMethod;
  captainLanguage: string;

  /* 4.2 Fiyatlandırma Modeli */
  pricingModel: PricingModel;
  currency: string;
  hourlyRate: Money | null;
  hourlyTiers: HourlyTier[];
  multiDay: MultiDayPricing;
  perPerson: PerPersonPricing;
  minRentalHours: number;
  securityDeposit: Money;
  fuelPolicyIncluded: boolean;
  weatherCancellationEnabled: boolean;

  /* 5.1 Rezervasyon Süreci */
  paymentMode: PaymentMode;
  depositBlockTiming: "onayAninda" | "checkinde";
  depositRefundTiming: "checkoutSonrasi" | "hasarDegerlendirmesiSonrasi";

  /* 5.2 İptal ve İade Politikası */
  cancellationTemplate: CancellationTemplate;
  tieredCutoffs: CancellationCutoff[];

  /* 5.3 Müşteriden İstenecek Bilgiler */
  requireCaptainLicense: boolean;
  collectPassengerList: boolean;
  collectEmergencyContact: boolean;

  /* 5.4 Tekne Ekstraları ve Sözleşme */
  extraLinks: ExtraLink[];
  contract: { text: string; version: number; updatedAt: string } | null;

  createdAt: string;
  updatedAt: string;
};

export function emptyBoatDraft(id: Uuid, now: string): BoatDraft {
  return {
    id,
    status: "taslak",
    title: "",
    slug: "",
    internalShortName: "",
    categoryId: null,
    legalCapacity: 6,
    mainMarinaId: null,
    brandModel: "",
    buildYear: null,
    lengthMeters: null,
    engineInfo: "",
    cabinCount: 0,
    bedCount: 0,
    featureIds: [],
    description: "",
    whatToBring: "",
    translations: {},
    images: [],
    coverImageId: null,
    videoUrl: null,
    includes: [],
    excludes: [],
    safetyEquipment: { lifejacketCount: 0, hasLifeRaft: false, hasFireExtinguisher: false, notes: "" },
    captainOption: "kaptanli",
    captainFee: null,
    captainFeeUnit: "saatlik",
    captainPaymentMethod: "platform",
    captainLanguage: "",
    pricingModel: "saatlik",
    currency: "TRY",
    hourlyRate: null,
    hourlyTiers: [],
    multiDay: { unit: "gece", unitPrice: 0, minUnits: 1, maxUnits: 14 },
    perPerson: { pricePerPerson: 0, minGroupSize: 1 },
    minRentalHours: 4,
    securityDeposit: 0,
    fuelPolicyIncluded: true,
    weatherCancellationEnabled: true,
    paymentMode: "anindaTamOdeme",
    depositBlockTiming: "onayAninda",
    depositRefundTiming: "checkoutSonrasi",
    cancellationTemplate: "orta",
    tieredCutoffs: [],
    requireCaptainLicense: false,
    collectPassengerList: false,
    collectEmergencyContact: false,
    extraLinks: [],
    contract: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Zorunlu alanlar — Bölüm 3.1/3.4: Başlık, Slug, Kategori, Kapasite,
 * Marina, Açıklama, en az 3 görsel; kaptanlı/herIkisi ise kaptan ücreti.
 */
export function missingBoatFields(boat: BoatDraft): string[] {
  const missing: string[] = [];
  if (!boat.title.trim()) missing.push("title");
  if (!boat.slug.trim()) missing.push("slug");
  if (!boat.categoryId) missing.push("category");
  if (boat.legalCapacity <= 0) missing.push("capacity");
  if (!boat.mainMarinaId) missing.push("marina");
  if (!boat.description.trim()) missing.push("description");
  if (boat.images.length < 3) missing.push("images");
  if (boat.captainOption !== "kaptansiz" && !(boat.captainFee && boat.captainFee > 0)) {
    missing.push("captainFee");
  }
  return missing;
}

export function canPublishBoat(boat: BoatDraft): boolean {
  return missingBoatFields(boat).length === 0;
}

export function boatCompletionPct(boat: BoatDraft): number {
  const required: [boolean, number][] = [
    [boat.title.trim().length > 0, 2],
    [boat.slug.trim().length > 0, 2],
    [boat.categoryId !== null, 2],
    [boat.legalCapacity > 0, 2],
    [boat.mainMarinaId !== null, 2],
    [boat.description.trim().length > 0, 2],
    [boat.images.length >= 3, 2],
  ];
  const recommended: [boolean, number][] = [
    [boat.brandModel.trim().length > 0, 1],
    [boat.lengthMeters !== null && boat.lengthMeters > 0, 1],
    [boat.featureIds.length > 0, 1],
    [boat.includes.length > 0, 1],
    [boat.whatToBring.trim().length > 0, 1],
    [boat.hourlyRate !== null && boat.hourlyRate > 0, 1],
  ];
  const all = [...required, ...recommended];
  const total = all.reduce((sum, [, w]) => sum + w, 0);
  const done = all.reduce((sum, [ok, w]) => sum + (ok ? w : 0), 0);
  return Math.round((done / total) * 100);
}

/* --- Fiyat hesaplayıcılar (Bölüm 4.2) ------------------------------------ */

/** Saatlik fiyat, süreye göre kademeli indirim uygular (en yüksek eşik kazanır). */
export function computeHourlyBoatPrice(hourlyRate: Money, hours: number, tiers: HourlyTier[]): Money {
  const applicable = tiers
    .filter((tier) => hours >= tier.afterHours)
    .sort((a, b) => b.afterHours - a.afterHours)[0];
  const discountPct = applicable?.discountPct ?? 0;
  return Math.round(hourlyRate * hours * (1 - discountPct / 100));
}

export function computeMultiDayPrice(pricing: MultiDayPricing, units: number): Money {
  return Math.round(pricing.unitPrice * units);
}

export function computePerPersonPrice(pricing: PerPersonPricing, guestCount: number): Money {
  return Math.round(pricing.pricePerPerson * guestCount);
}

/* --- Rezervasyon / Operasyon (Bölüm 6) ----------------------------------- */

export type BoatBooking = {
  id: Uuid;
  boatId: Uuid;
  boatTitleSnapshot: string;
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
  captainOption: CaptainOption;
  assignedCaptainName: string;
  pricingModel: PricingModel;
  price: Money;
  currency: string;
  securityDeposit: Money;
  securityDepositStatus: "bloke" | "iadeEdildi" | "kesintiYapildi";
  operationStatus: TransferOperationStatus;
  createdAt: string;
};

export type DateTimeRange = { fromDate: string; fromTime: string; toDate: string; toTime: string };

function toComparable(date: string, time: string): string {
  return `${date}T${time || "00:00"}`;
}

function rangesOverlap(a: DateTimeRange, b: DateTimeRange): boolean {
  const aStart = toComparable(a.fromDate, a.fromTime);
  const aEnd = toComparable(a.toDate, a.toTime);
  const bStart = toComparable(b.fromDate, b.fromTime);
  const bEnd = toComparable(b.toDate, b.toTime);
  return aStart < bEnd && bStart < aEnd;
}

/** MVP — Çakışma Önleme: aynı tekne, çakışan tarih/saat aralığında ikinci kez satılamaz. */
export function hasBoatConflict(
  bookings: BoatBooking[],
  boatId: string,
  range: DateTimeRange,
  excludeBookingId?: string,
): boolean {
  return bookings
    .filter((b) => b.boatId === boatId && b.id !== excludeBookingId)
    .some((b) => rangesOverlap(range, { fromDate: b.fromDate, fromTime: b.fromTime, toDate: b.toDate, toTime: b.toTime }));
}

/**
 * Faz3, basitleştirilmiş simülasyon (bkz. plan Varsayım 2): ayrı bir
 * Kaptan varlığı yok, yalnızca isim eşleşmesiyle deterministik uyarı.
 */
export function hasCaptainConflict(
  bookings: BoatBooking[],
  captainName: string,
  range: DateTimeRange,
  excludeBookingId?: string,
): boolean {
  const name = captainName.trim().toLocaleLowerCase("tr");
  if (!name) return false;
  return bookings
    .filter((b) => b.id !== excludeBookingId && b.assignedCaptainName.trim().toLocaleLowerCase("tr") === name)
    .some((b) => rangesOverlap(range, { fromDate: b.fromDate, fromTime: b.fromTime, toDate: b.toDate, toTime: b.toTime }));
}
