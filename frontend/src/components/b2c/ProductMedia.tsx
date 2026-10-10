import Image from "next/image";
import type { KartFoto } from "@/lib/storefront/kart";

/**
 * Görsel sarmalayıcı (VITRIN.md §4.4). Gerçek görsel varsa `next/image`
 * (`fill`, `sizes`); yoksa kayıttan türeyen sakin ton + parlama. Kapsayıcı
 * en-boy oranını ve köşeyi kendisi verir; bu bileşen yalnız içi doldurur.
 *
 * `priority` yalnız detay kapağında: ana sayfadaki kartlar tembel yüklenir.
 */
export function ProductMedia({
  photo,
  tone,
  sizes,
  priority = false,
  wide = false,
  className = "",
}: {
  photo: KartFoto;
  tone: string;
  /** `next/image` için görüntü genişliği ipucu, örn. "(min-width: 1024px) 33vw, 100vw". */
  sizes: string;
  priority?: boolean;
  /** Geniş kapak: parlama daha yayvan. */
  wide?: boolean;
  className?: string;
}) {
  if (photo) {
    return (
      <Image
        src={photo.url}
        alt={photo.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    );
  }
  return (
    <span aria-hidden="true" className={`absolute inset-0 ${className}`} style={{ background: tone }}>
      <span
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{ backgroundImage: wide ? "var(--image-sheen-wide)" : "var(--image-sheen)" }}
      />
    </span>
  );
}
