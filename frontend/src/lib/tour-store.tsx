"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { MeetingPoint, TourCategory, TourDraft, TourExtra, TourTag } from "./tour";
import { emptyTourDraft } from "./tour";
import type { TourStatus } from "./tour-status";
import { notifySessionChange, useSessionValue, writeSession } from "./session-store";

/**
 * Tur kataloğu durumu, sepet gibi **sekme başına** sessionStorage'da tutulur
 * (bkz. `cart.tsx`). Backend bağlandığında bu dosya silinir, `tour.ts`
 * içindeki tipler kalır.
 */

const KEY = "kontuar.turlar.v1";

type TenantSettings = { alternateDisplayCurrency: string | null };

type Store = {
  tours: TourDraft[];
  meetingPoints: MeetingPoint[];
  categories: TourCategory[];
  tags: TourTag[];
  extras: TourExtra[];
  tenantSettings: TenantSettings;
};

type LibraryKey = "meetingPoints" | "categories" | "tags" | "extras";

/** Seçiciler boş görünmesin diye deterministik birkaç örnek (Bölüm 1.3). */
const SEED: Store = {
  tours: [],
  meetingPoints: [
    {
      id: "mp-goreme-otogar",
      name: "Göreme Otogarı",
      address: "Göreme Otogarı, 1 numaralı peron, Nevşehir",
      description: "Otogarın ana girişi, bilet gişelerinin önü.",
    },
    {
      id: "mp-balon-ofis",
      name: "Kapadokya Balon Ofisi",
      address: "Aydınlı Mah., Göreme, Nevşehir",
      description: "Ofis önündeki bekleme alanı.",
    },
  ],
  categories: [
    { id: "cat-gunubirlik-turlar", title: "Günübirlik Turlar", slug: "gunubirlik-turlar" },
    { id: "cat-macera", title: "Macera ve Doğa", slug: "macera-ve-doga" },
  ],
  tags: [
    { id: "tag-gun-dogumu", name: "Gün Doğumu" },
    { id: "tag-aile-dostu", name: "Aile Dostu" },
  ],
  extras: [
    { id: "extra-ogle-yemegi", name: "Öğle Yemeği", price: 350_00, currency: "TRY", type: "perPerson" },
    { id: "extra-fotograf-paketi", name: "Fotoğraf Paketi", price: 500_00, currency: "TRY", type: "perBooking" },
  ],
  tenantSettings: { alternateDisplayCurrency: null },
};

type TourCatalogContext = {
  tours: TourDraft[];
  meetingPoints: MeetingPoint[];
  categories: TourCategory[];
  tags: TourTag[];
  extras: TourExtra[];
  tenantSettings: TenantSettings;
  getTour: (id: string) => TourDraft | undefined;
  createTour: () => TourDraft;
  updateTour: (id: string, patch: Partial<TourDraft>) => void;
  setStatus: (id: string, status: TourStatus) => void;
  removeTour: (id: string) => void;
  restoreTour: (tour: TourDraft, index: number) => void;
  duplicateTour: (id: string) => TourDraft | null;
  addMeetingPoint: (point: Omit<MeetingPoint, "id">) => MeetingPoint;
  addTourCategory: (category: Omit<TourCategory, "id">) => TourCategory;
  addTourTag: (tag: Omit<TourTag, "id">) => TourTag;
  addTourExtra: (extra: Omit<TourExtra, "id">) => TourExtra;
  setAlternateDisplayCurrency: (currency: string | null) => void;
};

const Ctx = createContext<TourCatalogContext | null>(null);

