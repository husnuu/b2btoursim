import type {
  Agency,
  Booking,
  Invoice,
  LedgerEntry,
  Payment,
  Product,
  SearchResult,
  Supplier,
  Tenant,
  User,
} from "@/lib/types";

/**
 * Geçici veri — Teknik Tasarım Dokümanı Bölüm 2.2'deki varlık sözlüğüne göre
 * şekillendirildi. Backend bağlandığında bu dosya silinir, tipler kalır.
 *
 * Deterministik: hiçbir yerde Math.random ya da new Date() yok, böylece
 * ekran görüntüsü ve test sonuçları tekrarlanabilir.
 */

/** Dokümanların hazırlandığı tarih; "bugün" bu kabul edilir. */
export const TODAY = "2026-09-07";
const day = (d: string, hhmm = "00:00") => `${d}T${hhmm}:00.000Z`;

/* ========================================================================== */
/* Tedarikçiler                                                               */
/* ========================================================================== */

export const SUPPLIERS: Supplier[] = [
  {
    id: "hb",
    name: "Hotelbeds",
    code: "HB",
    adapterType: "bedbank",
    status: "active",
    credentialsRef: "secrets/suppliers/hotelbeds",
    uptimePct: 99.82,
    avgLatencyMs: 1840,
    errorRatePct: 0.4,
  },
  {
    id: "gyg",
    name: "GetYourGuide",
    code: "GY",
    adapterType: "own_contracted",
    status: "active",
    credentialsRef: "secrets/suppliers/gyg",
    uptimePct: 99.41,
    avgLatencyMs: 2610,
    errorRatePct: 1.1,
  },
  {
    id: "vlt",
    name: "Viator",
    code: "VT",
    adapterType: "own_contracted",
    status: "active",
    credentialsRef: "secrets/suppliers/viator",
    uptimePct: 98.90,
    avgLatencyMs: 4120,
    errorRatePct: 2.3,
  },
  {
    id: "loc",
    name: "Kapadokya DMC",
    code: "KD",
    adapterType: "own_contracted",
    status: "active",
    credentialsRef: "secrets/suppliers/kapadokya-dmc",
    uptimePct: 99.95,
    avgLatencyMs: 890,
    errorRatePct: 0.1,
  },
  {
    id: "trx",
    name: "TravelX Bedbank",
    code: "TX",
    adapterType: "bedbank",
    status: "degraded",
    credentialsRef: "secrets/suppliers/travelx",
    uptimePct: 91.20,
    avgLatencyMs: 9450,
    errorRatePct: 14.8,
  },
  {
    id: "amd",
    name: "Amadeus",
    code: "AM",
    adapterType: "gds",
    status: "sandbox",
    credentialsRef: "secrets/suppliers/amadeus",
    uptimePct: 99.99,
    avgLatencyMs: 3200,
    errorRatePct: 0.2,
  },
  {
    id: "stripe",
    name: "Stripe",
    code: "ST",
    adapterType: "payment",
    status: "active",
    credentialsRef: "secrets/payment/stripe",
    uptimePct: 99.99,
    avgLatencyMs: 310,
    errorRatePct: 0.05,
  },
];

export const supplierById = (id: string) => SUPPLIERS.find((s) => s.id === id)!;
const s = supplierById;

/** Aramaya katılan tedarikçiler — ödeme/vergi adaptörleri bunun dışındadır. */
export const SEARCH_SUPPLIERS = SUPPLIERS.filter((x) =>
  ["bedbank", "own_contracted", "gds", "ndc"].includes(x.adapterType),
).slice(0, 5);

/* ========================================================================== */
/* Kiracılar, acenteler, kullanıcılar                                         */
/* ========================================================================== */

export const TENANTS: Tenant[] = [
  {
    id: "t-anadolu",
    name: "Anadolu Seyahat",
    plan: "growth",
    status: "active",
    defaultCurrency: "TRY",
    createdAt: day("2025-11-14"),
    agencyCount: 12,
    bookingsLast30d: 1_284,
    gmvLast30d: 4_820_000_00,
    mrr: 24_900_00,
  },
  {
    id: "t-levant",
    name: "Levant DMC",
    plan: "enterprise",
    status: "active",
    defaultCurrency: "EUR",
    createdAt: day("2025-06-02"),
    agencyCount: 41,
    bookingsLast30d: 3_910,
    gmvLast30d: 12_400_000_00,
    mrr: 78_000_00,
  },
  {
    id: "t-bosphorus",
    name: "Bosphorus Travel",
    plan: "starter",
    status: "trial",
    defaultCurrency: "USD",
    createdAt: day("2026-08-28"),
    agencyCount: 1,
    bookingsLast30d: 18,
    gmvLast30d: 62_400_00,
    mrr: 0,
  },
  {
    id: "t-aegean",
    name: "Aegean Holidays",
    plan: "growth",
    status: "active",
    defaultCurrency: "EUR",
    createdAt: day("2026-02-19"),
    agencyCount: 7,
    bookingsLast30d: 640,
    gmvLast30d: 1_950_000_00,
    mrr: 24_900_00,
  },
  {
    id: "t-petra",
    name: "Petra Tours",
    plan: "starter",
    status: "suspended",
    defaultCurrency: "USD",
    createdAt: day("2025-09-30"),
    agencyCount: 3,
    bookingsLast30d: 0,
    gmvLast30d: 0,
    mrr: 9_900_00,
  },
  {
    id: "t-adriatic",
    name: "Adriatic Blue",
    plan: "growth",
    status: "closed",
    defaultCurrency: "EUR",
    createdAt: day("2025-03-11"),
    agencyCount: 0,
    bookingsLast30d: 0,
    gmvLast30d: 0,
    mrr: 0,
  },
];

