"use client";

import { useState, type ReactNode } from "react";

/** Uzun metni kısaltır; alt kısım soluklaşır, "Devamını oku" ile açılır. */
export function ReadMore({ children, lines = 4 }: { children: ReactNode; lines?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div
        className={`relative overflow-hidden transition-[max-height] duration-500 ${open ? "max-h-[2000px]" : ""}`}
        style={open ? undefined : { maxHeight: `${lines * 1.75}em` }}
      >
        {children}
        {!open && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white" />}
      </div>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="mt-3 font-semibold underline decoration-2 underline-offset-4 hover:decoration-pop">
        {open ? "Daha az göster" : "Devamını oku"}
      </button>
    </div>
  );
}
