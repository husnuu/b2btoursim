"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import type { MeetingPoint, TourCategory, TourDraft, TourExtra, TourTag } from "./tour";
import { emptyTourDraft } from "./tour";
import type { TourStatus } from "./tour-status";
import { notifySessionChange, useSessionValue, writeSession } from "./session-store";
import { syncTour } from "./tours/publish";

/**
 * Tur kataloğu: KAYNAK VERİTABANI, sekme yalnız kaydedilmemiş düzenlemeleri
 * tutar.
 *
 * Sunucu (`listTenantTours`) kiracının turlarını `initialTours` olarak
 * verir; sessionStorage'daki kopya aynı kimlikli turu geçici olarak
 * gölgeler (yazarken kaybolmasın). Kaydet / Devam / Yayınla / durum
 * değişikliği `syncTour` ile tabloya yazar. Kimlikler UUID: taslak ile
 * tablo satırı aynı kimliği taşır, eşleme gerekmez.
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
  saveTour: (id: string) => Promise<{ ok: true; tourId: string } | { ok: false; error: string }>;
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

/** Tur kimliği tablo kimliğidir: UUID. */
function newTourId(): string {
  return crypto.randomUUID();
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** DB listesi + sekme düzenlemeleri; aynı kimlikte sekme kazanır. */
function mergeTours(fromDb: TourDraft[], local: TourDraft[]): TourDraft[] {
  const byId = new Map<string, TourDraft>();
  for (const t of fromDb) byId.set(t.id, t);
  for (const t of local) byId.set(t.id, t);
  return [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function TourCatalogProvider({
  initialTours = [],
  children,
}: {
  initialTours?: TourDraft[];
  children: React.ReactNode;
}) {
  const raw = useSessionValue(KEY);
  const store = useMemo(() => {
    const local = parse(raw);
    return { ...local, tours: mergeTours(initialTours, local.tours) };
  }, [raw, initialTours]);

  const commit = useCallback((next: Store) => {
    writeSession(KEY, JSON.stringify(next));
    notifySessionChange();
  }, []);

  // Eski oturumlardan kalan "tur-xxx" kimlikli taslaklar bir kez UUID'ye
  // taşınır ve tabloya yazılır; aksi halde hiç senkronlanamazlardı.
  useEffect(() => {
    const current = parse(readRaw());
    if (!current.tours.some((tour) => !UUID.test(tour.id))) return;
    const migrated = current.tours.map((tour) =>
      UUID.test(tour.id) ? tour : { ...tour, id: newTourId() },
    );
    commit({ ...current, tours: migrated });
    for (const tour of migrated) void syncTour(tour);
  }, [commit]);

  const getTour = useCallback(
    (id: string) => store.tours.find((tour) => tour.id === id),
    [store],
  );

  const createTour = useCallback(() => {
    const now = new Date().toISOString();
    const draft = emptyTourDraft(newTourId(), now);
    const current = parse(readRaw());
    commit({ ...current, tours: [draft, ...current.tours] });
    // Taslak hemen tabloya: başka sekmede/origin'de de görünsün.
    void syncTour(draft);
    return draft;
  }, [commit]);

  const updateTour = useCallback(
    (id: string, patch: Partial<TourDraft>) => {
      const current = parse(readRaw());
      const now = new Date().toISOString();
      const inSession = current.tours.some((tour) => tour.id === id);
      // Tur yalnız DB'den geliyorsa önce sekmeye kopyalanır, sonra yamalanır.
      const base = inSession
        ? current.tours
        : (() => {
            const fromDb = initialTours.find((tour) => tour.id === id);
            return fromDb ? [fromDb, ...current.tours] : current.tours;
          })();
      commit({
        ...current,
        tours: base.map((tour) =>
          tour.id === id ? { ...tour, ...patch, updatedAt: now } : tour,
        ),
      });
    },
    [commit, initialTours],
  );

  const setStatus = useCallback(
    (id: string, status: TourStatus) => {
      updateTour(id, { status });
      // Durum değişikliği sunucuya da gider: vitrin `tour` tablosunu okur.
      // Sonuç beklenmez; Yayınla düğmesi (SummaryStep) hatayı ayrıca gösterir.
      const draft = parse(readRaw()).tours.find((tour) => tour.id === id);
      if (draft) void syncTour(draft);
    },
    [updateTour],
  );

  /** Sekmedeki güncel taslağı tabloya yazar (Kaydet / Devam Et). */
  const saveTour = useCallback(async (id: string) => {
    const draft = parse(readRaw()).tours.find((tour) => tour.id === id);
    if (!draft) return { ok: false as const, error: "missing" };
    return syncTour(draft);
  }, []);

  const removeTour = useCallback(
    (id: string) => {
      const current = parse(readRaw());
      const draft = current.tours.find((tour) => tour.id === id);
      commit({ ...current, tours: current.tours.filter((tour) => tour.id !== id) });
      // Sunucudaki kopya silinmez, arşivlenir: rezervasyon geçmişi ona bakabilir.
      if (draft?.slug) void syncTour({ ...draft, status: "arsivlendi" });
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
        id: newTourId(),
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
      saveTour,
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
      saveTour,
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
