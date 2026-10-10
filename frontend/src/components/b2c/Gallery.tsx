"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, X } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Gallery as GalleryData } from "@/lib/storefront/details";
import { ProductMedia } from "./ProductMedia";

/**
 * Detay galerisi (VITRIN.md §4.4, Seyyah `ProductGallery`): büyük köşeli
 * kapak + masaüstünde yanında iki küçük kare; "Tüm fotoğraflar" düğmesi tam
 * ekran diyalog açar (klavye okları, sayaç). Gerçek görsel yoksa ton zemin;
 * tek görselde yan kareler ve düğme çizilmez.
 */
export function Gallery({ gallery, title }: { gallery: GalleryData; title: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(0);
  const real = gallery.filter((g) => g.url);
  const cover = gallery[0];
  const open = (k: number) => {
    setI(k);
    ref.current?.showModal();
  };
  const go = (d: number) => setI((x) => (x + d + real.length) % real.length);

  return (
    <figure aria-label={t("b2c.detail.gallery")} className="relative h-[300px] overflow-hidden rounded-[var(--radius-xl)] bg-sunken sm:h-[420px] lg:h-[480px]">
      <div className={`grid h-full gap-2 ${real.length > 1 ? "lg:grid-cols-[2fr_1fr] lg:grid-rows-2" : ""}`}>
        <button
          type="button"
          onClick={() => real.length && open(0)}
          disabled={!real.length}
          aria-label={t("b2c.detail.enlarge")}
          className={`group relative overflow-hidden ${real.length > 1 ? "lg:row-span-2" : ""}`}
        >
          <ProductMedia
            photo={cover?.url ? { url: cover.url, alt: cover.alt || title } : null}
            tone={cover?.tone ?? "oklch(0.62 0.09 200)"}
            sizes="(min-width: 1024px) 860px, 100vw"
            priority
            wide
            className="kenburns transition-transform duration-[1.2s] group-hover:scale-105"
          />
        </button>
        {real.length > 1 &&
          real.slice(1, 3).map((g, k) => (
            <button key={g.url} type="button" onClick={() => open(k + 1)} aria-label={t("b2c.detail.photoN", { n: k + 2 })} className="group relative hidden overflow-hidden lg:block">
              <ProductMedia photo={{ url: g.url!, alt: g.alt }} tone={g.tone} sizes="430px" className="transition-transform duration-[1.2s] group-hover:scale-110" />
            </button>
          ))}
      </div>

      {real.length > 1 && (
        <button
          type="button"
          onClick={() => open(0)}
          className="absolute bottom-5 left-5 flex items-center gap-2 rounded-[var(--radius)] bg-surface px-4 py-2.5 font-semibold text-ink shadow-[var(--shadow-card)] transition-transform hover:scale-105"
        >
          <LayoutGrid className="size-4" /> {t("b2c.detail.allPhotos", { count: real.length })}
        </button>
      )}

      {real.length > 0 && (
        <dialog
          ref={ref}
          aria-label={t("b2c.detail.photosOf", { title })}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(1);
            if (e.key === "ArrowLeft") go(-1);
          }}
          onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
          className="m-auto h-[min(86vh,820px)] w-[min(94vw,1200px)] overflow-hidden rounded-[var(--radius-xl)] bg-inverse p-0 text-ink-inverse backdrop:bg-inverse/80"
        >
          <div className="relative h-full">
            <ProductMedia key={real[i]?.url} photo={{ url: real[i]!.url!, alt: real[i]!.alt || `${title} — ${i + 1}` }} tone={real[i]!.tone} sizes="1200px" className="tab-in !object-contain" />
            <button type="button" onClick={() => ref.current?.close()} aria-label={t("common.close")} className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-surface text-ink">
              <X className="size-5" />
            </button>
            {real.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} aria-label={t("b2c.detail.prevPhoto")} className="absolute top-1/2 left-4 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-ink">
                  <ChevronLeft className="size-5" />
                </button>
                <button type="button" onClick={() => go(1)} aria-label={t("b2c.detail.nextPhoto")} className="absolute top-1/2 right-4 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-ink">
                  <ChevronRight className="size-5" />
                </button>
                <span className="tnum absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-inverse/70 px-3 py-1 text-sm">
                  {i + 1} / {real.length}
                </span>
              </>
            )}
          </div>
        </dialog>
      )}
      {cover?.alt?.trim() && <figcaption className="sr-only">{cover.alt}</figcaption>}
    </figure>
  );
}
