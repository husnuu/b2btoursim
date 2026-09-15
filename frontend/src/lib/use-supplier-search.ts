"use client";

import { useCallback, useEffect, useState } from "react";
import { searchInventory, type SearchInput } from "./search/actions";
import type { SearchResult, SupplierProgress } from "./types";

/**
 * Kademeli sonuç yükleme (Bölüm 3.3) — kaynaklar `searchInventory` sunucu
 * eyleminden gelir: kendi envanteri, pazaryeri, dış adaptörler. Sözleşme
 * aynı: kaynak başına bağımsız durum, biri düşerse arama çökmez.
 *
 * Yeni arama, hook'u sıfırlamaz — bileşen `key` ile yeniden monte edilir.
 */
type State = { results: SearchResult[]; progress: SupplierProgress[]; done: boolean };

export function useSupplierSearch(input: SearchInput) {
  const [state, setState] = useState<State>({ results: [], progress: [], done: false });
  const [attempt, setAttempt] = useState(0);
  const { kind, destination, date, adults, children } = input;

  useEffect(() => {
    let alive = true;
    searchInventory({ kind, destination, date, adults, children })
      .then((out) => alive && setState({ results: out.results, progress: out.progress, done: true }))
      .catch(() => alive && setState({ results: [], progress: [], done: true }));
    return () => {
      alive = false;
    };
  }, [kind, destination, date, adults, children, attempt]);

  /** Kaynak yeniden denemesi: arama yeniden çalışır; operatör aramayı baştan kurmaz. */
  const retry = useCallback((supplierId: string) => {
    setState((prev) => ({ ...prev, done: false, progress: prev.progress.map((p) => (p.supplier.id === supplierId ? { ...p, state: "pending" } : p)) }));
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, retry };
}
