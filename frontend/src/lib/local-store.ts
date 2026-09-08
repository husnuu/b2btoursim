"use client";

import { useSyncExternalStore } from "react";

/**
 * `session-store.ts`'in localStorage karşılığı — yalnızca Vize modülü
 * bunu kullanır (bkz. `visa-store.tsx`). Diğer tüm modüller sekme başına
 * sessionStorage kullanır; Vize'nin public başvuru linki ise doğası
 * gereği **başka bir sekmede** açılır ve sonucun acente panelinde
 * görünmesi gerekir — bu yalnızca sekmeler arası paylaşılan bir depoyla
 * (localStorage) mümkündür.
 *
 * `window`'un native `storage` olayı yalnızca DİĞER sekmelerde tetiklenir;
 * aynı sekme içindeki yazmalar için `notifyLocalChange` kullanılır (aynen
 * `session-store.ts`'teki `notifySessionChange` gibi).
 */

const listeners = new Set<() => void>();

export function notifyLocalChange() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.storageArea === localStorage) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* depolama kapalı (gizli sekme, kısıtlı tarayıcı): akış bozulmaz */
  }
}

export function useLocalValue(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => readLocal(key),
    () => null,
  );
}
