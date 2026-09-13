"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import type { BoatBooking, BoatCategory, BoatDraft, BoatExtra, BoatFeature, MarinaPoint } from "./boat";
import { emptyBoatDraft } from "./boat";
import type { BoatStatus } from "./boat-status";
import { notifySessionChange, useSessionValue, writeSession } from "./session-store";
import { syncBoat } from "./boats/publish";

/**
 * Tekne kataloğu: KAYNAK VERİTABANI (`listTenantBoats` → `initialBoats`),
 * sekme yalnız kaydedilmemiş düzenlemeleri tutar — `tour-store.tsx` ile
 * aynı kalıp. Kimlikler UUID; Kaydet / Devam / Yayınla / durum `syncBoat`
 * ile tabloya yazar. Kütüphaneler (marina, kategori, özellik, ekstra) ve
 * rezervasyonlar henüz sekmede.
 */

const KEY = "kontuar.tekne.v1";

type Store = {
  boats: BoatDraft[];
  marinaPoints: MarinaPoint[];
  categories: BoatCategory[];
  features: BoatFeature[];
  extras: BoatExtra[];
  bookings: BoatBooking[];
};

type ArrayKey = "boats" | "marinaPoints" | "categories" | "features" | "extras" | "bookings";

const SEED: Store = {
  boats: [],
  marinaPoints: [
    {
      id: "mp-bodrum-marina",
      name: "Bodrum Marina",
      address: "Bodrum, Muğla",
      description: "Ana yolcu iskelesi.",
    },
    {
      id: "mp-gocek-marina",
      name: "Göcek Marina",
      address: "Göcek, Fethiye",
      description: "D-Marin önü bekleme alanı.",
    },
  ],
  categories: [
    { id: "cat-yat", title: "Yat", slug: "yat" },
    { id: "cat-gulet", title: "Gulet", slug: "gulet" },
    { id: "cat-katamaran", title: "Katamaran", slug: "katamaran" },
  ],
  features: [
    { id: "bf-klima", name: "Klima" },
    { id: "bf-jenerator", name: "Jeneratör" },
  ],
  extras: [{ id: "be-catering", name: "Catering", price: 2_000_00, currency: "TRY", type: "perBooking" }],
  bookings: [],
};

type BoatCatalogContext = {
  boats: BoatDraft[];
  marinaPoints: MarinaPoint[];
  categories: BoatCategory[];
  features: BoatFeature[];
  extras: BoatExtra[];
  bookings: BoatBooking[];

  createBoat: () => BoatDraft;
  updateBoat: (id: string, patch: Partial<BoatDraft>) => void;
  setBoatStatus: (id: string, status: BoatStatus) => void;
  saveBoat: (id: string) => Promise<{ ok: true; boatId: string } | { ok: false; error: string }>;
  removeBoat: (id: string) => void;
  restoreBoat: (boat: BoatDraft, index: number) => void;
  duplicateBoat: (id: string) => BoatDraft | null;

  addMarinaPoint: (point: Omit<MarinaPoint, "id">) => MarinaPoint;
  addCategory: (category: Omit<BoatCategory, "id">) => BoatCategory;
  addFeature: (feature: Omit<BoatFeature, "id">) => BoatFeature;
  addExtra: (extra: Omit<BoatExtra, "id">) => BoatExtra;

  createBooking: (booking: Omit<BoatBooking, "id" | "createdAt">) => BoatBooking;
  setBookingOperationStatus: (id: string, status: BoatBooking["operationStatus"]) => void;
  setBookingDepositStatus: (id: string, status: BoatBooking["securityDepositStatus"]) => void;
};

const Ctx = createContext<BoatCatalogContext | null>(null);

