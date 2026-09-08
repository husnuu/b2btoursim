import type { Money, Uuid } from "./types";
import type { ExtraLink, MeetingPoint, TourImage } from "./tour";

/**
 * Transfer Modülü — "Transfer Modülü Spesifikasyonu" Bölüm 1-6
 * (MVP + FAZ2 + FAZ3 kapsamı).
 *
 * Tur modülünden (`tour.ts`) tamamen ayrı bir arz-tarafı katalog: ortak
 * bir Araç Filosu üzerine kurulu üç paralel satış modeli (Nokta Bazlı,
 * Harita Bazlı, Saatlik Kiralama). Şekli birebir aynı olan birkaç tip
 * (`MeetingPoint`, `TourImage`, `ExtraLink`) `tour.ts`'ten yeniden
 * kullanılır; kütüphane kayıtları (Feature/Extra) ise tur tarafındakiyle
 * aynı mantıkta ama ayrı, bağımsız bir katalog olduğu için kendi
 * tipleriyle tanımlanır (belgenin kendi ayrımı — Bölüm 1.3).
 *
 * Gerçek bir harita/geocoding/mesafe API'si yok (bkz. READINESS.md):
 * Harita Bazlı model ve "adresten bölge tespiti" `ai-mock.ts`'teki gibi
 * deterministik bir simülasyonla temsil edilir (bkz. `matchAddressToZone`).
 */

export type VehiclePricingModel = "rotaBazli" | "saatlikKiralama";
export type VehicleType = "private" | "shuttle";
export type VehicleStatus = "aktif" | "pasif";

export type VehicleFeature = { id: Uuid; name: string };
export type VehicleExtra = {
  id: Uuid;
  name: string;
  price: Money;
  currency: string;
  type: "perPerson" | "perBooking";
};

export type VehicleTranslation = { title: string; description: string; auto: boolean };

export type Vehicle = {
  id: Uuid;
  status: VehicleStatus;
  pricingModel: VehiclePricingModel;

  /* 1.2 adım 2 — Başlık, Açıklama, Kapasite */
  title: string;
  description: string;
  translations: { en?: VehicleTranslation };
  vehicleType: VehicleType;
  seatCapacity: number;
  luggageCapacity: number;

  /* Saatlik kiralama seçiliyse */
  hourlyRate: Money | null;

  /* 1.2 adım 3 — Özellikler ve Ekstralar */
  featureIds: Uuid[];
  extraLinks: ExtraLink[];

  /* 1.2 adım 4 — Fotoğraf/Video */
  images: TourImage[];
  coverImageId: Uuid | null;
  videoUrl: string | null;

  createdAt: string;
  updatedAt: string;
};

export function emptyVehicle(id: Uuid, now: string): Vehicle {
  return {
    id,
    status: "aktif",
    pricingModel: "rotaBazli",
    title: "",
    description: "",
    translations: {},
    vehicleType: "private",
    seatCapacity: 4,
    luggageCapacity: 2,
    hourlyRate: null,
    featureIds: [],
    extraLinks: [],
    images: [],
    coverImageId: null,
    videoUrl: null,
    createdAt: now,
    updatedAt: now,
  };
}

/** Zorunlu alanlar: Araç Başlığı, kapasite alanları sayısal olmalı. */
export function missingVehicleFields(vehicle: Vehicle): string[] {
  const missing: string[] = [];
  if (!vehicle.title.trim()) missing.push("title");
  if (vehicle.pricingModel === "saatlikKiralama" && !(vehicle.hourlyRate && vehicle.hourlyRate > 0)) {
    missing.push("hourlyRate");
  }
  return missing;
}

/* --- A. Nokta Bazlı Transfer ------------------------------------------- */

export type TransferPoint = MeetingPoint;

export type PointPriceRow = {
  id: Uuid;
  fromPointId: Uuid;
  toPointId: Uuid;
  vehicleType: VehicleType;
  price: Money;
  currency: string;
};

/**
 * Mimari Not (Bölüm 2.2): N×N matrisin karmaşıklığını, yalnızca seçilen
 * noktadan tanımlı olan hedefleri göstererek gizler.
 */
export function reachablePoints(matrix: PointPriceRow[], fromPointId: string): string[] {
  return [...new Set(matrix.filter((row) => row.fromPointId === fromPointId).map((row) => row.toPointId))];
}

