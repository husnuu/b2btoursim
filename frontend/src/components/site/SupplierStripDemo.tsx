"use client";

import { useState } from "react";
import { SEARCH_SUPPLIERS } from "@/data/mock";
import type { SupplierProgress, SupplierResponseState } from "@/lib/types";
import { SupplierStatusStrip } from "@/components/extranet/SupplierStatusStrip";

/**
 * Kısmi hata bölümünün gösterimi. Ürünün gerçek şeridi, gerçek durumlarıyla:
 * yanıtladı / bekliyor / yanıt vermedi. "Tekrar dene" burada da çalışıyor —
 * tanıtım sayfasında tıklanamayan bir buton göstermek istemedik.
 */
const INITIAL: Record<string, { state: SupplierResponseState; count: number }> = {
  loc: { state: "responded", count: 4 },
  hb: { state: "responded", count: 2 },
  gyg: { state: "responded", count: 3 },
  vlt: { state: "pending", count: 0 },
  trx: { state: "failed", count: 0 },
};

export function SupplierStripDemo() {
  const [rows, setRows] = useState(INITIAL);

  const progress: SupplierProgress[] = SEARCH_SUPPLIERS.map((supplier) => ({
    supplier,
    state: rows[supplier.id].state,
    resultCount: rows[supplier.id].count,
  }));

  const retry = (id: string) => {
    setRows((prev) => ({ ...prev, [id]: { state: "pending", count: 0 } }));
    setTimeout(
      () => setRows((prev) => ({ ...prev, [id]: { state: "responded", count: 2 } })),
      1100,
    );
  };

  return (
    <div
      data-density="compact"
      className="overflow-hidden rounded-[var(--radius-lg)] border border-line-strong"
    >
      <SupplierStatusStrip progress={progress} onRetry={retry} />
      <div className="bg-surface">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex h-[var(--row-h)] items-center gap-3 border-b border-line px-3 last:border-0"
          >
            <span
              aria-hidden="true"
              className="h-4 rounded-[2px] bg-sunken"
              style={{ width: `${34 - i * 4}%` }}
            />
            <span
              aria-hidden="true"
              className="ms-auto h-4 w-24 rounded-[2px] bg-sunken"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