export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 9_900_00,
    currency: "TRY",
    bookingQuota: 500,
    agencyQuota: 3,
    supplierQuota: 2,
    features: ["B2B Extranet", "Tek B2C vitrin", "E-posta desteği"],
    tenantCount: 2,
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: 24_900_00,
    currency: "TRY",
    bookingQuota: 5_000,
    agencyQuota: 25,
    supplierQuota: 8,
    features: ["Alt acente yönetimi", "White-label", "Öncelikli destek"],
    tenantCount: 3,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 78_000_00,
    currency: "TRY",
    bookingQuota: -1,
    agencyQuota: -1,
    supplierQuota: -1,
    features: ["Sınırsız acente", "Özel domain", "SLA ve hesap yöneticisi"],
    tenantCount: 1,
  },
] as const;

export const AGENCY: Agency = {
  id: "a-anadolu-merkez",
  tenantId: "t-anadolu",
  parentAgencyId: null,
  name: "Anadolu Seyahat",
  type: "master",
  creditLimit: 250_000_00,
  balance: 63_400_00,
  currency: "TRY",
  paymentTermDays: 30,
};

export const SUB_AGENCIES: Agency[] = [
  {
    id: "a-ege",
    tenantId: "t-anadolu",
    parentAgencyId: AGENCY.id,
    name: "Ege Turizm",
    type: "sub_agency",
    creditLimit: 40_000_00,
    balance: 12_800_00,
    currency: "TRY",
    paymentTermDays: 30,
  },
  {
    id: "a-akdeniz",
    tenantId: "t-anadolu",
    parentAgencyId: AGENCY.id,
    name: "Akdeniz Tur",
    type: "sub_agency",
    creditLimit: 25_000_00,
    balance: 1_150_00,
    currency: "TRY",
    paymentTermDays: 60,
  },
  {
    id: "a-karadeniz",
    tenantId: "t-anadolu",
    parentAgencyId: AGENCY.id,
    name: "Karadeniz Seyahat",
    type: "sub_agency",
    creditLimit: 15_000_00,
    balance: -2_400_00,
    currency: "TRY",
    paymentTermDays: 30,
  },
];

export const CURRENT_USER: User = {
  id: "u-deniz",
  tenantId: "t-anadolu",
  agencyId: AGENCY.id,
  role: "agency_admin",
  email: "deniz.acar@anadoluseyahat.example",
  fullName: "Deniz Acar",
  status: "active",
  lastSeenAt: day(TODAY, "08:12"),
};

export const AGENCY_USERS: User[] = [
  CURRENT_USER,
  {
    id: "u-selin",
    tenantId: "t-anadolu",
    agencyId: AGENCY.id,
    role: "sales",
    email: "selin.kaya@anadoluseyahat.example",
    fullName: "Selin Kaya",
    status: "active",
    lastSeenAt: day(TODAY, "07:55"),
  },
  {
    id: "u-mert",
    tenantId: "t-anadolu",
    agencyId: AGENCY.id,
    role: "sales",
    email: "mert.ozturk@anadoluseyahat.example",
    fullName: "Mert Öztürk",
    status: "active",
    lastSeenAt: day("2026-09-06", "17:40"),
  },
  {
    id: "u-gamze",
    tenantId: "t-anadolu",
    agencyId: AGENCY.id,
    role: "accounting",
    email: "gamze.tan@anadoluseyahat.example",
    fullName: "Gamze Tan",
    status: "active",
    lastSeenAt: day("2026-09-05", "11:02"),
  },
  {
    id: "u-baris",
    tenantId: "t-anadolu",
    agencyId: AGENCY.id,
    role: "sales",
    email: "baris.yilmaz@anadoluseyahat.example",
    fullName: "Barış Yılmaz",
    status: "invited",
    lastSeenAt: null,
  },
  {
    id: "u-eski",
    tenantId: "t-anadolu",
    agencyId: AGENCY.id,
    role: "sales",
    email: "eski.kullanici@anadoluseyahat.example",
    fullName: "Ayça Demir",
    status: "disabled",
    lastSeenAt: day("2026-04-18", "09:30"),
  },
];

/** RBAC şablonları — Süper Admin'de tanımlanır, tenant'lara uygulanır. */
export const ROLE_TEMPLATES = [
  {
    role: "platform_admin" as const,
    scopes: ["admin:tenants", "admin:suppliers", "admin:billing", "*:read"],
  },
  {
    role: "agency_admin" as const,
    scopes: [
      "bookings:read",
      "bookings:write",
      "finance:read",
      "users:write",
      "settings:write",
    ],
  },
  { role: "sales" as const, scopes: ["bookings:read", "bookings:write"] },
  {
    role: "accounting" as const,
    scopes: ["bookings:read", "finance:read", "finance:write"],
  },
];

/* ========================================================================== */
/* Arama sonuçları — tur ve otel                                              */
/* ========================================================================== */

const TOUR_DAY = "2026-09-18";
const at = (hhmm: string) => day(TOUR_DAY, hhmm);

