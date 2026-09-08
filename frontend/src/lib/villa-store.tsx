"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { VillaBooking, VillaCategory, VillaDraft, VillaFeature, VillaRegion } from "./villa";
import { emptyVillaDraft } from "./villa";
import type { VillaStatus } from "./villa-status";
import { notifySessionChange, useSessionValue, writeSession } from "./session-store";

/** Villa kataloğu — `boat-store.tsx`/`tour-store.tsx` ile aynı desende sessionStorage'a yazar. */

const KEY = "kontuar.villa.v1";

type Store = {
  villas: VillaDraft[];
  categories: VillaCategory[];
  regions: VillaRegion[];
  features: VillaFeature[];
  bookings: VillaBooking[];
};

type ArrayKey = "villas" | "categories" | "regions" | "features" | "bookings";

const SEED: Store = {
  villas: [],
  categories: [
    { id: "vc-luks", title: "Lüks Villa" },
    { id: "vc-aile", title: "Aile Villası" },
  ],
  regions: [
    { id: "vr-kalkan-merkez", name: "Kalkan Merkez" },
    { id: "vr-kas-sahil", name: "Kaş Sahil" },
  ],
  features: [
    { id: "vf-havuz", name: "Havuz" },
    { id: "vf-klima", name: "Klima" },
  ],
  bookings: [],
};

type VillaCatalogContext = {
  villas: VillaDraft[];
  categories: VillaCategory[];
  regions: VillaRegion[];
  features: VillaFeature[];
  bookings: VillaBooking[];

  createVilla: () => VillaDraft;
  updateVilla: (id: string, patch: Partial<VillaDraft>) => void;
  setVillaStatus: (id: string, status: VillaStatus) => void;
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

export function VillaCatalogProvider({ children }: { children: React.ReactNode }) {
  const raw = useSessionValue(KEY);
  const store = useMemo(() => parse(raw), [raw]);

  const commit = useCallback((next: Store) => {
    writeSession(KEY, JSON.stringify(next));
    notifySessionChange();
  }, []);

  const addLibraryEntry = useCallback(
    <K extends ArrayKey>(key: K, prefix: string, item: Omit<Store[K][number], "id">) => {
      const current = parse(readRaw());
      const created = { ...item, id: nextId(prefix) } as Store[K][number];
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

  const removeLibraryEntry = useCallback(
    <K extends ArrayKey>(key: K, id: string) => {
      const current = parse(readRaw());
      commit({ ...current, [key]: current[key].filter((item) => item.id !== id) });
    },
    [commit],
  );

  const createVilla = useCallback(() => {
    const now = new Date().toISOString();
    const villa = emptyVillaDraft(nextId("villa"), now);
    const current = parse(readRaw());
    commit({ ...current, villas: [villa, ...current.villas] });
    return villa;
  }, [commit]);

  const updateVilla = useCallback(
    (id: string, patch: Partial<VillaDraft>) => updateLibraryEntry("villas", id, { ...patch, updatedAt: new Date().toISOString() }),
    [updateLibraryEntry],
  );

  const setVillaStatus = useCallback((id: string, status: VillaStatus) => updateVilla(id, { status }), [updateVilla]);
  const removeVilla = useCallback((id: string) => removeLibraryEntry("villas", id), [removeLibraryEntry]);

  const restoreVilla = useCallback(
    (villa: VillaDraft, index: number) => {
      const current = parse(readRaw());
      const next = [...current.villas];
      next.splice(Math.min(index, next.length), 0, villa);
      commit({ ...current, villas: next });
    },
    [commit],
  );

  const duplicateVilla = useCallback(
    (id: string) => {
      const current = parse(readRaw());
      const source = current.villas.find((v) => v.id === id);
      if (!source) return null;
      const now = new Date().toISOString();
      const copy: VillaDraft = { ...source, id: nextId("villa"), title: `${source.title} (kopya)`, createdAt: now, updatedAt: now };
      commit({ ...current, villas: [copy, ...current.villas] });
      return copy;
    },
    [commit],
  );

  const addCategory = useCallback(
    (category: Omit<VillaCategory, "id">) => addLibraryEntry("categories", "vc", category),
    [addLibraryEntry],
  );
  const addRegion = useCallback(
    (region: Omit<VillaRegion, "id">) => addLibraryEntry("regions", "vr", region),
    [addLibraryEntry],
  );
  const addFeature = useCallback(
    (feature: Omit<VillaFeature, "id">) => addLibraryEntry("features", "vf", feature),
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
      removeVilla,
      restoreVilla,
      duplicateVilla,
      addCategory,
      addRegion,
      addFeature,
      createBooking,
      setBookingOperationStatus,
    }),
    [
      store,
      createVilla,
      updateVilla,
      setVillaStatus,
      removeVilla,
      restoreVilla,
      duplicateVilla,
      addCategory,
      addRegion,
      addFeature,
      createBooking,
      setBookingOperationStatus,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVillaCatalog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVillaCatalog, VillaCatalogProvider içinde çağrılmalı");
  return ctx;
}
