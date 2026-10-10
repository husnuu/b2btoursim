/**
 * Seyyah'a özel kalın, geometrik ikonlar. Lucide yerine bunları kullanıyoruz ki
 * sayfa şablon gibi durmasın. `draw` sınıfı görünür alana girince çizer.
 */

type P = { className?: string };

/** Liste işareti: küçük yelken */
export function SailBullet({ className = "size-5" }: P) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path d="M10 2.5 L10 15 L3.5 15 Z" fill="currentColor" />
      <path d="M11.6 5.5 L16.5 15 L11.6 15 Z" fill="currentColor" opacity=".55" />
      <path d="M2.5 17.2 H17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Geniş ürün ağı: dört blok, biri yerinden oynamış */
export function GlyphNetwork({ className = "size-20" }: P) {
  return (
    <svg viewBox="0 0 80 80" className={`draw ${className}`} fill="none" stroke="currentColor" strokeWidth="9" strokeLinejoin="round" aria-hidden="true">
      <rect x="8" y="8" width="24" height="24" pathLength={1} />
      <rect x="8" y="46" width="24" height="24" pathLength={1} />
      <rect x="46" y="46" width="24" height="24" pathLength={1} />
      <rect x="50" y="4" width="24" height="24" transform="rotate(14 62 16)" pathLength={1} />
    </svg>
  );
}

/** B2B satış ve dağıtım: iki yöne akan oklar */
export function GlyphExchange({ className = "size-20" }: P) {
  return (
    <svg viewBox="0 0 80 80" className={`draw ${className}`} fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <path d="M8 26 H64 M50 12 L64 26 L50 40" pathLength={1} />
      <path d="M72 56 H16 M30 42 L16 56 L30 70" pathLength={1} />
    </svg>
  );
}

/** Merkezi yönetim: merkez ve dört kol */
export function GlyphHub({ className = "size-20" }: P) {
  return (
    <svg viewBox="0 0 80 80" className={`draw ${className}`} fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="square" aria-hidden="true">
      <circle cx="40" cy="40" r="12" pathLength={1} />
      <path d="M40 4 V22 M40 58 V76 M4 40 H22 M58 40 H76" pathLength={1} />
    </svg>
  );
}

/** Logodaki dalga motifi — dekoratif dev şekiller için */
export function WaveMark({ className = "" }: P) {
  return (
    <svg viewBox="0 0 200 120" className={className} fill="none" stroke="currentColor" strokeWidth="22" strokeLinecap="round" aria-hidden="true">
      <path d="M14 46 C44 14, 70 14, 100 46 S156 78, 186 46" />
      <path d="M14 96 C44 64, 70 64, 100 96 S156 128, 186 96" opacity=".6" />
    </svg>
  );
}

/** Marquee ayıracı: dört köşeli yıldız */
export function Spark({ className = "size-5" }: P) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path d="M10 0 C10.8 6 14 9.2 20 10 C14 10.8 10.8 14 10 20 C9.2 14 6 10.8 0 10 C6 9.2 9.2 6 10 0 Z" fill="currentColor" />
    </svg>
  );
}