export const TOUR_RESULTS: SearchResult[] = [
  {
    id: "r1", productId: "p-balon", type: "tour",
    title: "Kapadokya sıcak hava balonu — gün doğumu",
    supplier: s("loc"), startsAt: at("02:30"), durationMinutes: 180,
    languages: ["TR", "EN"], cancellation: { type: "free", hoursBefore: 24 },
    net: 1_240_00, defaultMarginPct: 18, rating: 4.8, reviewCount: 2140,
    remaining: 6, instantConfirm: true, imageTone: "#b8623a",
  },
  {
    id: "r2", productId: "p-balon", type: "tour",
    title: "Kapadokya sıcak hava balonu — gün doğumu",
    supplier: s("hb"), startsAt: at("02:30"), durationMinutes: 180,
    languages: ["TR", "EN", "DE"], cancellation: { type: "free", hoursBefore: 48 },
    net: 1_310_00, defaultMarginPct: 15, rating: 4.8, reviewCount: 2140,
    remaining: 12, instantConfirm: true, imageTone: "#8a5a3b",
  },
  {
    id: "r3", productId: "p-yesil", type: "tour",
    title: "Yeşil tur — Ihlara Vadisi ve Derinkuyu",
    supplier: s("loc"), startsAt: at("06:00"), durationMinutes: 480,
    languages: ["TR", "EN"], cancellation: { type: "free", hoursBefore: 24 },
    net: 640_00, defaultMarginPct: 22, rating: 4.6, reviewCount: 863,
    remaining: 18, instantConfirm: true, imageTone: "#4a6b47",
  },
  {
    id: "r4", productId: "p-yesil", type: "tour",
    title: "Yeşil tur — Ihlara Vadisi ve Derinkuyu",
    supplier: s("gyg"), startsAt: at("06:15"), durationMinutes: 480,
    languages: ["EN", "ES"], cancellation: { type: "free", hoursBefore: 24 },
    net: 705_00, defaultMarginPct: 16, rating: 4.5, reviewCount: 412,
    remaining: 4, instantConfirm: false, imageTone: "#3f5f4f",
  },
  {
    id: "r5", productId: "p-atv", type: "tour",
    title: "Gün batımı ATV safari — Güvercinlik Vadisi",
    supplier: s("vlt"), startsAt: at("15:30"), durationMinutes: 120,
    languages: ["TR", "EN", "RU"], cancellation: { type: "free", hoursBefore: 12 },
    net: 285_00, defaultMarginPct: 30, rating: 4.4, reviewCount: 1097,
    remaining: 22, instantConfirm: true, imageTone: "#a5762d",
  },
  {
    id: "r6", productId: "p-atv", type: "tour",
    title: "Gün batımı ATV safari — Güvercinlik Vadisi",
    supplier: s("loc"), startsAt: at("15:45"), durationMinutes: 120,
    languages: ["TR"], cancellation: { type: "nonRefundable" },
    net: 245_00, defaultMarginPct: 34, rating: 4.3, reviewCount: 318,
    remaining: 9, instantConfirm: true, imageTone: "#8f6a30",
  },
  {
    id: "r7", productId: "p-kirmizi", type: "tour",
    title: "Kırmızı tur — Göreme, Paşabağ, Devrent",
    supplier: s("hb"), startsAt: at("06:30"), durationMinutes: 420,
    languages: ["TR", "EN", "FR"], cancellation: { type: "free", hoursBefore: 24 },
    net: 520_00, defaultMarginPct: 24, rating: 4.7, reviewCount: 1533,
    remaining: 30, instantConfirm: true, imageTone: "#9d4a4a",
  },
  {
    id: "r8", productId: "p-kirmizi", type: "tour",
    title: "Kırmızı tur — Göreme, Paşabağ, Devrent",
    supplier: s("gyg"), startsAt: at("06:30"), durationMinutes: 420,
    languages: ["EN"], cancellation: { type: "free", hoursBefore: 72 },
    net: 575_00, defaultMarginPct: 18, rating: 4.7, reviewCount: 1533,
    remaining: 11, instantConfirm: true, imageTone: "#7d3f45",
  },
  {
    id: "r9", productId: "p-seramik", type: "tour",
    title: "Avanos çömlek atölyesi — özel ders",
    supplier: s("loc"), startsAt: at("11:00"), durationMinutes: 90,
    languages: ["TR", "EN"], cancellation: { type: "free", hoursBefore: 6 },
    net: 190_00, defaultMarginPct: 40, rating: 4.9, reviewCount: 205,
    remaining: 3, instantConfirm: true, imageTone: "#8a6b52",
  },
  {
    id: "r10", productId: "p-hamam", type: "tour",
    title: "Geleneksel hamam ve köpük masajı",
    supplier: s("vlt"), startsAt: at("14:00"), durationMinutes: 75,
    languages: ["TR", "EN", "RU"], cancellation: { type: "free", hoursBefore: 24 },
    net: 310_00, defaultMarginPct: 26, rating: 4.2, reviewCount: 640,
    remaining: 15, instantConfirm: true, imageTone: "#4b6b78",
  },
  {
    id: "r11", productId: "p-safari", type: "tour",
    title: "Jeep safari — Kızılçukur gün batımı",
    supplier: s("vlt"), startsAt: at("15:00"), durationMinutes: 150,
    languages: ["TR", "EN"], cancellation: { type: "free", hoursBefore: 24 },
    net: 340_00, defaultMarginPct: 28, rating: 4.5, reviewCount: 489,
    remaining: 7, instantConfirm: true, imageTone: "#96552f",
  },
  {
    id: "r12", productId: "p-at", type: "tour",
    title: "At turu — Aşk Vadisi rotası",
    supplier: s("gyg"), startsAt: at("07:00"), durationMinutes: 120,
    languages: ["EN", "DE"], cancellation: { type: "free", hoursBefore: 24 },
    net: 420_00, defaultMarginPct: 20, rating: 4.6, reviewCount: 271,
    remaining: 5, instantConfirm: false, imageTone: "#6a5b8a",
  },
];