export function findPointPrice(
  matrix: PointPriceRow[],
  fromPointId: string,
  toPointId: string,
  vehicleType: VehicleType,
): PointPriceRow | undefined {
  return matrix.find(
    (row) => row.fromPointId === fromPointId && row.toPointId === toPointId && row.vehicleType === vehicleType,
  );
}

/** 2.3 Araç Popüler Rotalar / 3.3 Popüler Harita Rotaları — ortak tip. */
export type PopularRoute = {
  id: Uuid;
  kind: "point" | "zone";
  title: string;
  slug: string;
  description: string;
  durationMinutes: number;
  durationUnit: "dakika" | "saat";
  startId: Uuid | null;
  endId: Uuid | null;
  vehicleIds: Uuid[];
  priceOverride: Money | null;
  currency: string;
  /** Faz3 — kapalıyken "Nereden → Nereye" otomatik üretilir. */
  useCustomTitleInListing: boolean;
};

export function emptyPopularRoute(id: Uuid, kind: "point" | "zone"): PopularRoute {
  return {
    id,
    kind,
    title: "",
    slug: "",
    description: "",
    durationMinutes: 30,
    durationUnit: "dakika",
    startId: null,
    endId: null,
    vehicleIds: [],
    priceOverride: null,
    currency: "TRY",
    useCustomTitleInListing: false,
  };
}

/** 2.4 Saat Marjları (Nokta) / 3.4 Saat Marjları (Harita) — ortak tip. */
export type TimeMarginRule = {
  id: Uuid;
  scope: "point" | "zone";
  startLocationId: Uuid | null;
  endLocationId: Uuid | null;
  startTime: string | null;
  endTime: string | null;
  /** Pozitif = ek ücret, negatif = indirim. */
  percentPct: number;
  vehicleIds: Uuid[];
};

export function emptyTimeMarginRule(id: Uuid, scope: "point" | "zone"): TimeMarginRule {
  return {
    id,
    scope,
    startLocationId: null,
    endLocationId: null,
    startTime: null,
    endTime: null,
    percentPct: 0,
    vehicleIds: [],
  };
}

function timeInWindow(time: string, start: string, end: string): boolean {
  // Gece yarısını saran pencereleri de destekler (ör. 22:00-06:00).
  if (start <= end) return time >= start && time < end;
  return time >= start || time < end;
}

/** Uygun saat marjı kurallarını fiyata sırayla uygular. */
export function applyTimeMargin(
  basePrice: Money,
  rules: TimeMarginRule[],
  ctx: { scope: "point" | "zone"; fromId: string; toId: string; time: string; vehicleId: string },
): Money {
  const applicable = rules.filter((rule) => {
    if (rule.scope !== ctx.scope) return false;
    if (rule.startLocationId && rule.startLocationId !== ctx.fromId) return false;
    if (rule.endLocationId && rule.endLocationId !== ctx.toId) return false;
    if (rule.vehicleIds.length > 0 && !rule.vehicleIds.includes(ctx.vehicleId)) return false;
    if (rule.startTime && rule.endTime && !timeInWindow(ctx.time, rule.startTime, rule.endTime)) return false;
    return true;
  });
  return applicable.reduce(
    (price, rule) => Math.round(price * (1 + rule.percentPct / 100)),
    basePrice,
  );
}

export function computePointPrice(
  matrix: PointPriceRow[],
  marginRules: TimeMarginRule[],
  params: { fromPointId: string; toPointId: string; vehicleType: VehicleType; vehicleId: string; time: string },
): Money | null {
  const row = findPointPrice(matrix, params.fromPointId, params.toPointId, params.vehicleType);
  if (!row) return null;
  return applyTimeMargin(row.price, marginRules, {
    scope: "point",
    fromId: params.fromPointId,
    toId: params.toPointId,
    time: params.time,
    vehicleId: params.vehicleId,
  });
}

/* --- B. Harita Bazlı Transfer (Faz3, basitleştirilmiş simülasyon) ------- */

export type MapZone = {
  id: Uuid;
  name: string;
  cityCountry: string;
  /** Gerçek polygon/geocoding yerine: adres eşleşmesi için anahtar kelimeler. */
  keywords: string;
};

export type ZonePriceRow = {
  id: Uuid;
  fromZoneId: Uuid;
  toZoneId: Uuid;
  vehicleType: VehicleType;
  price: Money;
  currency: string;
};

export type KmFormula = {
  enabled: boolean;
  baseFare: Money;
  perKm: Money;
  privateMultiplier: number;
  shuttleMultiplier: number;
  currency: string;
};

