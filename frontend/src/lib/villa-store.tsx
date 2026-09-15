"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import type { VillaBooking, VillaCategory, VillaDraft, VillaFeature, VillaRegion } from "./villa";
import { emptyVillaDraft } from "./villa";
import type { VillaStatus } from "./villa-status";
import { notifySessionChange, useSessionValue, writeSession } from "./session-store";
import { addVillaCategory, addVillaFeature, addVillaRegion, syncVilla } from "./villas/publish";

/**
 * Villa kataloğu: KAYNAK VERİTABANI (`listTenantVillas` → `initialVillas`,
 * `loadVillaLibraries` → kütüphaneler), sekme yalnız kaydedilmemiş
 * düzenlemeleri tutar — `boat-store.tsx` ile aynı kalıp. Kimlikler UUID;
 * Kaydet / Devam / Yayınla / durum `syncVilla` ile tabloya yazar.
 * Kütüphane eklemeleri kimliği istemcide üretir, satırı sunucu açar.
 * Rezervasyonlar henüz sekmede.
 */

const KEY = "kontuar.villa.v1";

type Store = {
  villas: VillaDraft[];
  removedVillaIds?: string[];
  categories: VillaCategory[];
  regions: VillaRegion[];
  features: VillaFeature[];
  bookings: VillaBooking[];
};

type ArrayKey = "villas" | "categories" | "regions" | "features" | "bookings";

const SEED: Store = { villas: [], categories: [], regions: [], features: [], bookings: [] };

type VillaCatalogContext = {
  villas: VillaDraft[];
  categories: VillaCategory[];
  regions: VillaRegion[];
  features: VillaFeature[];
  bookings: VillaBooking[];

  createVilla: () => VillaDraft;
  updateVilla: (id: string, patch: Partial<VillaDraft>) => void;
  setVillaStatus: (id: string, status: VillaStatus) => void;
  saveVilla: (id: string) => Promise<{ ok: true; villaId: string } | { ok: false; error: string }>;
  removeVilla: (id: string) => void;
  restoreVilla: (villa: VillaDraft, index: number) => void;
  duplicateVilla: (id: string) => VillaDraft | null;

  addCategory: (category: Omit<VillaCategory, "id">) => VillaCategory;
  addRegion: (region: Omit<VillaRegion, "id">) => VillaRegion;
  addFeature: (feature: Omit<VillaFeature, "id">) => VillaFeature;

  createBooking: (booking: Omit<VillaBooking, "id" | "createdAt">) => VillaBooking;
  setBookingOperationStatus: (id: string, status: VillaBooking["operationStatus"]) => void;
};

const Ctx = createContext<VillaCatalogContext | null>(null);

function parse(raw: string | null): Store {
  if (!raw) return SEED;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.villas) && Array.isArray(parsed.regions)) {
      return parsed as Store;
    }
    return SEED;
  } catch {
    return SEED;
  }
}

function readRaw(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}${seq}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mergeById<T extends { id: string }>(fromDb: T[], local: T[], removed: string[] = []): T[] {
  const byId = new Map<string, T>();
  for (const x of fromDb) if (!removed.includes(x.id)) byId.set(x.id, x);
  for (const x of local) byId.set(x.id, x);
  return [...byId.values()];
}