function parse(raw: string | null): Store {
  if (!raw) return SEED;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.boats) && Array.isArray(parsed.marinaPoints)) {
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

/** DB listesi + sekme düzenlemeleri; aynı kimlikte sekme kazanır. */
function mergeBoats(fromDb: BoatDraft[], local: BoatDraft[]): BoatDraft[] {
  const byId = new Map<string, BoatDraft>();
  for (const b of fromDb) byId.set(b.id, b);
  for (const b of local) byId.set(b.id, b);
  return [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function BoatCatalogProvider({
  initialBoats = [],
  children,
}: {
  initialBoats?: BoatDraft[];
  children: React.ReactNode;
}) {
  const raw = useSessionValue(KEY);
  const store = useMemo(() => {
    const local = parse(raw);
    return { ...local, boats: mergeBoats(initialBoats, local.boats) };
  }, [raw, initialBoats]);

  const commit = useCallback((next: Store) => {
    writeSession(KEY, JSON.stringify(next));
    notifySessionChange();
  }, []);

  // Eski "tekne-xxx" kimlikli taslaklar bir kez UUID'ye taşınır ve yazılır.
  useEffect(() => {
    const current = parse(readRaw());
    if (!current.boats.some((b) => !UUID.test(b.id))) return;
    const migrated = current.boats.map((b) => (UUID.test(b.id) ? b : { ...b, id: crypto.randomUUID() }));
    commit({ ...current, boats: migrated });
    for (const b of migrated) void syncBoat(b);
  }, [commit]);

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

  const createBoat = useCallback(() => {
    const now = new Date().toISOString();
    const boat = emptyBoatDraft(crypto.randomUUID(), now);
    const current = parse(readRaw());
    commit({ ...current, boats: [boat, ...current.boats] });
    void syncBoat(boat);
    return boat;
  }, [commit]);

  const updateBoat = useCallback(
    (id: string, patch: Partial<BoatDraft>) => {
      const current = parse(readRaw());
      // Yalnız DB'den gelen tekne önce sekmeye kopyalanır, sonra yamalanır.
      if (!current.boats.some((b) => b.id === id)) {
        const fromDb = initialBoats.find((b) => b.id === id);
        if (fromDb) commit({ ...current, boats: [fromDb, ...current.boats] });
      }
      updateLibraryEntry("boats", id, { ...patch, updatedAt: new Date().toISOString() });
    },
    [updateLibraryEntry, commit, initialBoats],
  );

  const setBoatStatus = useCallback(
    (id: string, status: BoatStatus) => {
      updateBoat(id, { status });
      const boat = parse(readRaw()).boats.find((b) => b.id === id);
      if (boat) void syncBoat(boat);
    },
    [updateBoat],
  );

  const saveBoat = useCallback(async (id: string) => {
    const boat = parse(readRaw()).boats.find((b) => b.id === id);
    if (!boat) return { ok: false as const, error: "missing" };
    return syncBoat(boat);
  }, []);

  const removeBoat = useCallback(
    (id: string) => {
      const boat = parse(readRaw()).boats.find((b) => b.id === id);
      removeLibraryEntry("boats", id);
      // Sunucudaki kopya silinmez, arşivlenir.
      if (boat) void syncBoat({ ...boat, status: "arsivlendi" });
    },
    [removeLibraryEntry],
  );

  const restoreBoat = useCallback(
    (boat: BoatDraft, index: number) => {
      const current = parse(readRaw());
      const next = [...current.boats];
      next.splice(Math.min(index, next.length), 0, boat);
      commit({ ...current, boats: next });
    },
    [commit],
  );

  const duplicateBoat = useCallback(
    (id: string) => {
      const current = parse(readRaw());
      const source = current.boats.find((b) => b.id === id);
      if (!source) return null;
      const now = new Date().toISOString();
      const copy: BoatDraft = { ...source, id: crypto.randomUUID(), slug: source.slug ? `${source.slug}-kopya` : "", status: "taslak", title: `${source.title} (kopya)`, createdAt: now, updatedAt: now };
      commit({ ...current, boats: [copy, ...current.boats] });
      return copy;
    },
    [commit],
  );

  const addMarinaPoint = useCallback(
    (point: Omit<MarinaPoint, "id">) => addLibraryEntry("marinaPoints", "mp", point),
    [addLibraryEntry],
  );
  const addCategory = useCallback(
    (category: Omit<BoatCategory, "id">) => addLibraryEntry("categories", "cat", category),
    [addLibraryEntry],
  );
  const addFeature = useCallback(
    (feature: Omit<BoatFeature, "id">) => addLibraryEntry("features", "bf", feature),
    [addLibraryEntry],
  );
  const addExtra = useCallback(
    (extra: Omit<BoatExtra, "id">) => addLibraryEntry("extras", "be", extra),
    [addLibraryEntry],
  );

  const createBooking = useCallback(
    (booking: Omit<BoatBooking, "id" | "createdAt">) => {
      const current = parse(readRaw());
      const created: BoatBooking = { ...booking, id: nextId("trez"), createdAt: new Date().toISOString() };
      commit({ ...current, bookings: [created, ...current.bookings] });
      return created;
    },
    [commit],
  );
  const setBookingOperationStatus = useCallback(
    (id: string, status: BoatBooking["operationStatus"]) => updateLibraryEntry("bookings", id, { operationStatus: status }),
    [updateLibraryEntry],
  );
  const setBookingDepositStatus = useCallback(
    (id: string, status: BoatBooking["securityDepositStatus"]) =>
      updateLibraryEntry("bookings", id, { securityDepositStatus: status }),
    [updateLibraryEntry],
  );

  const value = useMemo<BoatCatalogContext>(
    () => ({
      boats: store.boats,
      marinaPoints: store.marinaPoints,
      categories: store.categories,
      features: store.features,
      extras: store.extras,
      bookings: store.bookings,
      createBoat,
      updateBoat,
      setBoatStatus,
      saveBoat,
      removeBoat,
      restoreBoat,
      duplicateBoat,
      addMarinaPoint,
      addCategory,
      addFeature,
      addExtra,
      createBooking,
      setBookingOperationStatus,
      setBookingDepositStatus,
    }),
    [
      store,
      createBoat,
      updateBoat,
      setBoatStatus,
      saveBoat,
      removeBoat,
      restoreBoat,
      duplicateBoat,
      addMarinaPoint,
      addCategory,
      addFeature,
      addExtra,
      createBooking,
      setBookingOperationStatus,
      setBookingDepositStatus,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBoatCatalog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBoatCatalog, BoatCatalogProvider içinde çağrılmalı");
  return ctx;
}
