"use client";

import { useRef, type ReactNode } from "react";

/** İmleç konumunu -1…1 aralığında --mx / --my olarak yazar; `.mouse-layer` öğeleri derinliğe göre kayar. */
export function MouseStage({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={className}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        ref.current.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        ref.current.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      }}
      onPointerLeave={() => {
        ref.current?.style.setProperty("--mx", "0");
        ref.current?.style.setProperty("--my", "0");
      }}
    >
      {children}
    </div>
  );
}
