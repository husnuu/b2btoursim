import { Barlow, Barlow_Semi_Condensed } from "next/font/google";

/**
 * Platform fontları (Barlow + Barlow Semi Condensed), ÖN YÜKLEMELİ.
 *
 * Kök layout aynı aileleri `preload: false` ile tanımlar: değişkenler her
 * sayfada var, dosya yalnız metin kullanınca iner. Böylece vitrin
 * (Figtree + Mulish) hiç kullanmadığı 12 Barlow dosyasını (~150 KB)
 * indirmez — ölçüm: /magaza 473 KB → bütçe 450 (VITRIN.md §3.2).
 * Extranet ve Admin bu sınıfı kendi kabuğuna verir; orada ön yükleme
 * sürer, ilk boyama gecikmez.
 */
const barlow = Barlow({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowSC = Barlow_Semi_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-barlow-sc",
  display: "swap",
});

export const platformFontPreload = `${barlow.variable} ${barlowSC.variable}`;
