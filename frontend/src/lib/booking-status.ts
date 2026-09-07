import type { MessageKey } from "./i18n";

/**
 * Rezervasyon durum makinesi — Teknik Tasarım Dokümanı Bölüm 3.
 *
 * Bu dosya daha önce tahmine dayalı bir öneriydi (teklif/opsiyon gibi durumlar
 * içeriyordu). TDD yayımlandıktan sonra BOOKING.status'ün resmi tanımına
 * hizalandı: DRAFT / PENDING / CONFIRMED / FAILED / CANCELLED /
 * PARTIALLY_CANCELLED / REFUNDED / COMPLETED.
 *
 * `apiValue` API'nin beklediği UPPER_SNAKE karşılığıdır; arayüz camelCase
 * kullanır, sözleşme tek yerde çevrilir.
 */

export const BOOKING_STATUSES = [
  "draft",
  "pending",
  "confirmed",
  "partiallyCancelled",
  "cancelled",
  "refunded",
  "failed",
  "completed",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type StatusTone = "info" | "warning" | "neutral" | "success" | "danger";

type StatusMeta = {
  label: MessageKey;
  /** TDD'deki enum değeri — API sözleşmesi bunu bekler. */
  apiValue: string;
  tone: StatusTone;
  /** Renk körlüğü için renge ek işaret. */
  glyph: string;
  next: BookingStatus[];
  /** Kullanıcı bu geçişi geri alabilir mi? */
  reversible: boolean;
  /** Nihai durum: buradan çıkış yok. */
  terminal?: boolean;
};

export const STATUS_META: Record<BookingStatus, StatusMeta> = {
  draft: {
    label: "status.draft",
    apiValue: "DRAFT",
    tone: "neutral",
    glyph: "◇",
    // Sepete eklendi, checkout tamamlanmadı — kontenjan henüz tutulmadı.
    next: ["pending", "cancelled"],
    reversible: true,
  },
  pending: {
    label: "status.pending",
    apiValue: "PENDING",
    tone: "info",
    glyph: "◐",
    // Tedarikçi onayı ve ödeme sonucu bekleniyor.
    next: ["confirmed", "failed", "cancelled"],
    reversible: false,
  },
  confirmed: {
    label: "status.confirmed",
    apiValue: "CONFIRMED",
    tone: "success",
    glyph: "✓",
    next: ["partiallyCancelled", "cancelled", "completed"],
    reversible: false,
  },
  partiallyCancelled: {
    label: "status.partiallyCancelled",
    apiValue: "PARTIALLY_CANCELLED",
    tone: "warning",
    glyph: "◑",
    next: ["cancelled", "refunded", "completed"],
    reversible: false,
  },
  cancelled: {
    label: "status.cancelled",
    apiValue: "CANCELLED",
    tone: "danger",
    glyph: "✕",
    next: ["refunded"],
    reversible: false,
  },
  refunded: {
    label: "status.refunded",
    apiValue: "REFUNDED",
    tone: "neutral",
    glyph: "↺",
    next: [],
    reversible: false,
    terminal: true,
  },
  failed: {
    label: "status.failed",
    apiValue: "FAILED",
    tone: "danger",
    glyph: "!",
    // Ödeme ya da tedarikçi reddi — kontenjan serbest bırakılır.
    next: [],
    reversible: false,
    terminal: true,
  },
  completed: {
    label: "status.completed",
    apiValue: "COMPLETED",
    tone: "neutral",
    glyph: "◼",
    // Seyahat tarihi geçti; raporlama ve arşivleme için nihai durum.
    next: [],
    reversible: false,
    terminal: true,
  },
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return STATUS_META[from].next.includes(to);
}

/**
 * Bölüm 3.3 (UX): onay diyaloğu yerine geri alma. Geri alınamayan geçişlerde
 * (tedarikçiye giden iptal gibi) arayüz onay ister.
 */
export function needsConfirmation(to: BookingStatus): boolean {
  return !STATUS_META[to].reversible;
}

/** Acentenin bu rezervasyon üzerinde hâlâ yapabileceği işlem var mı? */
export function isTerminal(status: BookingStatus): boolean {
  return STATUS_META[status].terminal === true;
}

export function fromApi(value: string): BookingStatus {
  const found = BOOKING_STATUSES.find(
    (s) => STATUS_META[s].apiValue === value.toUpperCase(),
  );
  if (!found) throw new Error(`Bilinmeyen rezervasyon durumu: ${value}`);
  return found;
}
