import type { Metadata, Viewport } from "next";
import { seyyahFontClass } from "@/lib/storefront/fonts";
import { ApplicationProvider } from "@/components/landing/application/ApplicationProvider";
import { RevealObserver } from "@/components/effects/RevealObserver";
import { Header } from "@/components/landing/layout/Header";
import { Footer } from "@/components/landing/layout/Footer";

/**
 * Seyyah tanıtım sitesi (kök `/` ve alt sayfaları).
 *
 * `data-surface="landing"` globals.css'teki rol tokenlarını Seyyah değerlerine
 * çevirir; fontlar `lib/storefront/fonts` üzerinden yalnız bu yüzeyde iner.
 * Kök layout'a (`app/layout.tsx`) dokunulmaz — `.js` sınıfını o ekler.
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Seyyah — B2B Turizm Satış ve Dağıtım Platformu",
    template: "%s · Seyyah",
  },
  description:
    "Seyahat acenteleri ve turizm tedarikçileri için B2B pazaryeri, rezervasyon yönetimi ve dağıtım altyapısı. Turizm ürünlerini keşfedin, ürünlerinizi acentelerin satışına açın.",
  keywords: ["B2B turizm", "acente platformu", "turizm pazaryeri", "tur operatörü yazılımı", "rezervasyon yönetimi", "tedarikçi"],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Seyyah",
    title: "Seyyah — Turizmin Tüm Bağlantıları. Tek Platformda.",
    description: "Seyahat acenteleri ve turizm tedarikçileri için B2B satış, rezervasyon ve dağıtım platformu.",
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  // `--pop` renginin (globals.css) oklch karşılığı; bileşen katmanında ham hex
  // yaşamaz (tests/tokens.test.ts).
  themeColor: "oklch(84.7% 0.145 172.6)",
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-surface="landing" className={`${seyyahFontClass} flex min-h-dvh flex-col`}>
      <a
        href="#icerik"
        className="sr-only z-50 rounded-lg bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        İçeriğe geç
      </a>
      <ApplicationProvider>
        <Header />
        <main id="icerik" className="flex-1">
          {children}
        </main>
        <Footer />
      </ApplicationProvider>
      <RevealObserver />
    </div>
  );
}
