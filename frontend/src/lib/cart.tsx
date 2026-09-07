"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { CartLine } from "./types";
import { marginAmount, salePrice } from "./types";
import { notifySessionChange, useSessionValue, writeSession } from "./session-store";

/**
 * Sepet durumu **sekme başına** tutulur (sessionStorage), localStorage değil.
 *
 * Bölüm 3.3: operatör aynı anda üç müşteriyle ilgileniyor olabilir; her
 * sekme ayrı bir müşteridir ve sepetler birbirine karışmamalıdır.
 *
 * Depolama React'in dışsal kaynağı olarak okunuyor: sunucu her zaman boş
 * sepet render eder, istemci gerçek değeri okur, hidrasyon uyuşmazlığı olmaz.
 */

const KEY = "kontuar.cart.v1";
const EMPTY: CartLine[] = [];

type CartContext = {
  lines: CartLine[];
  add: (line: CartLine) => void;
  remove: (id: string) => void;
  restore: (line: CartLine, index: number) => void;
  setMargin: (id: string, pct: number) => void;
  clear: () => void;
  totals: { net: number; margin: number; sale: number };
};

const Ctx = createContext<CartContext | null>(null);

function parse(raw: string | null): CartLine[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartLine[]) : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const raw = useSessionValue(KEY);
  const lines = useMemo(() => parse(raw), [raw]);

  const commit = useCallback((next: CartLine[]) => {
    writeSession(KEY, JSON.stringify(next));
    notifySessionChange();
  }, []);

  const add = useCallback(
    (line: CartLine) => commit([...parse(readRaw()), line]),
    [commit],
  );

  const remove = useCallback(
    (id: string) => commit(parse(readRaw()).filter((l) => l.id !== id)),
    [commit],
  );

  const restore = useCallback(
    (line: CartLine, index: number) => {
      const next = [...parse(readRaw())];
      next.splice(Math.min(index, next.length), 0, line);
      commit(next);
    },
    [commit],
  );

  const setMargin = useCallback(
    (id: string, pct: number) =>
      commit(
        parse(readRaw()).map((l) => (l.id === id ? { ...l, marginPct: pct } : l)),
      ),
    [commit],
  );

  const clear = useCallback(() => commit([]), [commit]);

  const totals = useMemo(() => {
    const paxOf = (l: CartLine) => l.pax.adults + l.pax.children;
    return {
      net: lines.reduce((sum, l) => sum + l.net * paxOf(l), 0),
      sale: lines.reduce(
        (sum, l) => sum + salePrice(l.net, l.marginPct) * paxOf(l),
        0,
      ),
      margin: lines.reduce(
        (sum, l) => sum + marginAmount(l.net, l.marginPct) * paxOf(l),
        0,
      ),
    };
  }, [lines]);

  const value = useMemo(
    () => ({ lines, add, remove, restore, setMargin, clear, totals }),
    [lines, add, remove, restore, setMargin, clear, totals],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Yazmadan hemen önce depodan taze oku: iki sekme aynı anda yazarsa
    son yazan kaybetmez. */
function readRaw(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart, CartProvider içinde çağrılmalı");
  return ctx;
}
