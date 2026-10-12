import type { ReactNode } from "react";
import type { VitrinData } from "@/content/vitrin";
import { seyyahFontClass } from "@/lib/storefront/fonts";
import { BRAND_PALETTE, themeVars } from "@/lib/theme";

const SEYYAH = BRAND_PALETTE.find((b) => b.id === "seyyah") ?? BRAND_PALETTE[0];
import { RevealObserver } from "@/components/effects/RevealObserver";
import { FavoritesProvider } from "./Favorites";
import { DemoBar, VitrinHeader } from "./VitrinChrome";
import { VitrinFooter } from "./VitrinFooter";
import { VitrinProvider } from "./VitrinProvider";

/**
 * Seyyah `/vitrin` layout'u, birebir: favoriler, demo şeridi (yalnız örnek
 * vitrinde), başlık, içerik, altbilgi. `data-surface="vitrin"` fontları ve
 * beyaz zemini verir; Seyyah paleti (pop, ink, mist) `globals.css`'te.
 */
export function VitrinShell({ data, notice, children }: { data: VitrinData; notice?: ReactNode; children: ReactNode }) {
  return (
    <div
      className={`${seyyahFontClass} flex min-h-dvh flex-col bg-paper text-ink`}
      data-surface="vitrin"
      // Seyyah paleti: siyah eylem, turkuaz vurgu — modül liste/detay sayfalarındaki b2c bileşenleri de bunu okur.
      style={themeVars(SEYYAH.hex, SEYYAH.highlight) as React.CSSProperties}
    >
      <VitrinProvider data={data}>
        <FavoritesProvider>
          {notice}
          <DemoBar />
          <VitrinHeader />
          <main id="icerik" className="flex-1">
            {children}
          </main>
          <VitrinFooter />
        </FavoritesProvider>
      </VitrinProvider>
      <RevealObserver />
    </div>
  );
}
