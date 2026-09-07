import type { Money, Uuid } from "./types";

/**
 * Acentenin/tedarikçinin kendi yazdığı tur ürünü — "Tur Oluşturma Sihirbazı
 * Alan Bazlı UI Spesifikasyonu" Bölüm 3-5 (MVP + FAZ2 + FAZ3 kapsamı).
 *
 * `types.ts`'teki `Product`/`ProductVariant` ile karıştırılmaz: o, arama
 * sonucunda tedarikçiden gelen envanteri temsil eder; bu, sihirbazda
 * baştan yazılan taslağı temsil eder. Belgenin Bölüm 7'sindeki yeni
 * varlıklar (ITINERARY_STOP, MEETING_POINT, PRICING_OPTION, AGE_TIER,
 * CANCELLATION_POLICY, TOUR_CATEGORY, TOUR_TAG, TOUR_EXTRA,
 * ACCOMMODATION_PLAN, CUSTOMER_INFO_FIELD, PRODUCT_TRANSLATION) burada
 * tek bir taslak tipine yerleştirildi.
 *
 * Gerçek bir LLM/görsel-üretim/ödeme-iade altyapısı yok (bkz. READINESS.md);
 * "Yapay Zeka" ve "otomatik iade" gibi alanlar `ai-mock.ts`'teki
 * deterministik simülasyonla veya salt bilgilendirici notla temsil edilir.
 */

export type TourKind = "gunubirlik" | "cokGunlu" | "ozel" | "konaklamali";

/** 3.1 Program Tipi */
export type ProgramType = "tur" | "aktivite" | "transfer" | "bilet";

/** 3.8 Zorluk Seviyesi */
export type Difficulty = "kolay" | "orta" | "zor" | "uzman";

export type MeetingPoint = {
  id: Uuid;
  name: string;
  address: string;
  description: string;
};

export type TourCategory = {
  id: Uuid;
  title: string;
  slug: string;
};

export type TourTag = {
  id: Uuid;
  name: string;
};

/** 1.3 Tur Ekstraları kütüphanesi. */
export type TourExtra = {
  id: Uuid;
  name: string;
  price: Money;
  currency: string;
  type: "perPerson" | "perBooking";
};

export type ItineraryStop = {
  id: Uuid;
  name: string;
  durationMinutes: number;
  description: string;
};

/** 3.4 Konaklama Programı — çok otelli turlar. */
export type AccommodationNight = {
  night: number;
  accommodationName: string;
};

export type AccommodationPlan = {
  id: Uuid;
  name: string;
  nights: AccommodationNight[];
  /** Konaklama Bazlı fiyatlandırmada bu plana ait birim fiyat. */
  price: Money;
};

export type AgeTierKey = "adult" | "child" | "infant";

export type AgeTier = {
  key: AgeTierKey;
  enabled: boolean;
  minAge: number;
  maxAge: number;
  /** Kişi başı birim fiyat (minor unit). */
  price: Money;
};

/** 4.1 Grup Bazlı fiyatlandırma — sabit grup büyüklüğüne tek fiyat. */
export type GroupPricing = {
  minSize: number;
  maxSize: number;
  price: Money;
};

/** 4.2 Sezonluk fiyat kuralı — tarih aralığına göre yüzde ayarlama. */
export type SeasonalRule = {
  id: Uuid;
  startDate: string;
  endDate: string;
  /** Taban fiyata uygulanan yüzde (+artış / -indirim). */
  adjustmentPct: number;
};

/** 4.2 Erken rezervasyon / son dakika indirimi. */
export type DateBasedDiscount = {
  enabled: boolean;
  type: "earlyBird" | "lastMinute";
  daysThreshold: number;
  discountPct: number;
};

/** 4.2 Kademeli grup indirimi. */
export type TieredGroupDiscount = {
  enabled: boolean;
  minSize: number;
  discountPct: number;
};

/** 4.2 Acente özel net fiyat / markup. */
export type AgencyNetPricing = {
  enabled: boolean;
  netPrice: Money;
  markupPct: number;
};

/** 5.1 Rezervasyon Süreci / Ödeme Modu — altı mod. */
export type PaymentMode =
  | "anindaTamOdeme"
  | "kaporaBakiye"
  | "sadeceRezervasyon"
  | "cariHesap"
  | "yerindeOdeme"
  | "havaleEft";