function parse(raw: string | null): Store {
  if (!raw) return SEED;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.tours) &&
      Array.isArray(parsed.meetingPoints) &&
      Array.isArray(parsed.categories) &&
      Array.isArray(parsed.tags) &&
      Array.isArray(parsed.extras) &&
      parsed.tenantSettings
    ) {
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

export function TourCatalogProvider({ children }: { children: React.ReactNode }) {
  const raw = useSessionValue(KEY);
  const store = useMemo(() => parse(raw), [raw]);

  const commit = useCallback((next: Store) => {
    writeSession(KEY, JSON.stringify(next));
    notifySessionChange();
  }, []);

  const getTour = useCallback(
    (id: string) => parse(readRaw()).tours.find((tour) => tour.id === id),
    [],
  );

  const createTour = useCallback(() => {
    const now = new Date().toISOString();
    const draft = emptyTourDraft(nextId("tur"), now);
    const current = parse(readRaw());
    commit({ ...current, tours: [draft, ...current.tours] });
    return draft;
  }, [commit]);

  const updateTour = useCallback(
    (id: string, patch: Partial<TourDraft>) => {
      const current = parse(readRaw());
      const now = new Date().toISOString();
      commit({
        ...current,
        tours: current.tours.map((tour) =>
          tour.id === id ? { ...tour, ...patch, updatedAt: now } : tour,
        ),
      });
    },
    [commit],
  );

  const setStatus = useCallback(
    (id: string, status: TourStatus) => updateTour(id, { status }),
    [updateTour],
  );

  const removeTour = useCallback(
    (id: string) => {
      const current = parse(readRaw());
      commit({ ...current, tours: current.tours.filter((tour) => tour.id !== id) });
    },
    [commit],
  );

  const restoreTour = useCallback(
    (tour: TourDraft, index: number) => {
      const current = parse(readRaw());
      const next = [...current.tours];
      next.splice(Math.min(index, next.length), 0, tour);
      commit({ ...current, tours: next });
    },
    [commit],
  );

  const duplicateTour = useCallback(
    (id: string) => {
      const current = parse(readRaw());
      const source = current.tours.find((tour) => tour.id === id);
      if (!source) return null;
      const now = new Date().toISOString();
      const copy: TourDraft = {
        ...source,
        id: nextId("tur"),
        title: `${source.title} (kopya)`,
        slug: `${source.slug}-kopya`,
        status: "taslak",
        createdAt: now,
        updatedAt: now,
      };
      commit({ ...current, tours: [copy, ...current.tours] });
      return copy;
    },
    [commit],
  );

  const addLibraryEntry = useCallback(
    <K extends LibraryKey>(key: K, prefix: string, item: Omit<Store[K][number], "id">) => {
      const current = parse(readRaw());
      const created = { ...item, id: nextId(prefix) } as Store[K][number];
      commit({ ...current, [key]: [...current[key], created] });
      return created;
    },
    [commit],
  );

  const addMeetingPoint = useCallback(
    (point: Omit<MeetingPoint, "id">) => addLibraryEntry("meetingPoints", "mp", point),
    [addLibraryEntry],
  );
  const addTourCategory = useCallback(
    (category: Omit<TourCategory, "id">) => addLibraryEntry("categories", "cat", category),
    [addLibraryEntry],
  );
  const addTourTag = useCallback(
    (tag: Omit<TourTag, "id">) => addLibraryEntry("tags", "tag", tag),
    [addLibraryEntry],
  );
  const addTourExtra = useCallback(
    (extra: Omit<TourExtra, "id">) => addLibraryEntry("extras", "extra", extra),
    [addLibraryEntry],
  );

  const setAlternateDisplayCurrency = useCallback(
    (currency: string | null) => {
      const current = parse(readRaw());
      commit({ ...current, tenantSettings: { ...current.tenantSettings, alternateDisplayCurrency: currency } });
    },
    [commit],
  );

  const value = useMemo(
    () => ({
      tours: store.tours,
      meetingPoints: store.meetingPoints,
      categories: store.categories,
      tags: store.tags,
      extras: store.extras,
      tenantSettings: store.tenantSettings,
      getTour,
      createTour,
      updateTour,
      setStatus,
      removeTour,
      restoreTour,
      duplicateTour,
      addMeetingPoint,
      addTourCategory,
      addTourTag,
      addTourExtra,
      setAlternateDisplayCurrency,
    }),
    [
      store,
      getTour,
      createTour,
      updateTour,
      setStatus,
      removeTour,
      restoreTour,
      duplicateTour,
      addMeetingPoint,
      addTourCategory,
      addTourTag,
      addTourExtra,
      setAlternateDisplayCurrency,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTourCatalog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTourCatalog, TourCatalogProvider içinde çağrılmalı");
  return ctx;
}
