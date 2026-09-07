"use client";

import { useSyncExternalStore } from "react";

/**
 * sessionStorage'ı React'in dışsal veri kaynağı olarak okur.
 *
 * Neden sessionStorage: operatör aynı anda üç müşteriyle ilgileniyor olabilir
 * ve her sekme ayrı bir müşteridir (Bölüm 3.3). localStorage sekmeler arası
 * paylaşılır ve sepetleri birbirine karıştırır.
 */

const listeners = new Set<() => void>();

/** Aynı sekmedeki yazmalardan sonra okuyucuları uyandırır. */
export function notifySessionChange() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    // Depolama kapalı (gizli sekme, kısıtlı tarayıcı): akış bozulmaz.
    return null;
  }
}

export function writeSession(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* yok sayılır */
  }
}

/**
 * Sunucuda her zaman null döner; istemcide gerçek değer okunur. String
 * değerler değere göre karşılaştırıldığı için anlık görüntü kararlıdır.
 */
export function useSessionValue(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => readSession(key),
    () => null,
  );
}
