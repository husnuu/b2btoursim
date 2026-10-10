import type { ReactNode } from "react";
import type { VitrinData } from "@/content/vitrin";
import { seyyahFontClass } from "@/lib/storefront/fonts";
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
    <div className={`${seyyahFontClass} flex min-h-dvh flex-col bg-paper text-ink`} data-surface="vitrin">
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