export function emptyKmFormula(): KmFormula {
  return { enabled: false, baseFare: 0, perKm: 0, privateMultiplier: 1, shuttleMultiplier: 0.7, currency: "TRY" };
}

/**
 * Gerçek geocoding yerine deterministik "en iyi çaba" eşleşmesi: adres
 * metninde bölgenin adı/anahtar kelimelerinden biri geçiyorsa o bölge
 * seçilir. Hiçbiri eşleşmezse null döner (dürüst: sahte bir bölge
 * uydurulmaz).
 */
function zoneTerms(zone: MapZone): string[] {
  return [zone.name, ...zone.keywords.split(",")]
    .map((t) => t.trim().toLocaleLowerCase("tr"))
    .filter(Boolean);
}

/**
 * Önce ada/anahtar kelimeye göre (spesifik) eşleşir; hiçbiri tutmazsa
 * şehir/ülkeye (kaba) düşer. Aksi halde aynı şehirdeki iki bölge
 * (ör. iki ayrı Antalya bölgesi) her zaman dizideki ilkine eşleşirdi.
 */
export function matchAddressToZone(address: string, zones: MapZone[]): MapZone | null {
  const normalized = address.trim().toLocaleLowerCase("tr");
  if (!normalized) return null;
  const bySpecificTerm = zones.find((zone) => zoneTerms(zone).some((term) => normalized.includes(term)));
  if (bySpecificTerm) return bySpecificTerm;
  return zones.find((zone) => normalized.includes(zone.cityCountry.trim().toLocaleLowerCase("tr"))) ?? null;
}

export function findZonePrice(
  matrix: ZonePriceRow[],
  fromZoneId: string,
  toZoneId: string,
  vehicleType: VehicleType,
): ZonePriceRow | undefined {
  return matrix.find(
    (row) => row.fromZoneId === fromZoneId && row.toZoneId === toZoneId && row.vehicleType === vehicleType,
  );
}

export function computeZonePrice(
  matrix: ZonePriceRow[],
  marginRules: TimeMarginRule[],
  params: { fromZoneId: string; toZoneId: string; vehicleType: VehicleType; vehicleId: string; time: string },
): Money | null {
  const row = findZonePrice(matrix, params.fromZoneId, params.toZoneId, params.vehicleType);
  if (!row) return null;
  return applyTimeMargin(row.price, marginRules, {
    scope: "zone",
    fromId: params.fromZoneId,
    toId: params.toZoneId,
    time: params.time,
    vehicleId: params.vehicleId,
  });
}

export function computeKmFormulaPrice(formula: KmFormula, km: number, vehicleType: VehicleType): Money {
  const multiplier = vehicleType === "private" ? formula.privateMultiplier : formula.shuttleMultiplier;
  return Math.round((formula.baseFare + formula.perKm * km) * multiplier);
}

/* --- C. Saatlik Kiralama ------------------------------------------------ */

export type RentalPointRole = "pickup" | "dropoff" | "both";
export type RentalPoint = { id: Uuid; name: string; role: RentalPointRole };

export function computeHourlyPrice(hourlyRate: Money, hours: number): Money {
  return Math.round(hourlyRate * hours);
}

/* --- Rezervasyon / Operasyon --------------------------------------------- */

export type TransferBookingModel = "nokta" | "harita" | "saatlik";
export type TransferOperationStatus = "planlamaBekliyor" | "aktifTransfer" | "tamamlandi";

export type TransferBooking = {
  id: Uuid;
  model: TransferBookingModel;
  vehicleId: Uuid;
  /** Veri Bütünlüğü İlkesi (Bölüm 4.2): rezervasyon anındaki ad denormalize kopyalanır. */
  vehicleTitleSnapshot: string;
  fromLabel: string;
  toLabel: string;
  oneWay: boolean;
  date: string;
  time: string;
  returnDate: string | null;
  returnTime: string | null;
  adults: number;
  children: number;
  price: Money;
  currency: string;
  operationStatus: TransferOperationStatus;
  assignedDriverName: string;
  assignedDriverNote: string;
  createdAt: string;
};

/* --- Transfer Ayarları ---------------------------------------------------- */

export type BookingApprovalMode = "otomatik" | "manuel";

export type TransferSettings = {
  defaultCurrency: string;
  tabVisibility: { noktaIleAracKiralama: boolean };
  bookingApprovalMode: BookingApprovalMode;
  cancellationTemplate: "esnek" | "orta" | "kati" | "ozel";
};
