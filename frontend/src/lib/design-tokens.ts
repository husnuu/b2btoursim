/**
 * Token sözleşmesi — globals.css'teki değerlerin makine tarafından okunabilir
 * kopyası ve her birinin hangi zeminde hangi kontrast eşiğini tutması gerektiği.
 *
 * Neden var: "WCAG AA" iddiası bir yorum satırıyla korunamaz. Bu dosya
 * `npm run test` ile doğrulanır; bir token değişip eşiğin altına düşerse
 * derleme değil test kırılır ve neden kırıldığı okunur.
 *
 * globals.css ile bu dosya elle senkron tutulur; `npm run test:tokens`
 * ikisinin ayrıştığını da yakalar.
 */

export const SURFACES = {
  beyaz: "#ffffff",
  kâğıt: "#f0f2ef",
  çukur: "#e4e8e3",
  ters: "#16242b",
} as const;

export type ContrastRule = {
  token: string;
  value: string;
  /** Bu rengin üstünde göründüğü zeminler. */
  on: string[];
  /** WCAG eşiği: normal metin 4.5, büyük metin 3.0, arayüz sınırı 3.0. */
  min: number;
  note?: string;
};

/** Metin rolleri — her biri açık zeminlerin üçünde de okunmak zorunda. */
const LIGHT_SURFACES = [SURFACES.beyaz, SURFACES.kâğıt, SURFACES.çukur];

export const CONTRAST_RULES: ContrastRule[] = [
  { token: "--text-primary", value: "#16242b", on: LIGHT_SURFACES, min: 4.5 },
  { token: "--text-secondary", value: "#4b5c63", on: LIGHT_SURFACES, min: 4.5 },
  { token: "--text-muted", value: "#5b686d", on: LIGHT_SURFACES, min: 4.5 },
  { token: "--text-inverse", value: "#f0f2ef", on: [SURFACES.ters], min: 4.5 },
  { token: "--text-inverse-secondary", value: "#9aa5a9", on: [SURFACES.ters], min: 4.5 },
  { token: "--text-inverse-muted", value: "#8f9b9f", on: [SURFACES.ters], min: 4.5 },

  { token: "--state-success", value: "#1b6b4a", on: [...LIGHT_SURFACES, "#e2efe8"], min: 4.5 },
  { token: "--state-warning", value: "#85570d", on: [...LIGHT_SURFACES, "#f6eeda"], min: 4.5 },
  { token: "--state-danger", value: "#a83232", on: [...LIGHT_SURFACES, "#f7e6e4"], min: 4.5 },
  { token: "--state-info", value: "#26697c", on: [...LIGHT_SURFACES, "#e2eff2"], min: 4.5 },
  { token: "--state-neutral", value: "#5b6a70", on: [...LIGHT_SURFACES, "#e8ebe8"], min: 4.5 },
  { token: "--margin-field", value: "#135c3f", on: LIGHT_SURFACES, min: 4.5 },
  {
    token: "--margin-field-on-inverse",
    value: "#57b184",
    on: [SURFACES.ters, "#1f333d"],
    min: 4.5,
  },

  // Koyu kapanış bandı ve voucher başlığı.
  { token: "--text-inverse", value: "#f0f2ef", on: ["#1f333d"], min: 4.5 },
  { token: "--text-inverse-secondary", value: "#9aa5a9", on: ["#1f333d"], min: 4.5 },
  {
    token: "--state-warning-on-inverse",
    value: "#e0a94a",
    on: [SURFACES.ters],
    min: 4.5,
  },

  // Arayüz sınırı: girdi, buton ve panel çerçevesi (WCAG 1.4.11).
  {
    token: "--border-strong",
    value: "#7b877c",
    on: LIGHT_SURFACES,
    min: 3.0,
    note: "Girdi ve buton sınırı",
  },
];

/**
 * Kasten eşik dışında bırakılanlar. Gerekçesiz muafiyet olmasın diye
 * burada adı ve nedeni yazılı.
 */
export const EXEMPT: { token: string; value: string; reason: string }[] = [
  {
    token: "--border-default",
    value: "#d2d8d1",
    reason:
      "Tablo satır ayracı ve bölüm çizgisi. Bilgi ya da durum taşımaz, " +
      "kaldırıldığında hiçbir anlam kaybolmaz — WCAG 1.4.11 kapsamı dışında.",
  },
  {
    token: "--surface-sunken",
    value: "#e4e8e3",
    reason: "Zemin rengi; üstündeki metin kendi kuralıyla doğrulanır.",
  },
  {
    token: "--surface-inverse-raised",
    value: "#1f333d",
    reason:
      "Koyu bölümde yükseltilmiş panel zemini. Ana koyu zeminden yalnızca " +
      "1.21:1 ayrışır; ayrımı taşıyan şey renk değil kenarlık, o yüzden eşik aranmaz.",
  },
];

/**
 * Ham renk değeri kullanmasına izin verilen tek dosya.
 *
 * global-error.tsx kök layout çöktüğünde devreye girer: o anda globals.css
 * yüklenmemiş olabilir, bu yüzden token katmanına güvenemez. Kullandığı
 * değerler token tablosundan birebir kopyalanır ve token testi bu dosyayı
 * ayrıca doğrular.
 */
export const RAW_COLOR_ALLOWLIST: { file: string; reason: string }[] = [
  {
    file: "src/app/global-error.tsx",
    reason:
      "Kök hata sınırı; layout ve stil sayfası yüklenmemiş olabilir, bu yüzden " +
      "satır içi renk kullanmak zorunda. Değerleri token tablosuyla aynı olmalı.",
  },
];

/* --- Kontrast hesabı (WCAG 2.1 göreli parlaklık) ------------------------- */

function channel(v: number): number {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number {
  const h = hex.replace("#", "");
  return (
    0.2126 * channel(parseInt(h.slice(0, 2), 16) / 255) +
    0.7152 * channel(parseInt(h.slice(2, 4), 16) / 255) +
    0.0722 * channel(parseInt(h.slice(4, 6), 16) / 255)
  );
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