export function VillaCatalogProvider({
  initialVillas = [],
  initialCategories = [],
  initialRegions = [],
  initialFeatures = [],
  children,
}: {
  initialVillas?: VillaDraft[];
  initialCategories?: VillaCategory[];
  initialRegions?: VillaRegion[];
  initialFeatures?: VillaFeature[];
  children: React.ReactNode;
}) {
  const raw = useSessionValue(KEY);
  const store = useMemo(() => {
    const local = parse(raw);
    return {
      ...local,
      villas: mergeById(initialVillas, local.villas, local.removedVillaIds).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      categories: mergeById(initialCategories, local.categories.filter((c) => UUID.test(c.id))),
      regions: mergeById(initialRegions, local.regions.filter((r) => UUID.test(r.id))),
      features: mergeById(initialFeatures, local.features.filter((f) => UUID.test(f.id))),
    };
  }, [raw, initialVillas, initialCategories, initialRegions, initialFeatures]);

  const commit = useCallback((next: Store) => {
    writeSession(KEY, JSON.stringify(next));
    notifySessionChange();
  }, []);

  // Eski "villa-xxx" kimlikli taslaklar bir kez UUID'ye taşınır ve yazılır.
  useEffect(() => {
    const current = parse(readRaw());
    if (!current.villas.some((v) => !UUID.test(v.id))) return;
    const migrated = current.villas.map((v) => (UUID.test(v.id) ? v : { ...v, id: crypto.randomUUID() }));
    commit({ ...current, villas: migrated });
    for (const v of migrated) void syncVilla(v);
  }, [commit]);

  const addLibraryEntry = useCallback(
    <K extends ArrayKey>(key: K, item: Omit<Store[K][number], "id">) => {
      const current = parse(readRaw());
      const created = { ...item, id: crypto.randomUUID() } as Store[K][number];
      commit({ ...current, [key]: [...current[key], created] });
      return created;
    },
    [commit],
  );

  const updateLibraryEntry = useCallback(
    <K extends ArrayKey>(key: K, id: string, patch: Partial<Store[K][number]>) => {
      const current = parse(readRaw());
      commit({ ...current, [key]: current[key].map((item) => (item.id === id ? { ...item, ...patch } : item)) });
    },
    [commit],
  );

  const createVilla = useCallback(() => {
    const now = new Date().toISOString();
    const villa = emptyVillaDraft(crypto.randomUUID(), now);
    const current = parse(readRaw());
    commit({ ...current, villas: [villa, ...current.villas] });
    void syncVilla(villa);
    return villa;
  }, [commit]);

  const updateVilla = useCallback(
    (id: string, patch: Partial<VillaDraft>) => {
      const current = parse(readRaw());
      if (!current.villas.some((v) => v.id === id)) {
        const fromDb = initialVillas.find((v) => v.id === id);
        if (fromDb) commit({ ...current, villas: [fromDb, ...current.villas] });
      }
      updateLibraryEntry("villas", id, { ...patch, updatedAt: new Date().toISOString() });
    },
    [updateLibraryEntry, commit, initialVillas],
  );

  const setVillaStatus = useCallback(
    (id: string, status: VillaStatus) => {
      updateVilla(id, { status });
      const villa = parse(readRaw()).villas.find((v) => v.id === id);
      if (villa) void syncVilla(villa);
    },
    [updateVilla],
  );

  const saveVilla = useCallback(async (id: string) => {
    const villa = parse(readRaw()).villas.find((v) => v.id === id) ?? initialVillas.find((v) => v.id === id);
    if (!villa) return { ok: false as const, error: "missing" };
    return syncVilla(villa);
  }, [initialVillas]);

  const removeVilla = useCallback(
    (id: string) => {
      const current = parse(readRaw());
      const villa = current.villas.find((v) => v.id === id) ?? initialVillas.find((v) => v.id === id);
      commit({ ...current, villas: current.villas.filter((v) => v.id !== id), removedVillaIds: [...(current.removedVillaIds ?? []), id] });
      // Sunucudaki kopya silinmez, arşivlenir.
      if (villa) void syncVilla({ ...villa, status: "arsivlendi" });
    },
    [commit, initialVillas],
  );

  const restoreVilla = useCallback(
    (villa: VillaDraft, index: number) => {
      const current = parse(readRaw());
      const next = [...current.villas];
      next.splice(Math.min(index, next.length), 0, villa);
      commit({ ...current, villas: next, removedVillaIds: (current.removedVillaIds ?? []).filter((x) => x !== villa.id) });
      void syncVilla(villa);
    },
    [commit],
  );

  const duplicateVilla = useCallback(
    (id: string) => {
      const current = parse(readRaw());
      const source = current.villas.find((v) => v.id === id) ?? initialVillas.find((v) => v.id === id);
      if (!source) return null;
      const now = new Date().toISOString();
      const copy: VillaDraft = { ...source, id: crypto.randomUUID(), status: "taslak", slug: source.slug ? `${source.slug}-kopya` : "", title: `${source.title} (kopya)`, createdAt: now, updatedAt: now };
      commit({ ...current, villas: [copy, ...current.villas] });
      void syncVilla(copy);
      return copy;
    },
    [commit, initialVillas],
  );

  const addCategory = useCallback(
    (category: Omit<VillaCategory, "id">) => {
      const created = addLibraryEntry("categories", category);
      void addVillaCategory(created.id, created.title);
      return created;
    },
    [addLibraryEntry],
  );
  const addRegion = useCallback(
    (region: Omit<VillaRegion, "id">) => {
      const created = addLibraryEntry("regions", region);
      void addVillaRegion(created.id, created.name);
      return created;
    },
    [addLibraryEntry],
  );
  const addFeature = useCallback(
    (feature: Omit<VillaFeature, "id">) => {
      const created = addLibraryEntry("features", feature);
      void addVillaFeature(created.id, created.name);
      return created;
    },
    [addLibraryEntry],
  );

  const createBooking = useCallback(
    (booking: Omit<VillaBooking, "id" | "createdAt">) => {
      const current = parse(readRaw());
      const created: VillaBooking = { ...booking, id: nextId("vrez"), createdAt: new Date().toISOString() };
      commit({ ...current, bookings: [created, ...current.bookings] });
      return created;
    },
    [commit],
  );
  const setBookingOperationStatus = useCallback(
    (id: string, status: VillaBooking["operationStatus"]) => updateLibraryEntry("bookings", id, { operationStatus: status }),
    [updateLibraryEntry],
  );

  const value = useMemo<VillaCatalogContext>(
    () => ({
      villas: store.villas,
      categories: store.categories,
      regions: store.regions,
      features: store.features,
      bookings: store.bookings,
      createVilla,
      updateVilla,
      setVillaStatus,
      saveVilla,
      removeVilla,
      restoreVilla,
      duplicateVilla,
      addCategory,
      addRegion,
      addFeature,
      createBooking,
      setBookingOperationStatus,
    }),
    [store, createVilla, updateVilla, setVillaStatus, saveVilla, removeVilla, restoreVilla, duplicateVilla, addCategory, addRegion, addFeature, createBooking, setBookingOperationStatus],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVillaCatalog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVillaCatalog, VillaCatalogProvider içinde çağrılmalı");
  return ctx;
}
