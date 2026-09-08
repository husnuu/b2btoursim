import type { MessageKey } from "./i18n";
import type { StatusTone } from "./booking-status";

/**
 * Tekne yayın durumu — `tour-status.ts` ile birebir aynı desen (Bölüm 1.1
 * "Durum Aktif/Pasif — hızlı değiştirme dropdown'ı" + "İşlemler: ... Arşivle").
 */

export const BOAT_STATUSES = ["taslak", "aktif", "pasif", "arsivlendi"] as const;

export type BoatStatus = (typeof BOAT_STATUSES)[number];

type StatusMeta = {
  label: MessageKey;
  tone: StatusTone;
  glyph: string;
  next: BoatStatus[];
  reversible: boolean;
  terminal?: boolean;
};

export const BOAT_STATUS_META: Record<BoatStatus, StatusMeta> = {
  taslak: { label: "boatStatus.taslak", tone: "neutral", glyph: "◇", next: ["aktif", "arsivlendi"], reversible: true },
  aktif: { label: "boatStatus.aktif", tone: "success", glyph: "✓", next: ["pasif", "arsivlendi"], reversible: true },
  pasif: {
    label: "boatStatus.pasif",
    tone: "warning",
    glyph: "◑",
    next: ["aktif", "taslak", "arsivlendi"],
    reversible: true,
  },
  arsivlendi: {
    label: "boatStatus.arsivlendi",
    tone: "neutral",
    glyph: "◼",
    next: [],
    reversible: false,
    terminal: true,
  },
};

export function canTransition(from: BoatStatus, to: BoatStatus): boolean {
  return BOAT_STATUS_META[from].next.includes(to);
}
