import type { Metadata } from "next";
import { Barlow, Barlow_Semi_Condensed } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { ToastProvider } from "@/components/primitives/Toast";
import { WebVitals } from "@/components/WebVitals";
import { BRAND_PALETTE, themeVars } from "@/lib/theme";

/**
 * Tek süper aile. Barlow otoyol/transit tabela grotesklerinden çizildi;
 * Semi Condensed varyantı yoğun Extranet tablolarında aynı okunabilir
 * puntoyla satıra iki kolon daha sığdırıyor — dekoratif değil, işlevsel.
 * latin-ext altkümesi Türkçe diakritikler için zorunlu.
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

export const metadata: Metadata = {
  title: "Kontuar — acente satış terminali",
  description:
    "Seyahat acenteleri, tur operatörleri ve DMC'ler için çok kiracılı satış ve rezervasyon platformu.",
};

/** Tenant markası. White-label MVP'de tek değişken bu (Bölüm 2.4). */
const TENANT_BRAND = BRAND_PALETTE[0].hex;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Tenant tonları kökte; bileşenler yalnız rol adı kullanır.
    <html
      lang="tr"
      className={`${barlow.variable} ${barlowSC.variable}`}
      style={themeVars(TENANT_BRAND) as React.CSSProperties}
    >
      <body data-brand={BRAND_PALETTE[0].id}>
        <WebVitals />
        <ToastProvider>
          <CartProvider>{children}</CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
