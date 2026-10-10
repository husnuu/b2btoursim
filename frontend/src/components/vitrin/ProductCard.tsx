"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Clock, Languages, Sparkles, Timer, Truck, Zap } from "lucide-react";
import { catLabel, fromPrice, tl, type Product } from "@/content/vitrin";
import { useVitrin } from "./VitrinProvider";
import { HeartButton } from "./Favorites";

const badgeIcon = { "Çok tercih edilen": Sparkles, "Kaçırmayın": Zap, Yeni: Sparkles, "Son yerler": Timer } as const;

export function ProductCard({ p, hrefBase = "/magaza/urun" }: { p: Product; hrefBase?: string }) {
  const { destName } = useVitrin();
  const from = fromPrice(p);
  const BadgeIcon = p.badge ? badgeIcon[p.badge] : null;
  return (
    <Link
      href={p.href ?? `${hrefBase}/${p.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[22px] bg-white shadow-[var(--shadow-lift)] transition-[transform,box-shadow] duration-500 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-[16/11] overflow-hidden">
        <Image src={p.image} alt={p.title} fill sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 82vw" className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110" />
        {p.gallery[1] && (
          <Image src={p.gallery[1]} alt="" fill sizes="(min-width: 1024px) 300px, 45vw" className="scale-110 object-cover opacity-0 transition-[opacity,scale] duration-700 ease-out group-hover:scale-100 group-hover:opacity-100" />
        )}
        {p.badge && BadgeIcon && (
          <span className="absolute top-0 left-0 flex items-center gap-1.5 rounded-br-xl bg-ink px-3 py-1.5 text-[13px] font-semibold text-white">
            <BadgeIcon className="size-3.5 text-pop" /> {p.badge}
          </span>
        )}
        <HeartButton id={p.slug} title={p.title} className="absolute top-3 right-3" />
        <span className="absolute bottom-3 left-4 rounded-full bg-pop px-3 py-1 text-[12px] font-bold tracking-wide uppercase">
          {catLabel(p.category)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[17px] leading-snug font-semibold">
          <span className="font-normal text-ink-3 italic">{destName(p.city)} –</span> {p.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-[14.5px] leading-relaxed text-ink-3">{p.summary}</p>

        <ul className="mt-4 flex flex-col gap-2 text-[14px] text-ink-2">
          <li className="flex items-center gap-2.5"><Clock className="size-4 shrink-0" /> {p.duration}</li>
          {p.freeCancel ? (
            <li className="flex items-center gap-2.5 font-medium text-pop-deep"><CalendarCheck className="size-4 shrink-0" /> Ücretsiz iptal</li>
          ) : (
            <li className="flex items-center gap-2.5"><Languages className="size-4 shrink-0" /> {p.languages.join(", ")}</li>
          )}
          {p.instant ? (
            <li className="flex items-center gap-2.5"><Zap className="size-4 shrink-0" /> Anında onay</li>
          ) : p.pickup ? (
            <li className="flex items-center gap-2.5"><Truck className="size-4 shrink-0" /> Otelden alınış</li>
          ) : null}
        </ul>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <span className="text-[13px] text-ink-3">{p.options.length > 1 ? `${p.options.length} seçenek` : "Tek seçenek"}</span>
          <span className="text-right">
            <span className="block text-[12px] text-ink-3">başlayan fiyatlarla</span>
            <span className="flex items-baseline justify-end gap-2">
              {p.oldPrice && <s className="text-sm text-ink-3">{tl(p.oldPrice)}</s>}
              <b className="text-2xl font-extrabold tracking-tight tabular-nums">{tl(from)}</b>
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