/** Geriye dönük ad — mevcut tur ekranları bunu kullanıyor. */
export const SEARCH_RESULTS = TOUR_RESULTS;

const HOTEL_DAY = "2026-10-12";
const hotelAt = () => day(HOTEL_DAY, "14:00");

export const HOTEL_RESULTS: SearchResult[] = [
  {
    id: "h1", productId: "p-otel-museum", type: "hotel",
    title: "Museum Hotel Cappadocia", supplier: s("hb"), startsAt: hotelAt(),
    durationMinutes: 0, languages: ["TR", "EN"],
    cancellation: { type: "free", hoursBefore: 48 },
    net: 8_400_00, defaultMarginPct: 14, rating: 4.9, reviewCount: 1210,
    remaining: 3, instantConfirm: true, imageTone: "#8a6b52",
    stars: 5, board: "breakfast", roomType: "Deluxe mağara oda", district: "Uçhisar",
  },
  {
    id: "h2", productId: "p-otel-museum", type: "hotel",
    title: "Museum Hotel Cappadocia", supplier: s("trx"), startsAt: hotelAt(),
    durationMinutes: 0, languages: ["EN"],
    cancellation: { type: "nonRefundable" },
    net: 7_950_00, defaultMarginPct: 18, rating: 4.9, reviewCount: 1210,
    remaining: 1, instantConfirm: true, imageTone: "#7a5f4a",
    stars: 5, board: "breakfast", roomType: "Deluxe mağara oda", district: "Uçhisar",
  },
  {
    id: "h3", productId: "p-otel-sultan", type: "hotel",
    title: "Sultan Cave Suites", supplier: s("hb"), startsAt: hotelAt(),
    durationMinutes: 0, languages: ["TR", "EN", "DE"],
    cancellation: { type: "free", hoursBefore: 24 },
    net: 4_600_00, defaultMarginPct: 20, rating: 4.7, reviewCount: 2840,
    remaining: 8, instantConfirm: true, imageTone: "#a86b45",
    stars: 4, board: "breakfast", roomType: "Standart mağara oda", district: "Göreme",
  },
  {
    id: "h4", productId: "p-otel-sultan", type: "hotel",
    title: "Sultan Cave Suites", supplier: s("gyg"), startsAt: hotelAt(),
    durationMinutes: 0, languages: ["EN"],
    cancellation: { type: "free", hoursBefore: 72 },
    net: 4_980_00, defaultMarginPct: 16, rating: 4.7, reviewCount: 2840,
    remaining: 5, instantConfirm: true, imageTone: "#96603e",
    stars: 4, board: "half_board", roomType: "Standart mağara oda", district: "Göreme",
  },
  {
    id: "h5", productId: "p-otel-kelebek", type: "hotel",
    title: "Kelebek Special Cave Hotel", supplier: s("loc"), startsAt: hotelAt(),
    durationMinutes: 0, languages: ["TR", "EN"],
    cancellation: { type: "free", hoursBefore: 24 },
    net: 2_850_00, defaultMarginPct: 26, rating: 4.5, reviewCount: 1960,
    remaining: 14, instantConfirm: true, imageTone: "#6d7a4e",
    stars: 3, board: "breakfast", roomType: "Aile odası", district: "Göreme",
  },
  {
    id: "h6", productId: "p-otel-kelebek", type: "hotel",
    title: "Kelebek Special Cave Hotel", supplier: s("hb"), startsAt: hotelAt(),
    durationMinutes: 0, languages: ["TR", "EN"],
    cancellation: { type: "nonRefundable" },
    net: 2_610_00, defaultMarginPct: 30, rating: 4.5, reviewCount: 1960,
    remaining: 6, instantConfirm: true, imageTone: "#5f6b46",
    stars: 3, board: "room_only", roomType: "Standart oda", district: "Göreme",
  },
  {
    id: "h7", productId: "p-otel-argos", type: "hotel",
    title: "Argos in Cappadocia", supplier: s("trx"), startsAt: hotelAt(),
    durationMinutes: 0, languages: ["TR", "EN", "FR"],
    cancellation: { type: "free", hoursBefore: 48 },
    net: 11_200_00, defaultMarginPct: 12, rating: 4.9, reviewCount: 780,
    remaining: 2, instantConfirm: false, imageTone: "#4b6b78",
    stars: 5, board: "all_inclusive", roomType: "Splendid suit", district: "Uçhisar",
  },
  {
    id: "h8", productId: "p-otel-koza", type: "hotel",
    title: "Koza Cave Hotel", supplier: s("loc"), startsAt: hotelAt(),
    durationMinutes: 0, languages: ["TR", "EN"],
    cancellation: { type: "free", hoursBefore: 24 },
    net: 3_400_00, defaultMarginPct: 24, rating: 4.6, reviewCount: 1120,
    remaining: 9, instantConfirm: true, imageTone: "#8f6a30",
    stars: 4, board: "breakfast", roomType: "Suit", district: "Göreme",
  },
];

/* ========================================================================== */
/* Ürünler                                                                    */
/* ========================================================================== */

