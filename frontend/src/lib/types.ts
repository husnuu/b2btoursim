import type { BookingStatus } from "./booking-status";

/**
 * Alan sözlüğü — Teknik Tasarım Dokümanı Bölüm 2.2.
 *
 * Adlandırma TDD ile birebir; API camelCase'e çevrildiğinde bu tipler
 * doğrudan yanıt gövdesine oturur. Para her yerde minor unit (kuruş),
 * tarih her yerde UTC ISO 8601 (TDD Bölüm 6).
 */

export type Money = number;
export type Uuid = string;
/** UTC ISO 8601. Görüntüleme anında kullanıcı saat dilimine çevrilir. */
export type Iso = string;

/* --- Kullanıcı & Kiracı --------------------------------------------------- */

export type TenantPlan = "starter" | "growth" | "enterprise";
export type TenantStatus = "trial" | "active" | "suspended" | "closed";

export type Tenant = {
  id: Uuid;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  defaultCurrency: string;
  createdAt: Iso;
  /** Panelde gösterilen türetilmiş sayılar (API'de ayrı uçtan gelir). */
  agencyCount: number;
  bookingsLast30d: number;
  gmvLast30d: Money;
  mrr: Money;
};

export type UserRole =
  | "platform_admin"
  | "agency_admin"
  | "sales"
  | "accounting";

export type UserStatus = "active" | "invited" | "disabled";

export type User = {
  id: Uuid;
  tenantId: Uuid;
  agencyId: Uuid | null;
  role: UserRole;
  email: string;
  fullName: string;
  status: UserStatus;
  lastSeenAt: Iso | null;
};

export type AgencyType = "master" | "sub_agency";

export type Agency = {
  id: Uuid;
  tenantId: Uuid;
  parentAgencyId: Uuid | null;
  name: string;
  type: AgencyType;
  creditLimit: Money;
  /** Kullanılabilir bakiye — limitten borç düşüldükten sonra kalan. */
  balance: Money;
  currency: string;
  /** Ödeme vadesi: net 30 / net 60 (Strateji Dok. 1.5). */
  paymentTermDays: number;
};

/* --- Katalog & Tedarikçi -------------------------------------------------- */

export type AdapterType =
  | "gds"
  | "ndc"
  | "bedbank"
  | "own_contracted"
  | "payment"
  | "tax";

export type SupplierStatus = "sandbox" | "active" | "degraded" | "disabled";

export type Supplier = {
  id: string;
  name: string;
  /** Dar kolonlarda ad yerine görünen iki harflik kod. */
  code: string;
  adapterType: AdapterType;
  status: SupplierStatus;
  /** Secrets manager referansı — anahtarın kendisi asla taşınmaz. */
  credentialsRef: string;
  /** Süper Admin sağlık paneli için son 24 saat. */
  uptimePct: number;
  avgLatencyMs: number;
  errorRatePct: number;
};

export type ProductType = "hotel" | "tour" | "transfer" | "flight" | "package";

export type CancellationPolicy =
  | { type: "free"; hoursBefore: number }
  | { type: "nonRefundable" };

export type ProductVariant = {
  id: Uuid;
  name: string;
  startsAt: Iso;
  basePrice: Money;
  currency: string;
  cancellation: CancellationPolicy;
  /** INVENTORY.quantity_available */
  quantityAvailable: number;
  stopSale?: boolean;
};

export type Product = {
  id: string;
  type: ProductType;
  title: string;
  summary: string;
  supplier: Supplier;
  destination: string;
  durationMinutes: number;
  languages: string[];
  cancellation: CancellationPolicy;
  meetingPoint: string;
  includes: string[];
  excludes: string[];
  supplierRef: string;
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  imageTone: string;
  /** Otel ürünlerinde yıldız; diğerlerinde yok. */
  stars?: number;
  address?: string;
};

/* --- Arama ---------------------------------------------------------------- */

export type SupplierResponseState = "pending" | "responded" | "failed";

export type SupplierProgress = {
  supplier: Supplier;
  state: SupplierResponseState;
  resultCount: number;
  latencyMs?: number;
};

