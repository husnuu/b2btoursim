import type { CSSProperties } from "react";
import { Container } from "@/components/landing/ui/primitives";

/**
 * Büyük bir paragraf; kaydırdıkça kelimeler sırayla koyulaşır.
 * --progress değerini RevealObserver yazar (data-progress).
 */
export function ScrollWords({ text, label, tone = "light" }: { text: string; label?: string; tone?: "light" | "mist" }) {
  const words = text.split(" ");
  const n = words.length;
  return (
    <section className={`py-28 sm:py-40 ${tone === "mist" ? "bg-mist" : ""}`}>
      <Container>
        {label && <p className="mb-8 text-sm font-bold tracking-wide uppercase">{label}</p>}
        <p
          data-progress
          className="font-display max-w-5xl text-[2rem] leading-[1.18] sm:text-5xl lg:text-[3.6rem]"
          style={{ "--progress": 0 } as CSSProperties}
        >
          <span className="sr-only">{text}</span>
          <span aria-hidden="true">
            {words.map((w, i) => (
              <span
                key={i}
                className="transition-opacity duration-200"
                style={{ opacity: `clamp(0.14, calc((var(--progress) * 1.35 * ${n} - ${i}) * 0.35 + 0.14), 1)` }}
              >
                {w}{" "}
              </span>
            ))}
          </span>
        </p>
      </Container>
    </section>
  );
}
