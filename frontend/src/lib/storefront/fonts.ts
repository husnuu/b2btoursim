import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

/**
 * Seyyah yüzeylerinin fontları — vitrin (`StorefrontFrame`) ve tanıtım
 * sayfası (`(site)/layout`). Kök layout'a girmez; extranet bu dosyaları
 * indirmez.
 *
 * Plus Jakarta Sans: gövde, başlık, buton, etiket, sayı (`--font-body`,
 * `--font-display`). Tek değişken dosya; ağırlıklar aynı dosyadan gelir.
 * Fraunces: yalnız `.font-display` serif vurgusu (`--font-accent`). Yalnız
 * 700 ve eksensiz indirilir — opsz/SOFT/WONK eksenleriyle dosya üç kat
 * büyüyor ve 450 KB sayfa bütçesini aşıyordu.
 * `latin-ext` Türkçe diakritikler için zorunlu.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  weight: ["700"],
  variable: "--font-fraunces",
  display: "swap",
});

export const seyyahFontClass = `${jakarta.variable} ${fraunces.variable}`;
/** Geriye uyumlu ad: vitrin kökü bunu kullanır. */
export const vitrinFontClass = seyyahFontClass;
