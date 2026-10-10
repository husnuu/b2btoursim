"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, X } from "lucide-react";

/** Kapak fotoğrafı + tam ekran galeri (dialog, klavye okları). */
export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(0);
  const open = (k: number) => {
    setI(k);
    ref.current?.showModal();
  };
  const go = (d: number) => setI((x) => (x + d + images.length) % images.length);

  return (
    <>
      <div className="grid h-full gap-2 lg:grid-cols-[2fr_1fr] lg:grid-rows-2">
        <button type="button" onClick={() => open(0)} className="group relative overflow-hidden lg:row-span-2" aria-label="Fotoğrafları büyüt">
          <Image src={images[0]} alt={title} fill priority sizes="(min-width: 1024px) 860px, 100vw" className="kenburns object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
        </button>
        {images.slice(1, 3).map((src, k) => (
          <button key={src} type="button" onClick={() => open(k + 1)} className="group relative hidden overflow-hidden lg:block" aria-label={`Fotoğraf ${k + 2}`}>
            <Image src={src} alt="" fill sizes="430px" className="object-cover transition-transform duration-[1.2s] group-hover:scale-110" />
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => open(0)}
        className="absolute bottom-5 left-5 flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-semibold shadow-[var(--shadow-card)] transition-transform hover:scale-105"
      >
        <LayoutGrid className="size-4" /> Tüm fotoğraflar ({images.length})
      </button>

      <dialog
        ref={ref}
        aria-label={`${title} fotoğrafları`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
        className="m-auto h-[min(86vh,820px)] w-[min(94vw,1200px)] overflow-hidden rounded-3xl bg-ink p-0 text-white backdrop:bg-ink/80"
      >
        <div className="relative h-full">
          <Image key={images[i]} src={images[i]} alt={`${title} — fotoğraf ${i + 1}`} fill sizes="1200px" className="tab-in object-contain" />
          <button type="button" onClick={() => ref.current?.close()} aria-label="Kapat" className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-white text-ink">
            <X className="size-5" />
          </button>
          <button type="button" onClick={() => go(-1)} aria-label="Önceki fotoğraf" className="absolute top-1/2 left-4 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink">
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Sonraki fotoğraf" className="absolute top-1/2 right-4 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink">
            <ChevronRight className="size-5" />
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-ink/70 px-3 py-1 text-sm tabular-nums">
            {i + 1} / {images.length}
          </span>
        </div>
      </dialog>
    </>
  );
}
