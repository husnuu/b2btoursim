import Image from "next/image";
import Link from "next/link";
import { Check, MapPin, Moon, Navigation, PawPrint, Users } from "lucide-react";
import { formatMoney } from "@/lib/i18n";
import type { StayInfo } from "@/lib/storefront/kart";
import { HeartButton } from "./Favorites";
import { ctaPrimary } from "./cta";

export type StayCardProps = {
  id: string;
  href: string;
  title: string;
  image: string | null;
  /** Görsel yoksa zemin rengi. */
  tone?: string;
  stay: StayInfo;
  /** Gecelik fiyat, kuruş; `null` → teklifle. */
  nightly: number | null;
  currency: string;
};

const FEATURES_SHOWN = 4;

/**
 * Konaklama kartı (villa, ileride otel): ETS Tur listesi düzeni — solda
 * görsel, ortada ad/konum/özellikler, sağda gecelik fiyat ve en kısa
 * konaklamanın toplamı. Tur kartından ayrı: süre/dil yerine kapasite,
 * özellik ve mesafe önemli. Dar ekranda görsel üste geçer.
 *
 * Kartın tamamı tıklanır (başlık bağlantısı kartı örter); kalp ve düğme
 * üstte kalır.
 */
export function StayCard({ id, href, title, image, tone, stay, nightly, currency }: StayCardProps) {
  const extra = stay.features.length - FEATURES_SHOWN;
  const total = nightly != null && stay.minNights > 1 ? nightly * stay.minNights : null;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-[box-shadow,border-color] duration-300 hover:border-transparent hover:shadow-[var(--shadow-lift)] md:flex-row">
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden md:aspect-auto md:w-[300px] md:min-h-[240px]" style={image ? undefined : { background: tone }}>
        {image && (
          <Image src={image} alt={title} fill sizes="(min-width: 768px) 300px, 100vw" className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105" />
        )}
        <HeartButton id={id} title={title} className="absolute top-3 right-3 z-10" />
        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-[12px] font-bold tracking-wide text-ink uppercase shadow-sm">
          {stay.category ?? "Villa"}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        {stay.location && (
          <p className="flex items-center gap-1.5 text-sm text-ink-3">
            <MapPin className="size-4 shrink-0" /> <span className="truncate">{stay.location}</span>
          </p>
        )}
        <h3 className="mt-1 text-xl leading-snug font-bold tracking-tight">
          <Link href={href} className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline">
            {title}
          </Link>
        </h3>

        <ul className="mt-3 flex flex-wrap gap-2 text-[13px] font-semibold">
          <li className="flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1"><Users className="size-3.5" /> {stay.capacity} kişilik</li>
          <li className="flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1"><Moon className="size-3.5" /> En az {stay.minNights} gece</li>
          {stay.petsAllowed && <li className="flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1"><PawPrint className="size-3.5" /> Evcil hayvan kabul</li>}
        </ul>

        {stay.features.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-ink-2" aria-label="Öne çıkan özellikler">
            {stay.features.slice(0, FEATURES_SHOWN).map((f) => (
              <li key={f} className="flex min-w-0 items-center gap-1.5">
                <Check className="size-4 shrink-0 text-pop-deep" /> <span className="truncate">{f}</span>
              </li>
            ))}
            {extra > 0 && <li className="text-ink-3">+{extra} özellik</li>}
          </ul>
        )}

        {stay.poi.length > 0 && (
          <p className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-[13px] text-ink-3">
            {stay.poi.slice(0, 2).map((p) => (
              <span key={p.label} className="flex items-center gap-1">
                <Navigation className="size-3.5" /> {p.label} <b className="font-semibold text-ink-2 tabular-nums">{p.distance.toLocaleString("tr-TR")} {p.unit}</b>
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-row items-end justify-between gap-4 border-t border-line p-5 md:w-[230px] md:flex-col md:items-stretch md:border-t-0 md:border-l md:text-right">
        <div>
          <p className="text-[13px] text-ink-3">Gecelik</p>
          <p className="text-[26px] leading-tight font-extrabold tracking-tight tabular-nums">
            {nightly != null ? formatMoney(nightly, currency) : "Teklifle"}
          </p>
          {total != null && (
            <p className="mt-0.5 text-[13px] text-ink-3">
              {stay.minNights} gece: <span className="font-semibold text-ink-2 tabular-nums">{formatMoney(total, currency)}</span>
            </p>
          )}
        </div>
        <Link href={href} tabIndex={-1} aria-hidden="true" className={`${ctaPrimary} relative z-10 h-11 px-5 text-[15px] md:w-full`}>
          Villayı incele
        </Link>
      </div>
    </article>
  );
}