export const PRODUCTS: Record<string, Product> = {
  "p-balon": {
    id: "p-balon", type: "tour",
    title: "Kapadokya sıcak hava balonu — gün doğumu",
    summary:
      "Göreme üzerinde bir saatlik uçuş. Otelden alış, uçuş sonrası sertifika ve ikram dahil.",
    supplier: s("loc"), destination: "Kapadokya", durationMinutes: 180,
    languages: ["TR", "EN"], cancellation: { type: "free", hoursBefore: 24 },
    meetingPoint: "Otelden alış — Göreme, Ürgüp, Uçhisar bölgesi",
    includes: [
      "Otelden alış ve bırakış",
      "Yaklaşık 60 dakika uçuş",
      "Uçuş sertifikası ve ikram",
      "Sigorta",
    ],
    excludes: ["Kişisel harcamalar", "Bahşiş", "Otel konaklaması"],
    supplierRef: "KD-BAL-0912", rating: 4.8, reviewCount: 2140, imageTone: "#b8623a",
    variants: [
      { id: "v-balon-std", name: "Standart sepet — 20 kişi", startsAt: at("02:30"), basePrice: 1_240_00, currency: "TRY", cancellation: { type: "free", hoursBefore: 24 }, quantityAvailable: 6 },
      { id: "v-balon-konfor", name: "Konfor sepet — 12 kişi", startsAt: at("02:30"), basePrice: 1_620_00, currency: "TRY", cancellation: { type: "free", hoursBefore: 24 }, quantityAvailable: 4 },
      { id: "v-balon-ozel", name: "Özel sepet — 2 kişi", startsAt: at("03:00"), basePrice: 4_850_00, currency: "TRY", cancellation: { type: "free", hoursBefore: 48 }, quantityAvailable: 1 },
    ],
  },
  "p-yesil": {
    id: "p-yesil", type: "tour",
    title: "Yeşil tur — Ihlara Vadisi ve Derinkuyu",
    summary:
      "Derinkuyu yeraltı şehri, Ihlara Vadisi yürüyüşü, Selime Katedrali ve Narlıgöl manzarası.",
    supplier: s("loc"), destination: "Kapadokya", durationMinutes: 480,
    languages: ["TR", "EN"], cancellation: { type: "free", hoursBefore: 24 },
    meetingPoint: "Göreme Otogarı, 1 numaralı peron",
    includes: ["Rehberlik", "Öğle yemeği", "Ulaşım", "Müze girişleri"],
    excludes: ["İçecekler", "Bahşiş"],
    supplierRef: "KD-YES-0441", rating: 4.6, reviewCount: 863, imageTone: "#4a6b47",
    variants: [
      { id: "v-yesil-grup", name: "Grup turu", startsAt: at("06:00"), basePrice: 640_00, currency: "TRY", cancellation: { type: "free", hoursBefore: 24 }, quantityAvailable: 18 },
      { id: "v-yesil-ozel", name: "Özel araç ve rehber", startsAt: at("06:00"), basePrice: 3_400_00, currency: "TRY", cancellation: { type: "free", hoursBefore: 48 }, quantityAvailable: 2 },
    ],
  },
  "p-otel-sultan": {
    id: "p-otel-sultan", type: "hotel",
    title: "Sultan Cave Suites",
    summary:
      "Göreme'nin tepesinde, balon manzaralı taraçasıyla bilinen butik mağara otel. Kahvaltı taraçada servis edilir.",
    supplier: s("hb"), destination: "Kapadokya", durationMinutes: 0,
    languages: ["TR", "EN", "DE"], cancellation: { type: "free", hoursBefore: 24 },
    meetingPoint: "Aydınlı Mah., Göreme / Nevşehir",
    includes: ["Kahvaltı", "Ücretsiz Wi-Fi", "Taraça kullanımı"],
    excludes: ["Şehir vergisi", "Otopark", "Havalimanı transferi"],
    supplierRef: "HB-4410992", rating: 4.7, reviewCount: 2840, imageTone: "#a86b45",
    stars: 4, address: "Aydınlı Mah. Göreme, Nevşehir",
    variants: [
      { id: "v-sultan-std", name: "Standart mağara oda — kahvaltı dahil", startsAt: hotelAt(), basePrice: 4_600_00, currency: "TRY", cancellation: { type: "free", hoursBefore: 24 }, quantityAvailable: 8 },
      { id: "v-sultan-deluxe", name: "Deluxe oda — kahvaltı dahil", startsAt: hotelAt(), basePrice: 6_200_00, currency: "TRY", cancellation: { type: "free", hoursBefore: 24 }, quantityAvailable: 4 },
      { id: "v-sultan-suit", name: "Taraça suit — yarım pansiyon", startsAt: hotelAt(), basePrice: 9_800_00, currency: "TRY", cancellation: { type: "nonRefundable" }, quantityAvailable: 2 },
    ],
  },
};

/**
 * Ürün detayına düşüldüğünde tam kayıt yoksa arama sonucundan minimal bir
 * ürün türetilir. Gerçek API bağlandığında bu yardımcı kalkar.
 */
