import type { MessageKey } from "./i18n";
import type { StatusTone } from "./booking-status";

/** Villa yayın durumu — `boat-status.ts`/`tour-status.ts` ile birebir aynı desen. */

export const VILLA_STATUSES = ["taslak", "aktif", "pasif", "arsivlendi"] as const;

export type VillaStatus = (typeof VILLA_STATUSES)[number];

type StatusMeta = {
  label: MessageKey;
  tone: StatusTone;
  glyph: string;
  next: VillaStatus[];
  reversible: boolean;
  terminal?: boolean;
};

export const VILLA_STATUS_META: Record<VillaStatus, StatusMeta> = {
  taslak: { label: "villaStatus.taslak", tone: "neutral", glyph: "◇", next: ["aktif", "arsivlendi"], reversible: true },
  aktif: { label: "villaStatus.aktif", tone: "success", glyph: "✓", next: ["pasif", "arsivlendi"], reversible: true },
  pasif: {
    label: "villaStatus.pasif",
    tone: "warning",
    glyph: "◑",
    next: ["aktif", "taslak", "arsivlendi"],
    reversible: true,
  },
  arsivlendi: {
    label: "villaStatus.arsivlendi",
    tone: "neutral",
    glyph: "◼",
    next: [],
    reversible: false,
    terminal: true,
  },
};

export function canTransition(from: VillaStatus, to: VillaStatus): boolean {
  return VILLA_STATUS_META[from].next.includes(to);
}
