/**
 * Takvim matematiği (VITRIN.md §4.7). Saat dilimi kayması olmasın diye
 * bütün hesaplar UTC üzerinden; biçimlendirme burada değil, `lib/i18n`de.
 * Tarih her yerde "YYYY-MM-DD".
 */
export type Ymd = { y: number; m: number; d: number };

export const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;
export const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
] as const;
const WEEKDAY_LONG = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"] as const;

export function parseDate(iso: string): Ymd | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) return null;
  return { y, m: mo, d };
}

export function toISO({ y, m, d }: Ymd): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** 1970'ten bu yana gün sayısı; iki tarih arası fark için. */
export function dayNumber(iso: string): number {
  const p = parseDate(iso);
  if (!p) return NaN;
  return Math.round(Date.UTC(p.y, p.m - 1, p.d) / 86_400_000);
}

export function addDays(iso: string, n: number): string {
  const p = parseDate(iso);
  if (!p) return iso;
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
  return toISO({ y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() });
}

export function nightsBetween(from: string, to: string): number {
  const a = dayNumber(from), b = dayNumber(to);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, b - a);
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Ayın ilk gününün pazartesi başlangıçlı haftadaki yeri (0 = Pzt). */
export function firstWeekdayOffset(y: number, m: number): number {
  return (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
}

export function monthTitle(y: number, m: number): string {
  return `${MONTHS[m - 1]} ${y}`;
}

/** "4 Ekim 2026 Cumartesi" — takvim düğmesinin aria-label'ı. */
export function dateLong(iso: string): string {
  const p = parseDate(iso);
  if (!p) return iso;
  const wd = WEEKDAY_LONG[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()];
  return `${p.d} ${MONTHS[p.m - 1]} ${p.y} ${wd}`;
}

/** "4 Eki 2026" — alanın içindeki kısa gösterim. */
export function dateShort(iso: string): string {
  const p = parseDate(iso);
  if (!p) return "";
  return `${p.d} ${MONTHS[p.m - 1].slice(0, 3)} ${p.y}`;
}

/** İstemcide bugünün İstanbul günü. Sunucuda çağrılmaz (hidrasyon). */
export function todayIstanbul(): string {
  const t = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return toISO({ y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() });
}

/** 30 dakikalık saat listesi: "06:00" … "23:30". */
export function timeSlots(from = 6, to = 23): string[] {
  const out: string[] = [];
  for (let h = from; h <= to; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
}