export function getProduct(id: string): Product | null {
  if (PRODUCTS[id]) return PRODUCTS[id];
  const r = [...TOUR_RESULTS, ...HOTEL_RESULTS].find((x) => x.productId === id);
  if (!r) return null;
  const isHotel = r.type === "hotel";
  return {
    id, type: r.type, title: r.title,
    summary: isHotel
      ? "Bölgenin merkezinde, tedarikçi kontratıyla satılan otel. Oda tipi ve pansiyon seçenekleri aşağıda."
      : "Yerel operatörün düzenlediği tur. Buluşma noktası ve saat rezervasyon sonrası voucher üzerinde yer alır.",
    supplier: r.supplier, destination: "Kapadokya",
    durationMinutes: r.durationMinutes, languages: r.languages,
    cancellation: r.cancellation,
    meetingPoint: isHotel ? (r.district ?? "Kapadokya") : "Göreme merkez, tur aracı buluşma noktası",
    includes: isHotel ? ["Kahvaltı", "Ücretsiz Wi-Fi"] : ["Rehberlik", "Ulaşım", "Sigorta"],
    excludes: isHotel ? ["Şehir vergisi", "Otopark"] : ["Kişisel harcamalar", "Bahşiş"],
    supplierRef: `${r.supplier.code}-${id.toUpperCase()}`,
    rating: r.rating ?? 4.5, reviewCount: r.reviewCount ?? 0, imageTone: r.imageTone,
    stars: r.stars,
    variants: [
      {
        id: `v-${id}-1`,
        name: isHotel ? (r.roomType ?? "Standart oda") : "Grup turu",
        startsAt: r.startsAt, basePrice: r.net, currency: "TRY",
        cancellation: r.cancellation, quantityAvailable: r.remaining ?? 10,
      },
    ],
  };
}

/* ========================================================================== */
/* Rezervasyonlar                                                             */
/* ========================================================================== */

type Seed = {
  ref: string; name: string; email: string; phone: string;
  product: string; variant: string; supplier: string;
  travel: string; created: string; status: Booking["status"];
  net: number; margin: number; qty: number; supplierRef: string | null;
  note?: string;
};

const SEEDS: Seed[] = [
  { ref: "KNT-24081", name: "Elif Yıldırım", email: "elif.yildirim@example.com", phone: "+90 532 000 00 01", product: "Kapadokya sıcak hava balonu — gün doğumu", variant: "Standart sepet — 20 kişi", supplier: "loc", travel: "2026-09-18", created: "2026-09-04", status: "confirmed", net: 1_240_00, margin: 18, qty: 2, supplierRef: "KD-BAL-99120", note: "Balon sonrası otele bırakılacak." },
  { ref: "KNT-24080", name: "Marco Bianchi", email: "marco.bianchi@example.com", phone: "+39 340 000 0002", product: "Kırmızı tur — Göreme, Paşabağ, Devrent", variant: "Grup turu", supplier: "hb", travel: "2026-09-12", created: "2026-09-04", status: "pending", net: 520_00, margin: 24, qty: 3, supplierRef: "HB-4410992" },
  { ref: "KNT-24079", name: "Ayşe Demirkan", email: "ayse.demirkan@example.com", phone: "+90 555 000 00 03", product: "Avanos çömlek atölyesi — özel ders", variant: "Özel ders", supplier: "loc", travel: "2026-09-21", created: "2026-09-03", status: "draft", net: 190_00, margin: 40, qty: 2, supplierRef: null },
  { ref: "KNT-24078", name: "Nikolai Petrov", email: "n.petrov@example.com", phone: "+7 903 000 0004", product: "Gün batımı ATV safari — Güvercinlik Vadisi", variant: "Çift kişilik ATV", supplier: "vlt", travel: "2026-09-09", created: "2026-09-03", status: "partiallyCancelled", net: 285_00, margin: 30, qty: 3, supplierRef: "VT-77120043", note: "Bir katılımcı iptal edildi." },
  { ref: "KNT-24077", name: "Sophie Laurent", email: "s.laurent@example.com", phone: "+33 6 00 00 0005", product: "At turu — Aşk Vadisi rotası", variant: "Grup turu", supplier: "gyg", travel: "2026-09-15", created: "2026-09-02", status: "confirmed", net: 420_00, margin: 20, qty: 2, supplierRef: "GY-2210884" },
  { ref: "KNT-24076", name: "Burak Şahin", email: "burak.sahin@example.com", phone: "+90 542 000 00 06", product: "Jeep safari — Kızılçukur gün batımı", variant: "Grup turu", supplier: "vlt", travel: "2026-09-07", created: "2026-09-01", status: "cancelled", net: 340_00, margin: 28, qty: 2, supplierRef: null },
  { ref: "KNT-24075", name: "Hannah Weber", email: "h.weber@example.com", phone: "+49 170 000 0007", product: "Geleneksel hamam ve köpük masajı", variant: "Standart paket", supplier: "vlt", travel: "2026-09-06", created: "2026-08-30", status: "refunded", net: 310_00, margin: 26, qty: 2, supplierRef: "VT-77119820" },
  { ref: "KNT-24074", name: "Chen Wei", email: "chen.wei@example.com", phone: "+86 138 0000 0008", product: "Yeşil tur — Ihlara Vadisi ve Derinkuyu", variant: "Grup turu", supplier: "gyg", travel: "2026-09-25", created: "2026-08-29", status: "pending", net: 705_00, margin: 16, qty: 2, supplierRef: "GY-2210901" },
  { ref: "KNT-24073", name: "Ahmet Korkmaz", email: "a.korkmaz@example.com", phone: "+90 533 000 00 09", product: "Sultan Cave Suites", variant: "Standart mağara oda — 3 gece", supplier: "hb", travel: "2026-10-12", created: "2026-08-28", status: "confirmed", net: 4_600_00, margin: 20, qty: 1, supplierRef: "HB-4411204" },
  { ref: "KNT-24072", name: "Laura Fernández", email: "l.fernandez@example.com", phone: "+34 600 000 010", product: "Kapadokya sıcak hava balonu — gün doğumu", variant: "Konfor sepet — 12 kişi", supplier: "hb", travel: "2026-08-22", created: "2026-08-10", status: "completed", net: 1_620_00, margin: 15, qty: 2, supplierRef: "HB-4409981" },
  { ref: "KNT-24071", name: "Tomás Silva", email: "t.silva@example.com", phone: "+351 91 000 0011", product: "Kırmızı tur — Göreme, Paşabağ, Devrent", variant: "Grup turu", supplier: "gyg", travel: "2026-08-19", created: "2026-08-05", status: "completed", net: 575_00, margin: 18, qty: 4, supplierRef: "GY-2209773" },
  { ref: "KNT-24070", name: "Yuki Tanaka", email: "y.tanaka@example.com", phone: "+81 90 0000 0012", product: "Museum Hotel Cappadocia", variant: "Deluxe mağara oda — 2 gece", supplier: "trx", travel: "2026-09-30", created: "2026-08-31", status: "failed", net: 8_400_00, margin: 14, qty: 1, supplierRef: null, note: "Tedarikçi kontenjanı doğrulayamadı." },
];

