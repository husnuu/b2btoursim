export function LogoMark({ className = "size-9", tone = "dark" }: { className?: string; tone?: "dark" | "pop" }) {
  // Renkler token sınıflarından gelir; ham hex yok (tests/tokens.test.ts).
  const bg = tone === "dark" ? "fill-ink" : "fill-pop";
  const fg = tone === "dark" ? "stroke-pop" : "stroke-ink";
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" className={bg} />
      <path d="M8 17.5c3.5-4.5 7-4.5 12 0s8.5 4.5 12 0" fill="none" className={fg} strokeWidth="3.6" strokeLinecap="round" />
      <path d="M8 26c3.5-4.5 7-4.5 12 0s8.5 4.5 12 0" fill="none" className={fg} strokeWidth="3.6" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}

/** Kelime markası: kalın, sıkı harf aralıklı; "yy" üzerinde dalga. */
export function Logo({ tone = "dark", size = "md" }: { tone?: "dark" | "light"; size?: "md" | "lg" }) {
  const color = tone === "light" ? "text-white" : "text-ink";
  const fontSize = size === "lg" ? "text-[2.3rem]" : "text-[1.75rem]";
  return (
    <span className={`relative inline-flex items-end font-sans ${fontSize} leading-none font-extrabold tracking-[-0.055em] ${color}`}>
      <span>se</span>
      <span className="relative">
        yy
        <svg viewBox="0 0 40 10" className="absolute -top-[0.38em] left-[0.02em] h-[0.32em] w-[1.05em]" aria-hidden="true">
          <path d="M3 7c5-5 9-5 14 0s9 5 14 0" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
        </svg>
      </span>
      <span>ah</span>
    </span>
  );
}
