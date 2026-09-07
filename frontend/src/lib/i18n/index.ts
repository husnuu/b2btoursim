import {
  dictionaries,
  defaultLocale,
  type Locale,
  type MessageKey,
} from "./messages";

export type { Locale, MessageKey };
export { defaultLocale };

export type Translator = (
  key: MessageKey,
  vars?: Record<string, string | number>,
) => string;

/**
 * Basit ikame: {name} → vars.name.
 * Faz 2'de çoğul ve cinsiyet kuralları için ICU MessageFormat'a geçilir;
 * anahtar sözleşmesi değişmez.
 */
export function createTranslator(locale: Locale = defaultLocale): Translator {
  const dict = dictionaries[locale] ?? dictionaries[defaultLocale];
  return (key, vars) => {
    const raw: string = dict[key] ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (m, name: string) =>
      name in vars ? String(vars[name]) : m,
    );
  };
}

export const t = createTranslator(defaultLocale);

/* --- Biçimlendirme -------------------------------------------------------
 * Sunucuda her zaman UTC saklanır (ISO string). Görüntüleme anında
 * kullanıcının saat dilimine çevrilir. Bileşenler ham Date basmaz.
 * ------------------------------------------------------------------------ */

export const DEFAULT_TIMEZONE = "Europe/Istanbul";

export function formatMoney(
  minor: number,
  currency = "TRY",
  locale: string = "tr-TR",
  opts: { decimals?: boolean } = {},
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: opts.decimals ? 2 : 0,
    maximumFractionDigits: opts.decimals ? 2 : 0,
  }).format(minor / 100);
}

export function formatNumber(value: number, locale = "tr-TR"): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(value: number, locale = "tr-TR"): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatDate(
  utcIso: string,
  locale = "tr-TR",
  timeZone = DEFAULT_TIMEZONE,
): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(utcIso));
}

export function formatShortDate(
  utcIso: string,
  locale = "tr-TR",
  timeZone = DEFAULT_TIMEZONE,
): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    timeZone,
  }).format(new Date(utcIso));
}

export function formatTime(
  utcIso: string,
  locale = "tr-TR",
  timeZone = DEFAULT_TIMEZONE,
): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
    hour12: false,
  }).format(new Date(utcIso));
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} sa ${m} dk`;
  if (h) return `${h} sa`;
  return `${m} dk`;
}