let seq = 0;
const uid = (p: string) => `${p}-${(++seq).toString(36).padStart(4, "0")}`;

function makeBooking(seed: Seed): Booking {
  const supplier = s(seed.supplier);
  return {
    id: uid("bk"),
    ref: seed.ref,
    tenantId: AGENCY.tenantId,
    agencyId: AGENCY.id,
    customer: {
      id: uid("cu"),
      agencyId: AGENCY.id,
      fullName: seed.name,
      email: seed.email,
      phone: seed.phone,
      passportNo: null,
    },
    supplier,
    status: seed.status,
    currency: "TRY",
    fxRateLocked: null,
    createdAt: day(seed.created, "09:00"),
    travelDate: day(seed.travel, "06:00"),
    note: seed.note ?? null,
    items: [
      {
        id: uid("bi"),
        variantId: uid("v"),
        productId: "p-balon",
        title: seed.product,
        variantName: seed.variant,
        startsAt: day(seed.travel, "06:00"),
        quantity: seed.qty,
        unitPrice: seed.net,
        marginPct: seed.margin,
        supplierReference: seed.supplierRef,
        status: seed.status,
      },
    ],
  };
}

export const BOOKINGS: Booking[] = SEEDS.map(makeBooking);

export const bookingByRef = (ref: string) =>
  BOOKINGS.find((b) => b.ref === ref) ?? null;

/** Rezervasyon listesi hacmi — sanallaştırma bütçesi bununla ölçülür. */
export function expandedBookings(count = 500): Booking[] {
  const out: Booking[] = [];
  for (let i = 0; i < count; i++) {
    const base = BOOKINGS[i % BOOKINGS.length];
    out.push({
      ...base,
      id: `${base.id}-${i}`,
      ref: `KNT-${24081 - i}`,
      items: base.items.map((it) => ({
        ...it,
        supplierReference: it.supplierReference ? `${it.supplierReference}-${i}` : null,
      })),
    });
  }
  return out;
}

/* ========================================================================== */
/* Finans                                                                     */
/* ========================================================================== */

export const INVOICES: Invoice[] = [
  { id: uid("in"), number: "EKS-2026-08", agencyId: AGENCY.id, periodStart: day("2026-08-01"), periodEnd: day("2026-08-31"), amount: 482_400_00, taxAmount: 86_832_00, status: "paid", dueDate: day("2026-09-30"), eInvoiceRef: "GIB-2026-0000841" },
  { id: uid("in"), number: "EKS-2026-07", agencyId: AGENCY.id, periodStart: day("2026-07-01"), periodEnd: day("2026-07-31"), amount: 610_900_00, taxAmount: 109_962_00, status: "paid", dueDate: day("2026-08-31"), eInvoiceRef: "GIB-2026-0000712" },
  { id: uid("in"), number: "EKS-2026-06", agencyId: AGENCY.id, periodStart: day("2026-06-01"), periodEnd: day("2026-06-30"), amount: 553_200_00, taxAmount: 99_576_00, status: "paid", dueDate: day("2026-07-31"), eInvoiceRef: "GIB-2026-0000598" },
  { id: uid("in"), number: "EKS-2026-05", agencyId: AGENCY.id, periodStart: day("2026-05-01"), periodEnd: day("2026-05-31"), amount: 421_050_00, taxAmount: 75_789_00, status: "overdue", dueDate: day("2026-06-30"), eInvoiceRef: "GIB-2026-0000455" },
  { id: uid("in"), number: "EKS-2026-04", agencyId: AGENCY.id, periodStart: day("2026-04-01"), periodEnd: day("2026-04-30"), amount: 388_700_00, taxAmount: 69_966_00, status: "paid", dueDate: day("2026-05-31"), eInvoiceRef: "GIB-2026-0000331" },
];

