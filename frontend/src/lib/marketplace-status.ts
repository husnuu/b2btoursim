import type { MessageKey } from "./i18n";
import type { StatusTone } from "./booking-status";
import type { ContractStatus } from "./marketplace";

/**
 * Kontrat durum makinesi — Spesifikasyon Bölüm 5.1.
 *
 * `booking-status.ts` ile aynı sözleşme: her durumun renkten bağımsız bir
 * işareti var, geri alınamaz geçişler onay ister, nihai durumdan çıkış yok.
 *
 * "sonlandirildi" nihai değil: taraflar yeniden anlaşabilir, ama bu **yeni
 * bir kontrat** olur — eskisi arşivde denetim izi olarak kalır.
 */

export const CONTRACT_STATUSES = [
  "beklemede",
  "onaylandi",
  "reddedildi",
  "sonlandirildi",
] as const;

type StatusMeta = {
  label: MessageKey;
  tone: StatusTone;
  glyph: string;
  next: ContractStatus[];
  reversible: boolean;
  terminal?: boolean;
};

export const CONTRACT_STATUS_META: Record<ContractStatus, StatusMeta> = {
  beklemede: {
    label: "mp.contract.pending",
    tone: "info",
    glyph: "◐",
    next: ["onaylandi", "reddedildi"],
    // Satıcı kendi talebini geri çekebilir; karar tedarikçiye gitmeden önce.
    reversible: true,
  },
  onaylandi: {
    label: "mp.contract.approved",
    tone: "success",
    glyph: "✓",
    next: ["sonlandirildi"],
    reversible: false,
  },
  reddedildi: {
    label: "mp.contract.rejected",
    tone: "danger",
    glyph: "✕",
    next: [],
    reversible: false,
    terminal: true,
  },
  sonlandirildi: {
    label: "mp.contract.terminated",
    tone: "neutral",
    glyph: "◼",
    next: [],
    reversible: false,
    terminal: true,
  },
};

export function canTransitionContract(
  from: ContractStatus,
  to: ContractStatus,
): boolean {
  return CONTRACT_STATUS_META[from].next.includes(to);
}

/** Onay ve sonlandırma karşı tarafı etkiler; geri alınamaz. */
export function contractNeedsConfirmation(to: ContractStatus): boolean {
  return !CONTRACT_STATUS_META[to].reversible;
}

export function isContractTerminal(s: ContractStatus): boolean {
  return CONTRACT_STATUS_META[s].terminal === true;
}

/** Satıcı bu kontrat üzerinden satış yapabilir mi? */
export function canSellUnder(s: ContractStatus): boolean {
  return s === "onaylandi";
}