export type SearchResult = {
  id: string;
  productId: string;
  type: ProductType;
  title: string;
  supplier: Supplier;
  startsAt: Iso;
  durationMinutes: number;
  languages: string[];
  cancellation: CancellationPolicy;
  net: Money;
  defaultMarginPct: number;
  rating?: number;
  reviewCount?: number;
  remaining?: number;
  instantConfirm: boolean;
  imageTone: string;
  /* Otel aramasına özgü alanlar */
  stars?: number;
  board?: "room_only" | "breakfast" | "half_board" | "all_inclusive";
  roomType?: string;
  district?: string;
};

/* --- Rezervasyon ---------------------------------------------------------- */

export type Customer = {
  id: Uuid;
  agencyId: Uuid;
  fullName: string;
  email: string | null;
  phone: string | null;
  /** Alan bazlı şifreleme uygulanır; arayüzde maskeli gösterilir. */
  passportNo: string | null;
};

export type BookingItem = {
  id: Uuid;
  variantId: Uuid;
  productId: string;
  title: string;
  variantName: string;
  startsAt: Iso;
  quantity: number;
  unitPrice: Money;
  marginPct: number;
  supplierReference: string | null;
  status: BookingStatus;
};

export type Booking = {
  id: Uuid;
  ref: string;
  tenantId: Uuid;
  agencyId: Uuid;
  customer: Customer;
  supplier: Supplier;
  status: BookingStatus;
  currency: string;
  /** Kur kilitleme anındaki oran (Strateji Dok. 3.2). */
  fxRateLocked: number | null;
  createdAt: Iso;
  travelDate: Iso;
  items: BookingItem[];
  note: string | null;
};

/* --- Finans --------------------------------------------------------------- */

export type PaymentMethod = "card" | "bank_transfer" | "vcc" | "agency_credit";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export type Payment = {
  id: Uuid;
  bookingRef: string;
  amount: Money;
  method: PaymentMethod;
  status: PaymentStatus;
  /** Sağlayıcı token'ı; kart verisi hiçbir zaman saklanmaz. */
  gatewayReference: string | null;
  createdAt: Iso;
};

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type Invoice = {
  id: Uuid;
  number: string;
  agencyId: Uuid;
  periodStart: Iso;
  periodEnd: Iso;
  amount: Money;
  taxAmount: Money;
  status: InvoiceStatus;
  dueDate: Iso;
  eInvoiceRef: string | null;
};

/** Çift kayıt muhasebe — Strateji Dok. 1.5. */
export type LedgerEntry = {
  id: Uuid;
  date: Iso;
  account: string;
  description: string;
  debit: Money;
  credit: Money;
  referenceType: "booking" | "payment" | "invoice" | "adjustment";
  referenceId: string;
  /** İşlem sonrası yürüyen bakiye. */
  runningBalance: Money;
};

export type CommissionRule = {
  id: Uuid;
  agencyId: Uuid;
  ruleType: "percentage" | "fixed" | "tiered";
  value: number;
  validFrom: Iso;
  validTo: Iso | null;
};

/* --- Sepet ---------------------------------------------------------------- */

export type CartLine = {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  supplier: Supplier;
  optionName: string;
  startsAt: Iso;
  pax: { adults: number; children: number };
  net: Money;
  marginPct: number;
};

/* --- Fiyat: tek kaynak ---------------------------------------------------- */

/** Satış fiyatı tek yerde hesaplanır; hiçbir bileşen kendi formülünü yazmaz. */
export function salePrice(net: Money, marginPct: number): Money {
  return Math.round(net * (1 + marginPct / 100));
}

export function marginAmount(net: Money, marginPct: number): Money {
  return salePrice(net, marginPct) - net;
}

export function bookingTotals(booking: Booking) {
  const net = booking.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const sale = booking.items.reduce(
    (s, i) => s + salePrice(i.unitPrice, i.marginPct) * i.quantity,
    0,
  );
  return { net, sale, margin: sale - net };
}

/* --- Liste görünümleri için türetilmiş alanlar ---------------------------- */

/** Rezervasyon listesinde gösterilen ana kalem. */
export function primaryItem(b: Booking): BookingItem {
  return b.items[0];
}

/** Toplam katılımcı/oda adedi. */
export function bookingQuantity(b: Booking): number {
  return b.items.reduce((s, i) => s + i.quantity, 0);
}

/** Tedarikçi rezervasyon numarası; henüz gelmediyse null. */
export function supplierReference(b: Booking): string | null {
  return b.items.find((i) => i.supplierReference)?.supplierReference ?? null;
}
