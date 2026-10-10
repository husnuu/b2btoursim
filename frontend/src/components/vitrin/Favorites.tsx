"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Heart } from "lucide-react";

type Ctx = { ids: string[]; toggle: (id: string) => void };
const FavCtx = createContext<Ctx>({ ids: [], toggle: () => {} });
const KEY = "seyyah-vitrin-favoriler";

/** Ziyaretçinin favorileri yalnızca kendi tarayıcısında saklanır. */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- tarayıcı deposundan ilk okuma
      if (raw) setIds(JSON.parse(raw));
    } catch {}
  }, []);
  const toggle = useCallback((id: string) => {
    setIds((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);
  return <FavCtx.Provider value={{ ids, toggle }}>{children}</FavCtx.Provider>;
}

export const useFavorites = () => useContext(FavCtx);

export function HeartButton({ id, title, className = "" }: { id: string; title: string; className?: string }) {
  const { ids, toggle } = useFavorites();
  const on = ids.includes(id);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `${title} favorilerden çıkar` : `${title} favorilere ekle`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      className={`grid size-10 place-items-center rounded-full bg-white/95 shadow-sm transition-transform duration-300 hover:scale-110 active:scale-90 ${className}`}
    >
      <Heart className={`size-[18px] transition-colors ${on ? "fill-ink text-ink" : "text-ink"}`} strokeWidth={2.2} />
    </button>
  );
}

export function FavoritesCount() {
  const { ids } = useFavorites();
  return (
    <span className="relative inline-flex items-center gap-2">
      <Heart className={`size-5 ${ids.length ? "fill-ink" : ""}`} />
      <span className="hidden sm:inline">Favoriler</span>
      {ids.length > 0 && (
        <span className="absolute -top-2 left-3 grid min-w-5 place-items-center rounded-full bg-pop px-1 text-[11px] font-bold">{ids.length}</span>
      )}
    </span>
  );
}
