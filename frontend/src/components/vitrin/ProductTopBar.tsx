"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Check, Share2 } from "lucide-react";

/** Başlık ekrandan çıkınca masaüstünde üstten inen özet çubuğu. */
export function ProductTopBar({ title, image, price, watchId }: { title: string; image: string; price: string; watchId: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById(watchId);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [watchId]);

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 top-0 z-50 hidden border-b border-line bg-white/95 backdrop-blur transition-transform duration-500 lg:block ${show ? "translate-y-0" : "-translate-y-full"}`}
    >
      <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-4 px-5">
        <span className="relative size-10 shrink-0 overflow-hidden rounded-lg">
          <Image src={image} alt="" fill sizes="40px" className="object-cover" />
        </span>
        <p className="min-w-0 flex-1 truncate font-bold">{title}</p>
        <span className="text-right">
          <span className="block text-[11px] text-ink-3">başlayan fiyatlarla</span>
          <b className="text-lg font-extrabold tabular-nums">{price}</b>
        </span>
        <a href="#rezervasyon" tabIndex={show ? 0 : -1} className="rounded-xl bg-ink px-5 py-2.5 font-semibold text-white hover:bg-ink-2">
          Müsaitliği gör
        </a>
      </div>
    </div>
  );
}

/** Sistem paylaşım menüsü; desteklenmiyorsa bağlantıyı panoya kopyalar. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const url = window.location.href;
        try {
          if (navigator.share) await navigator.share({ title, url });
          else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          }
        } catch {}
      }}
      className="flex items-center gap-2 rounded-xl border-[1.5px] border-ink/15 px-4 py-2 font-semibold transition-colors hover:border-ink"
    >
      {copied ? <Check className="size-4 text-pop-deep" /> : <Share2 className="size-4" />}
      <span aria-live="polite">{copied ? "Bağlantı kopyalandı" : "Paylaş"}</span>
    </button>
  );
}
