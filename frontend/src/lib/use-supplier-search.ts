"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HOTEL_RESULTS, SEARCH_SUPPLIERS, TOUR_RESULTS } from "@/data/mock";
import type { SearchResult, SupplierProgress } from "./types";

/**
 * Kademeli sonuç yükleme (Bölüm 3.3).
 *
 * Gerçek uygulamada bu hook bir SSE / streaming endpoint'i tüketir. Sözleşme
 * aynı: tedarikçi başına bağımsız yanıt, geldikçe listeye akar, biri
 * düşerse arama çökmez.
 *
 * Yeni arama, hook'u sıfırlamaz — bileşen `key` ile yeniden monte edilir,
 * durum böylece doğal olarak taze başlar.
 */

/** Tedarikçi başına simüle gecikme. TX kasten zaman aşımına uğrar. */
const LATENCY: Record<string, number> = {
  loc: 900,
  hb: 1900,
  gyg: 2700,
  vlt: 4100,
  trx: 6800,
};
const FAILING = new Set(["trx"]);

type State = {
  results: SearchResult[];
  progress: SupplierProgress[];
  done: boolean;
};

function initialState(): State {
  return {
    results: [],
    progress: SEARCH_SUPPLIERS.map((supplier) => ({
      supplier,
      state: "pending" as const,
      resultCount: 0,
    })),
    done: false,
  };
}

export function useSupplierSearch(kind: "tour" | "hotel" = "tour") {
  const [state, setState] = useState<State>(initialState);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const dataset = kind === "hotel" ? HOTEL_RESULTS : TOUR_RESULTS;

  const runSupplier = useCallback((supplierId: string, forceSuccess = false) => {
    const delay = forceSuccess ? 1100 : (LATENCY[supplierId] ?? 2000);
    const willFail = FAILING.has(supplierId) && !forceSuccess;

    const timer = setTimeout(() => {
      setState((prev) => {
        const incoming = willFail
          ? []
          : dataset.filter((r) => r.supplier.id === supplierId);
        const progress = prev.progress.map((p) =>
          p.supplier.id === supplierId
            ? {
                ...p,
                state: (willFail ? "failed" : "responded") as
                  | "failed"
                  | "responded",
                resultCount: incoming.length,
                latencyMs: delay,
              }
            : p,
        );
        return {
          results: [...prev.results, ...incoming],
          progress,
          done: progress.every((p) => p.state !== "pending"),
        };
      });
    }, delay);

    timers.current.push(timer);
  }, [dataset]);

  useEffect(() => {
    SEARCH_SUPPLIERS.forEach((s) => runSupplier(s.id));
    const scheduled = timers.current;
    return () => scheduled.forEach(clearTimeout);
  }, [runSupplier]);

  const retry = useCallback(
    (supplierId: string) => {
      setState((prev) => ({
        ...prev,
        done: false,
        progress: prev.progress.map((p) =>
          p.supplier.id === supplierId ? { ...p, state: "pending" } : p,
        ),
      }));
      // Tekrar denemede kaynak yanıt verir; operatör aramayı baştan kurmaz.
      runSupplier(supplierId, true);
    },
    [runSupplier],
  );

  return { ...state, retry };
}
