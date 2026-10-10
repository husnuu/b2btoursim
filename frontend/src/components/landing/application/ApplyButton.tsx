"use client";

import type { ReactNode } from "react";
import type { BusinessType } from "@/content/site";
import { buttonClass, type ButtonSize, type ButtonVariant } from "@/components/landing/ui/primitives";
import { magneticHandlers } from "@/components/effects/magnetic";
import { useApplication } from "./ApplicationProvider";

export function ApplyButton({
  type,
  children,
  variant = "dark",
  size = "md",
  className = "",
  unstyled = false,
}: {
  type?: BusinessType;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  unstyled?: boolean;
}) {
  const { open } = useApplication();
  return (
    <button
      type="button"
      onClick={() => open(type)}
      aria-haspopup="dialog"
      {...(unstyled ? {} : magneticHandlers)}
      className={unstyled ? className : buttonClass(variant, size, `magnetic ${className}`)}
    >
      {children}
    </button>
  );
}
