import type { MessageKey } from "./i18n";
import type { StatusTone } from "./booking-status";

/**
 * Tur yayın durumu — Spesifikasyon Bölüm 8.
 *
 * OTOMATIK_PASIF bilinçli olarak eklenmedi: onu tetikleyecek İleri
 * Tarih/Envanter Bakım Ajanı, bu prototipte olmayan bir müsaitlik takvimi
 * modülüne bağımlı (bkz. plan dokümanındaki Varsayım 4) — hiç
 * tetiklenemeyecek bir durum eklemek yarım iş olurdu.
 *
 * ARŞİVLENDİ terminal ve **geri alınamaz**: liste ekranında "Kalıcı kaldır"
 * aksiyonu `ConfirmDialog` ile onay ister (bkz. `booking-status.ts`'teki
 * `needsConfirmation` ilkesi).
 */

export const TOUR_STATUSES = ["taslak", "aktif", "pasif", "arsivlendi"] as const;

export type TourStatus = (typeof TOUR_STATUSES)[number];

type StatusMeta = {
  label: MessageKey;
  tone: StatusTone;
  glyph: string;
  next: TourStatus[];
  reversible: boolean;
  terminal?: boolean;
};

export const TOUR_STATUS_META: Record<TourStatus, StatusMeta> = {
  taslak: {
    label: "tourStatus.taslak",
    tone: "neutral",
    glyph: "◇",
    next: ["aktif", "arsivlendi"],
    reversible: true,
  },
  aktif: {
    label: "tourStatus.aktif",
    tone: "success",
    glyph: "✓",
    next: ["pasif", "arsivlendi"],
    reversible: true,
  },
  pasif: {
    label: "tourStatus.pasif",
    tone: "warning",
    glyph: "◑",
    next: ["aktif", "taslak", "arsivlendi"],
    reversible: true,
  },
  arsivlendi: {
    label: "tourStatus.arsivlendi",
    tone: "neutral",
    glyph: "◼",
    next: [],
    reversible: false,
    terminal: true,
  },
};

export function canTransition(from: TourStatus, to: TourStatus): boolean {
  return TOUR_STATUS_META[from].next.includes(to);
}

export function isTerminal(status: TourStatus): boolean {
  return TOUR_STATUS_META[status].terminal === true;
}