export const LEDGER: LedgerEntry[] = (() => {
  const rows: Omit<LedgerEntry, "id" | "runningBalance">[] = [
    { date: day("2026-09-06", "16:20"), account: "120 Alıcılar", description: "KNT-24081 rezervasyon", debit: 2_926_40, credit: 0, referenceType: "booking", referenceId: "KNT-24081" },
    { date: day("2026-09-05", "11:05"), account: "100 Kasa", description: "Havale tahsilatı", debit: 0, credit: 150_000_00, referenceType: "payment", referenceId: "PAY-99812" },
    { date: day("2026-09-04", "09:40"), account: "120 Alıcılar", description: "KNT-24080 rezervasyon", debit: 1_934_40, credit: 0, referenceType: "booking", referenceId: "KNT-24080" },
    { date: day("2026-09-03", "17:12"), account: "120 Alıcılar", description: "KNT-24078 kısmi iptal iadesi", debit: 0, credit: 370_50, referenceType: "booking", referenceId: "KNT-24078" },
    { date: day("2026-09-02", "10:30"), account: "120 Alıcılar", description: "KNT-24077 rezervasyon", debit: 1_008_00, credit: 0, referenceType: "booking", referenceId: "KNT-24077" },
    { date: day("2026-09-01", "14:00"), account: "600 Yurtiçi satışlar", description: "Ağustos komisyon mahsubu", debit: 0, credit: 42_180_00, referenceType: "adjustment", referenceId: "ADJ-2026-08" },
    { date: day("2026-08-31", "23:59"), account: "120 Alıcılar", description: "EKS-2026-08 ekstre", debit: 482_400_00, credit: 0, referenceType: "invoice", referenceId: "EKS-2026-08" },
    { date: day("2026-08-30", "12:15"), account: "100 Kasa", description: "Kart ile ödeme", debit: 0, credit: 320_000_00, referenceType: "payment", referenceId: "PAY-99640" },
  ];
  let balance = AGENCY.creditLimit;
  return rows.map((r) => {
    balance = balance - r.debit + r.credit;
    return { ...r, id: uid("le"), runningBalance: Math.max(0, Math.min(AGENCY.creditLimit, balance)) };
  });
})();

export const PAYMENTS: Payment[] = [
  { id: uid("pm"), bookingRef: "KNT-24081", amount: 2_926_40, method: "agency_credit", status: "succeeded", gatewayReference: null, createdAt: day("2026-09-04", "09:12") },
  { id: uid("pm"), bookingRef: "KNT-24073", amount: 5_520_00, method: "card", status: "succeeded", gatewayReference: "pi_3QxK…c7Zq", createdAt: day("2026-08-28", "14:33") },
  { id: uid("pm"), bookingRef: "KNT-24070", amount: 9_576_00, method: "card", status: "failed", gatewayReference: "pi_3QxL…m1Ra", createdAt: day("2026-08-31", "10:04") },
  { id: uid("pm"), bookingRef: "KNT-24075", amount: 781_20, method: "agency_credit", status: "refunded", gatewayReference: null, createdAt: day("2026-08-30", "18:29") },
];

/* ========================================================================== */
/* Dashboard ve duyurular                                                     */
/* ========================================================================== */

export const ANNOUNCEMENTS = [
  {
    id: "an-1",
    date: day("2026-09-06"),
    title: "TravelX Bedbank yanıt süreleri yükseldi",
    body: "Tedarikçi kaynaklı yavaşlama sürüyor. Arama sonuçlarında bu kaynak zaman aşımına uğrayabilir; diğer tedarikçiler etkilenmiyor.",
    tone: "warning" as const,
  },
  {
    id: "an-2",
    date: day("2026-09-01"),
    title: "Ekim dönemi komisyon oranları güncellendi",
    body: "Kapadokya DMC ürünlerinde varsayılan marj %22'ye çıkarıldı. Mevcut rezervasyonlar etkilenmiyor.",
    tone: "info" as const,
  },
];

export const RECENT_SEARCHES = [
  { destination: "Kapadokya", date: day("2026-09-18"), adults: 2, children: 0, type: "tour" as const },
  { destination: "Antalya", date: day("2026-09-22"), adults: 4, children: 2, type: "hotel" as const },
  { destination: "İstanbul", date: day("2026-09-11"), adults: 2, children: 1, type: "tour" as const },
];

/** Acente ana sayfası özeti. */
export const AGENCY_STATS = {
  pendingBookings: BOOKINGS.filter((b) => b.status === "pending").length,
  confirmedThisMonth: 38,
  // Aylık toplam; örnek rezervasyon listesi bir ayın tamamını temsil etmiyor.
  grossSalesThisMonth: 428_600_00,
  marginThisMonth: 84_260_00,
  departuresNext7Days: 9,
};

/** Süper Admin platform özeti. */
export const PLATFORM_STATS = {
  activeTenants: TENANTS.filter((t) => t.status === "active").length,
  trialTenants: TENANTS.filter((t) => t.status === "trial").length,
  mrr: TENANTS.reduce((s, t) => s + t.mrr, 0),
  gmvLast30d: TENANTS.reduce((s, t) => s + t.gmvLast30d, 0),
  bookingsLast30d: TENANTS.reduce((s, t) => s + t.bookingsLast30d, 0),
  degradedSuppliers: SUPPLIERS.filter((x) => x.status === "degraded").length,
};

export const FX_SOURCES = [
  { id: "tcmb", name: "TCMB (Türkiye Cumhuriyet Merkez Bankası)", updatedAt: day(TODAY, "15:30"), selected: true },
  { id: "ecb", name: "ECB (Avrupa Merkez Bankası)", updatedAt: day(TODAY, "14:00"), selected: false },
  { id: "manual", name: "Elle girilen kur tablosu", updatedAt: day("2026-09-01", "09:00"), selected: false },
];

export const CURRENCIES = [
  { code: "TRY", name: "Türk lirası", rate: 1, isBase: true },
  { code: "EUR", name: "Euro", rate: 47.82, isBase: false },
  { code: "USD", name: "ABD doları", rate: 43.15, isBase: false },
  { code: "GBP", name: "İngiliz sterlini", rate: 55.60, isBase: false },
];
