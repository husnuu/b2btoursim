import type { CSSProperties, ReactNode } from "react";
import { statusLabel, type FeatureStatus } from "@/content/site";

export const buttonStyles = {
  base: "btn-arrow inline-flex items-center justify-center gap-2.5 font-medium transition-[background-color,color,border-color,transform] duration-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
  size: {
    md: "h-12 rounded-[10px] px-6 text-[15px]",
    lg: "h-14 rounded-xl px-8 text-base",
  },
  variant: {
    dark: "bg-ink text-white hover:bg-ink-2",
    pop: "bg-pop text-ink hover:bg-white",
    outline: "border-[1.5px] border-ink bg-transparent text-ink hover:bg-ink hover:text-white",
    light: "bg-white text-ink hover:bg-pop",
    ghostLight: "border-[1.5px] border-white/40 text-white hover:border-white hover:bg-white hover:text-ink",
  },
} as const;

export type ButtonVariant = keyof typeof buttonStyles.variant;
export type ButtonSize = keyof typeof buttonStyles.size;

export function buttonClass(variant: ButtonVariant = "dark", size: ButtonSize = "md", extra = "") {
  return `${buttonStyles.base} ${buttonStyles.size[size]} ${buttonStyles.variant[variant]} ${extra}`;
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1240px] px-5 sm:px-8 ${className}`}>{children}</div>;
}

/** Kelimeleri maskelenmiş satırlar halinde yükselterek gösterir. */
export function SplitText({ text, offset = 0 }: { text: string; offset?: number }) {
  const words = text.split(" ");
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <span key={i}>
            <span className="split-w">
              <span style={{ "--i": i + offset } as CSSProperties}>{w}</span>
            </span>
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    </>
  );
}

/** Bölüm başlığı: büyük serif, kelime kelime açılır. Satır kırılımı için "\n" kullanın. */
export function Heading({
  id,
  children,
  as: Tag = "h2",
  className = "",
  size = "lg",
}: {
  id?: string;
  children: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  size?: "md" | "lg" | "xl";
}) {
  const sizes = {
    md: "text-[2rem] sm:text-[2.6rem]",
    lg: "text-[2.3rem] sm:text-5xl lg:text-[3.6rem]",
    xl: "text-[2.6rem] sm:text-6xl lg:text-[4.6rem]",
  };
  const lines = children.split("\n");
  // Her satırın ilk kelimesinin sayfa içi sırası — animasyon gecikmesi satırlar boyunca sürsün
  const offsets = lines.map((_, i) => lines.slice(0, i).reduce((n, l) => n + l.split(" ").length, 0));
  return (
    <Tag id={id} data-reveal="split" className={`font-display leading-[1.04] ${sizes[size]} ${className}`}>
      {lines.map((line, i) => (
        <span key={i} className="block">
          <SplitText text={line} offset={offsets[i]} />
        </span>
      ))}
    </Tag>
  );
}

export function StatusTag({ status, tone = "light" }: { status: FeatureStatus; tone?: "light" | "dark" }) {
  if (status === "live") return null;
  const styles =
    tone === "dark"
      ? "border-white/30 text-white/75"
      : status === "soon"
        ? "border-amber/40 bg-amber-soft text-amber"
        : "border-ink/20 text-ink-3";
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${styles}`}>
      {statusLabel[status]}
    </span>
  );
}

export function delay(ms: number) {
  return { "--d": `${ms}ms` } as CSSProperties;
}
