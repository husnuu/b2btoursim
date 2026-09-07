import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-[0.005em] " +
  "rounded-[var(--radius)] border transition-[background-color,border-color,color] duration-100 " +
  "disabled:opacity-45 disabled:cursor-not-allowed select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-action text-on-action border-action hover:bg-action-hover hover:border-action-hover active:bg-action-active",
  secondary:
    "bg-surface text-ink border-line-strong hover:bg-sunken active:bg-sunken",
  ghost:
    "bg-transparent text-ink-2 border-transparent hover:bg-sunken hover:text-ink",
  danger:
    "bg-surface text-danger border-line-strong hover:bg-danger-tint hover:border-danger",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[length:var(--font-ui-sm)]",
  md: "h-9 px-3.5 text-[length:var(--font-ui)]",
  lg: "h-11 px-5 text-[length:var(--font-ui)]",
};

type Common = { variant?: Variant; size?: Size; children: ReactNode };

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  ...rest
}: Common & ComponentProps<"button"> & { className?: string }) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    />
  );
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className = "",
  ...rest
}: Common & ComponentProps<typeof Link> & { className?: string }) {
  return (
    <Link
      data-touch-target
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    />
  );
}
