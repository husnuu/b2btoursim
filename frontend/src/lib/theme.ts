/**
 * Tema motoru.
 *
 * Bölüm 6.1: tenant'a serbest hex verilmez. Önceden kontrast testinden geçmiş
 * kısıtlı bir marka paleti verilir; sistem seçilen renkten türev tonları
 * OKLCH uzayında hesaplar ve WCAG AA kontrastını zorunlu kılar.
 *
 * Tenant'ın erişilebilirliği bozabileceği bir yol yok: deriveActionTokens
 * kontrast eşiğini tutturana kadar açıklığı düşürür.
 */

export type Rgb = { r: number; g: number; b: number };
export type Oklch = { l: number; c: number; h: number };

/* --- sRGB <-> OKLab ------------------------------------------------------ */

function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "").trim();
  const v =
    h.length === 3
      ? h
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : h;
  return {
    r: parseInt(v.slice(0, 2), 16) / 255,
    g: parseInt(v.slice(2, 4), 16) / 255,
    b: parseInt(v.slice(4, 6), 16) / 255,
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const to = (x: number) =>
    Math.round(Math.min(1, Math.max(0, x)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

const toLinear = (x: number) =>
  x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
const toGamma = (x: number) =>
  x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;

function rgbToOklch(rgb: Rgb): Oklch {
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const hue = (Math.atan2(B, A) * 180) / Math.PI;
  return {
    l: L,
    c: Math.sqrt(A * A + B * B),
    h: hue < 0 ? hue + 360 : hue,
  };
}

function oklchToRgb({ l: L, c, h }: Oklch): Rgb {
  const rad = (h * Math.PI) / 180;
  const A = c * Math.cos(rad);
  const B = c * Math.sin(rad);

  const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = L - 0.0894841775 * A - 1.291485548 * B;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return {
    r: toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

/* --- Kontrast ------------------------------------------------------------ */

function luminance(rgb: Rgb): number {
  return (
    0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b)
  );
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(hexToRgb(a));
  const lb = luminance(hexToRgb(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/* --- Marka paleti -------------------------------------------------------- */

/**
 * Tenant'ın seçebileceği tek şey bu liste. Her değer beyaz metinle en az
 * 4.5:1 verecek şekilde seçildi; motor yine de doğruluyor.
 */
export const BRAND_PALETTE = [
  { id: "mürekkep", name: "Mürekkep moru", hex: "#4b3b9e" },
  { id: "kobalt", name: "Kobalt", hex: "#2a4b9b" },
  { id: "petrol", name: "Petrol", hex: "#15616d" },
  { id: "zeytin", name: "Zeytin", hex: "#4a5d23" },
  { id: "bordo", name: "Bordo", hex: "#8c2f39" },
  { id: "kiremit", name: "Kiremit", hex: "#a34a1e" },
  { id: "okyanus", name: "Okyanus", hex: "#1c5d99" },
  { id: "orman", name: "Orman", hex: "#1b6b4a" },
  { id: "erik", name: "Erik", hex: "#6d2c6d" },
  { id: "antrasit", name: "Antrasit", hex: "#33424a" },
] as const;

export type BrandId = (typeof BRAND_PALETTE)[number]["id"];

export type ActionTokens = {
  primary: string;
  hover: string;
  active: string;
  tint: string;
  onAction: string;
  /** Zorlanan kontrast oranı — QA ve Storybook için görünür kılınır. */
  contrast: number;
  /** Motor açıklığı düşürmek zorunda kaldıysa true. */
  adjusted: boolean;
};

const AA_NORMAL = 4.5;

/**
 * Seçilen marka renginden eylem tonlarını türetir.
 * Beyaz metinle AA tutmuyorsa açıklık, tutana kadar düşürülür.
 */
export function deriveActionTokens(brandHex: string): ActionTokens {
  const base = rgbToOklch(hexToRgb(brandHex));
  let l = base.l;
  let hex = rgbToHex(oklchToRgb({ ...base, l }));
  let adjusted = false;

  // Beyaz metin üzerinde AA garantisi.
  let guard = 0;
  while (contrastRatio(hex, "#ffffff") < AA_NORMAL && l > 0.15 && guard < 40) {
    l -= 0.015;
    hex = rgbToHex(oklchToRgb({ ...base, l }));
    adjusted = true;
    guard++;
  }

  const onAction =
    contrastRatio(hex, "#ffffff") >= contrastRatio(hex, "#16242b")
      ? "#ffffff"
      : "#16242b";

  return {
    primary: hex,
    hover: rgbToHex(oklchToRgb({ ...base, l: Math.max(0.12, l - 0.06) })),
    active: rgbToHex(oklchToRgb({ ...base, l: Math.max(0.1, l - 0.11) })),
    // Rozet ve seçili satır zemini: aynı hue, çok açık, kroması kısılmış.
    tint: rgbToHex(oklchToRgb({ l: 0.958, c: Math.min(base.c * 0.22, 0.03), h: base.h })),
    onAction,
    contrast: Math.round(contrastRatio(hex, onAction) * 100) / 100,
    adjusted,
  };
}

/** Türetilen tonları CSS custom property sözlüğüne çevirir. */
export function themeVars(brandHex: string): Record<string, string> {
  const t = deriveActionTokens(brandHex);
  return {
    "--action-primary": t.primary,
    "--action-primary-hover": t.hover,
    "--action-primary-active": t.active,
    "--action-primary-tint": t.tint,
    "--text-on-action": t.onAction,
  };
}

/** Sunucuda inline style olarak basılabilecek hazır string. */
export function themeStyleString(brandHex: string): string {
  return Object.entries(themeVars(brandHex))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}