/** 5.2 Esnek / Orta / Katı / Özel şablonları. */
export type CancellationTemplate = "esnek" | "orta" | "kati" | "ozel";

/** 5.2 Zaman dilimli kesinti kademesi. */
export type CancellationCutoff = {
  id: Uuid;
  daysBefore: number;
  refundPct: number;
};

/** 5.3 Müşteriden İstenecek Bilgiler — form builder alanı. */
export type CustomerInfoField = {
  id: Uuid;
  label: string;
  type: "text" | "date" | "file" | "select";
  required: boolean;
  scope: "bookingOwner" | "eachParticipant";
};

/** 5.5 Tur Ekstraları — bu ürüne bağlanan kütüphane kaydı. */
export type ExtraLink = {
  extraId: Uuid;
  required: boolean;
  sellPhase: "duringBooking" | "afterBooking";
};

export type TourImage = {
  id: Uuid;
  /** Gerçek depolama yok (prototip) — yalnızca dosya adı saklanır. */
  alt: string;
  /** AI ile oluşturulan görseller için: gerçek görsel yerine deterministik ton. */
  tone?: string;
};

/** Çoklu dil — tek alternatif dil (İngilizce) kapsamıyla. */
export type TourTranslation = {
  title: string;
  description: string;
  includes: string[];
  excludes: string[];
  knowBeforeYouGo: string;
  whatToBring: string;
  /** true: AI ile üretildi ve elle düzenlenmedi; elle düzenleme bunu false yapar. */
  auto: boolean;
};

export type TourDraft = {
  id: Uuid;
  status: "taslak" | "aktif" | "pasif" | "arsivlendi";
  featured: boolean;

  /* 3.1 Başlık ve Tür */
  title: string;
  slug: string;
  tourKind: TourKind | null;
  programType: ProgramType | null;
  showOnWebsite: boolean;
  askForPrice: boolean;
  forcedCurrency: boolean;
  listCurrencyOverride: string | null;
  tagIds: string[];

  /* 3.2 Kategori */
  categoryIds: string[];

  /* 3.3 Tur Programı */
  startLocation: string;
  endLocation: string;
  routeStops: string[];
  itinerary: ItineraryStop[];

  /* 3.4 Konaklama Programı */
  accommodationPlans: AccommodationPlan[];

  /* 3.5 Tur Detayı */
  description: string;
  extraNotes: string;

  /* 3.6 Fotoğraf/Video */
  images: TourImage[];
  coverImageId: Uuid | null;
  videoUrl: string | null;

  /* 3.7 Dahil Olanlar/Olmayanlar */
  includes: string[];
  excludes: string[];

  /* 3.8 / 3.9 */
  knowBeforeYouGo: string;
  difficulty: Difficulty | null;
  whatToBring: string;

  /* 3.10 Buluşma ve Alış Noktaları */
  meetingPointId: Uuid | null;
  meetingTimeMinutesBefore: number | null;
  pickup: { enabled: boolean; regions: string; extraFee: Money };

  /* 4.1 Fiyatlandırma */
  pricingModel: "kisiBasi" | "grupBazli" | "konaklamaBazli";
  pricingCurrency: string;
  alternateDisplayCurrency: string | null;
  ageTiers: AgeTier[];
  groupPricing: GroupPricing | null;

  /* 4.2 Ücretlendirme Seçenekleri */
  taxIncludedInPrice: boolean;
  seasonalRules: SeasonalRule[];
  dateBasedDiscount: DateBasedDiscount | null;
  tieredGroupDiscount: TieredGroupDiscount | null;
  agencyNetPricing: AgencyNetPricing | null;

  /* 5.1 Rezervasyon Süreci / Ödeme */
  paymentMode: PaymentMode;

  /* 5.2 İptal ve İade Politikası */
  cancellationTemplate: CancellationTemplate;
  customPolicyText: string;
  tieredCutoffs: CancellationCutoff[];
  noShowNoRefund: boolean;

  /* 5.3 Müşteriden İstenecek Bilgiler */
  customerInfoFields: CustomerInfoField[];

  /* 5.4 Sosyal Medya Gönderileri */
  socialPostDraft: { text: string; generatedAt: string } | null;

  /* 5.5 Tur Ekstraları */
  extraLinks: ExtraLink[];

  /* 5.6 Sözleşme */
  contract: { text: string; version: number; updatedAt: string } | null;

  /* Çoklu dil */
  translations: { en?: TourTranslation };

  createdAt: string;
  updatedAt: string;
};

