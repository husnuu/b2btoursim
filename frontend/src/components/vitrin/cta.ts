/**
 * Vitrinin rezervasyon düğmeleri tek yerden: tur kutusu, talep formu, sepet,
 * ödeme ve mobil alt çubuk aynı görünür. Birincil koyu dolgu, ikincil koyu
 * çerçeve; 52px yükseklik (mobilde başparmak hedefi), görünür odak halkası.
 */
const base =
  "inline-flex h-13 items-center justify-center gap-2 rounded-xl px-6 text-base font-semibold whitespace-nowrap select-none " +
  "transition-[background-color,border-color,transform] duration-150 active:scale-[.98] " +
  "outline-none focus-visible:ring-4 focus-visible:ring-ink/20 " +
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100";

export const ctaPrimary = `${base} bg-ink text-white hover:bg-ink-2`;
export const ctaSecondary = `${base} border-[1.5px] border-ink bg-white text-ink hover:bg-mist`;
