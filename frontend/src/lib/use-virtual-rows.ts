"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Sabit satır yüksekliğine dayalı basit pencereleme.
 *
 * Bölüm 8 performans bütçesi: 500 satırlık Extranet tablosu
 * sanallaştırılmış olmalı ve 60fps kaydırmalı. DOM'da yalnızca görünen
 * pencere + tampon tutulur.
 */
export function useVirtualRows({
  count,
  rowHeight,
  overscan = 8,
}: {
  count: number;
  rowHeight: number;
  overscan?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState({ start: 0, end: Math.min(count, 40) });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const start = Math.max(0, Math.floor(el.scrollTop / rowHeight) - overscan);
    const visible = Math.ceil(el.clientHeight / rowHeight);
    setRange({ start, end: Math.min(count, start + visible + overscan * 2) });
  }, [count, rowHeight, overscan]);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const onScroll = () => requestAnimationFrame(measure);
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [measure]);

  return {
    ref,
    range,
    padTop: range.start * rowHeight,
    padBottom: Math.max(0, (count - range.end) * rowHeight),
  };
}