export function emptyTourDraft(id: Uuid, now: string): TourDraft {
  return {
    id,
    status: "taslak",
    featured: false,
    title: "",
    slug: "",
    tourKind: null,
    programType: null,
    showOnWebsite: true,
    askForPrice: false,
    forcedCurrency: false,
    listCurrencyOverride: null,
    tagIds: [],
    categoryIds: [],
    startLocation: "",
    endLocation: "",
    routeStops: [],
    itinerary: [],
    accommodationPlans: [],
    description: "",
    extraNotes: "",
    images: [],
    coverImageId: null,
    videoUrl: null,
    includes: [],
    excludes: [],
    knowBeforeYouGo: "",
    difficulty: null,
    whatToBring: "",
    meetingPointId: null,
    meetingTimeMinutesBefore: null,
    pickup: { enabled: false, regions: "", extraFee: 0 },
    pricingModel: "kisiBasi",
    pricingCurrency: "TRY",
    alternateDisplayCurrency: null,
    ageTiers: [
      { key: "adult", enabled: true, minAge: 18, maxAge: 99, price: 0 },
      { key: "child", enabled: false, minAge: 2, maxAge: 17, price: 0 },
      { key: "infant", enabled: false, minAge: 0, maxAge: 1, price: 0 },
    ],
    groupPricing: null,
    taxIncludedInPrice: true,
    seasonalRules: [],
    dateBasedDiscount: null,
    tieredGroupDiscount: null,
    agencyNetPricing: null,
    paymentMode: "anindaTamOdeme",
    cancellationTemplate: "orta",
    customPolicyText: "",
    tieredCutoffs: [],
    noShowNoRefund: false,
    customerInfoFields: [],
    socialPostDraft: null,
    extraLinks: [],
    contract: null,
    translations: {},
    createdAt: now,
    updatedAt: now,
  };
}

const TR_MAP: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
  Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u",
};

/** Başlıktan SEO dostu slug türetir (Bölüm 3.1 — elle düzenlenebilir). */
export function slugify(title: string): string {
  const ascii = title.replace(/[çğışöüÇĞİŞÖÜ]/g, (ch) => TR_MAP[ch] ?? ch);
  return ascii
    .toLocaleLowerCase("tr")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Zorunlu alanlar — Bölüm 2.2: Başlık, Slug, Açıklama, Gidilecek Yerler. */
export function missingRequiredFields(draft: TourDraft): string[] {
  const missing: string[] = [];
  if (!draft.title.trim()) missing.push("title");
  if (!draft.slug.trim()) missing.push("slug");
  if (!draft.description.trim()) missing.push("description");
  if (draft.itinerary.length === 0) missing.push("itinerary");
  return missing;
}

export function canPublish(draft: TourDraft): boolean {
  return missingRequiredFields(draft).length === 0;
}

/**
 * Tur içeriği % göstergesi (Bölüm 2.2) — zorunlu alanlar iki katı ağırlıkta,
 * önerilen alanlar tek katı. Yayınlama %100 gerektirmez, yalnızca bilgi verir.
 */
export function tourCompletionPct(draft: TourDraft): number {
  const required: [boolean, number][] = [
    [draft.title.trim().length > 0, 2],
    [draft.slug.trim().length > 0, 2],
    [draft.description.trim().length > 0, 2],
    [draft.itinerary.length > 0, 2],
  ];
  const recommended: [boolean, number][] = [
    [draft.tourKind !== null, 1],
    [draft.categoryIds.length > 0, 1],
    [draft.startLocation.trim().length > 0, 1],
    [draft.images.length > 0, 1],
    [draft.includes.length > 0, 1],
    [draft.knowBeforeYouGo.trim().length > 0, 1],
    [draft.whatToBring.trim().length > 0, 1],
    [draft.meetingPointId !== null, 1],
    [draft.ageTiers.some((t) => t.enabled && t.price > 0), 1],
  ];
  const all = [...required, ...recommended];
  const total = all.reduce((sum, [, weight]) => sum + weight, 0);
  const done = all.reduce((sum, [ok, weight]) => sum + (ok ? weight : 0), 0);
  return Math.round((done / total) * 100);
}
