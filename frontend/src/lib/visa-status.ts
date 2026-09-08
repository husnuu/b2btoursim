import type { MessageKey } from "./i18n";
import type { StatusTone } from "./booking-status";

/** Vize ürünü yayın durumu — `villa-status.ts`/`boat-status.ts` ile birebir aynı desen. */

export const VISA_STATUSES = ["taslak", "aktif", "pasif", "arsivlendi"] as const;

export type VisaStatus = (typeof VISA_STATUSES)[number];

type StatusMeta = {
  label: MessageKey;
  tone: StatusTone;
  glyph: string;
  next: VisaStatus[];
  reversible: boolean;
  terminal?: boolean;
};

export const VISA_STATUS_META: Record<VisaStatus, StatusMeta> = {
  taslak: { label: "visaStatus.taslak", tone: "neutral", glyph: "◇", next: ["aktif", "arsivlendi"], reversible: true },
  aktif: { label: "visaStatus.aktif", tone: "success", glyph: "✓", next: ["pasif", "arsivlendi"], reversible: true },
  pasif: {
    label: "visaStatus.pasif",
    tone: "warning",
    glyph: "◑",
    next: ["aktif", "taslak", "arsivlendi"],
    reversible: true,
  },
  arsivlendi: {
    label: "visaStatus.arsivlendi",
    tone: "neutral",
    glyph: "◼",
    next: [],
    reversible: false,
    terminal: true,
  },
};

export function canTransition(from: VisaStatus, to: VisaStatus): boolean {
  return VISA_STATUS_META[from].next.includes(to);
}
