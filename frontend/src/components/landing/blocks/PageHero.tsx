import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Container, SplitText } from "@/components/landing/ui/primitives";
import { MouseStage } from "@/components/effects/MouseStage";

type Photo = { src: string; alt: string };

const tilts = ["-rotate-[7deg]", "rotate-[5deg]", "-rotate-[3deg]"];
const spots = [
  "top-[4%] left-[2%] w-[52%]",
  "top-[18%] right-[0%] w-[48%]",
  "bottom-[0%] left-[22%] w-[50%]",
];

/** Ara sayfa hero'su: renkli zemin, kelime kelime açılan başlık, imleçle hareket eden polaroid kolajı. */
export function PageHero({
  kicker,
  title,
  lead,
  photos,
  actions,
  tone = "pop",
}: {
  kicker: string;
  title: string;
  lead: string;
  photos: Photo[];
  actions: ReactNode;
  tone?: "pop" | "ink";
}) {
  const dark = tone === "ink";
  const lines = title.split("\n");
  const offsets = lines.map((_, i) => lines.slice(0, i).reduce((n, l) => n + l.split(" ").length, 0));
  return (
    <section className={`grain relative overflow-hidden ${dark ? "bg-ink text-white" : "bg-pop text-ink"}`}>
      <Container className="relative grid items-center gap-14 pt-10 pb-24 sm:pt-14 lg:grid-cols-[1.1fr_1fr] lg:pb-28">
        <div className="relative z-10">
          <nav aria-label="Konum" className="tab-in text-sm font-semibold">
            <Link href="/" className="opacity-60 hover:opacity-100">Seyyah</Link>
            <span className="mx-2 opacity-40">/</span>
            <span>{kicker}</span>
          </nav>
          <h1 className="split-load font-display mt-7 text-[2.7rem] leading-[1.02] sm:text-6xl lg:text-[4.4rem]">
            {lines.map((l, i) => (
              <span key={i} className="block">
                <SplitText text={l} offset={offsets[i]} />
              </span>
            ))}
          </h1>
          <p className={`tab-in mt-7 max-w-xl text-lg leading-relaxed sm:text-xl ${dark ? "text-white/70" : "text-ink-2"}`} style={{ animationDelay: "450ms" }}>
            {lead}
          </p>
          <div className="tab-in mt-10 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "600ms" }}>
            {actions}
          </div>
        </div>

        <MouseStage className="relative mx-auto aspect-square w-full max-w-[520px]">
          {photos.slice(0, 3).map((p, i) => (
            <div
              key={p.src}
              className={`mouse-layer tab-in absolute ${spots[i]}`}
              style={{ "--depth": `${[-14, 18, 30][i]}px`, animationDelay: `${200 + i * 140}ms` } as CSSProperties}
            >
              <div className={`polaroid ${tilts[i]} ${i === 1 ? "float" : i === 2 ? "float-late" : ""}`}>
                <div className="relative aspect-[4/5]">
                  <Image src={p.src} alt={p.alt} fill preload={i === 0} sizes="(min-width: 1024px) 280px, 50vw" className="object-cover" />
                </div>
              </div>
            </div>
          ))}
        </MouseStage>
      </Container>
    </section>
  );
}
