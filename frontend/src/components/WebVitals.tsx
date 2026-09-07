"use client";

import { useReportWebVitals } from "next/web-vitals";
import { report } from "@/lib/report";

/**
 * Core Web Vitals ölçümü — gerçek kullanıcılardan (RUM).
 *
 * Bölüm 8'deki performans bütçesi laboratuvar ölçümüyle doğrulanıyor;
 * bütçenin gerçekte tutup tutmadığını ancak buradan gelen alan verisi söyler.
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    report({
      kind: "web-vital",
      name: metric.name,
      value: Math.round(metric.value),
      rating: (metric as { rating?: string }).rating,
    });
  });
  return null;
}
