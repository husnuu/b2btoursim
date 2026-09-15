"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import type {
  KmFormula,
  MapZone,
  PointPriceRow,
  PopularRoute,
  RentalPoint,
  TimeMarginRule,
  TransferBooking,
  TransferPoint,
  TransferSettings,
  Vehicle,
  VehicleExtra,
  VehicleFeature,
  VehicleStatus,
  ZonePriceRow,
} from "./transfer";
import { emptyKmFormula, emptyVehicle } from "./transfer";
import type { TransferOperationStatus } from "./transfer";
import { notifySessionChange, useSessionValue, writeSession } from "./session-store";
import { syncTransferState, type SyncResult } from "./transfers/publish";
import { UUID, type TransferState } from "./transfers/state";

/**
 * Transfer kataloğu: KAYNAK VERİTABANI (`loadTransferState` → `initial`),
 * sekme yalnız kaydedilmemiş düzenlemeleri tutar. Her değişiklik yerelde
 * `dirty` işaretler ve gecikmeli `syncTransferState` (tam durum) çağırır;
 * başarılı yazımda işaret kalkar. Sekme temizse açılışta tablo kazanır.
 * Rezervasyonlar henüz sekmede.
 */

const KEY = "kontuar.transfer.v2";
const SYNC_DELAY_MS = 800;

type Store = TransferState & {
  bookings: TransferBooking[];
  /** Tabloya yazılmamış değişiklik var. */
  dirty?: boolean;
};

type ArrayKey =
  | "vehicles"
  | "points"
  | "priceMatrix"
  | "popularRoutes"
  | "marginRules"
  | "mapZones"
  | "zonePriceMatrix"
  | "rentalPoints"
  | "bookings"
  | "features"
  | "extras";

const SEED: Store = {
  vehicles: [],
  points: [],
  priceMatrix: [],
  popularRoutes: [],
  marginRules: [],
  mapZones: [],
  zonePriceMatrix: [],
  kmFormula: emptyKmFormula(),
  rentalPoints: [],
  bookings: [],
  features: [],
  extras: [],
  settings: {
    defaultCurrency: "TRY",
    tabVisibility: { noktaIleAracKiralama: false },
    bookingApprovalMode: "otomatik",
    cancellationTemplate: "orta",
  },
};

type TransferCatalogContext = {
  vehicles: Vehicle[];
  points: TransferPoint[];
  priceMatrix: PointPriceRow[];
  popularRoutes: PopularRoute[];
  marginRules: TimeMarginRule[];
  mapZones: MapZone[];
  zonePriceMatrix: ZonePriceRow[];
  kmFormula: KmFormula;
  rentalPoints: RentalPoint[];
  bookings: TransferBooking[];
  features: VehicleFeature[];
  extras: VehicleExtra[];
  settings: TransferSettings;

  createVehicle: () => Vehicle;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void;
  setVehicleStatus: (id: string, status: VehicleStatus) => void;
  removeVehicle: (id: string) => void;
  restoreVehicle: (vehicle: Vehicle, index: number) => void;
  duplicateVehicle: (id: string) => Vehicle | null;

  addPoint: (point: Omit<TransferPoint, "id">) => TransferPoint;
  removePoint: (id: string) => void;
  addFeature: (feature: Omit<VehicleFeature, "id">) => VehicleFeature;
  addExtra: (extra: Omit<VehicleExtra, "id">) => VehicleExtra;

  setPointPrice: (row: Omit<PointPriceRow, "id">) => void;
  removePointPrice: (id: string) => void;

  addPopularRoute: (route: Omit<PopularRoute, "id">) => PopularRoute;
  updatePopularRoute: (id: string, patch: Partial<PopularRoute>) => void;
  removePopularRoute: (id: string) => void;

  addMarginRule: (rule: Omit<TimeMarginRule, "id">) => TimeMarginRule;
  updateMarginRule: (id: string, patch: Partial<TimeMarginRule>) => void;
  removeMarginRule: (id: string) => void;

  addMapZone: (zone: Omit<MapZone, "id">) => MapZone;
  removeMapZone: (id: string) => void;
  setZonePrice: (row: Omit<ZonePriceRow, "id">) => void;
  removeZonePrice: (id: string) => void;
  updateKmFormula: (patch: Partial<KmFormula>) => void;

  addRentalPoint: (point: Omit<RentalPoint, "id">) => RentalPoint;
  removeRentalPoint: (id: string) => void;

  createBooking: (booking: Omit<TransferBooking, "id" | "createdAt">) => TransferBooking;
  setBookingOperationStatus: (id: string, status: TransferOperationStatus) => void;
  updateBookingAssignment: (id: string, driverName: string, driverNote: string) => void;

  updateSettings: (patch: Partial<TransferSettings>) => void;

  /** Bekleyen değişiklikleri hemen tabloya yazar. */
  flush: () => Promise<SyncResult>;
  /** Tabloya yazılmamış değişiklik var mı. */
  dirty: boolean;
};

const Ctx = createContext<TransferCatalogContext | null>(null);

function parse(raw: string | null, fallback: Store = SEED): Store {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.vehicles) && Array.isArray(parsed.points) && parsed.settings) {
      return parsed as Store;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/** Sunucu durumu + sekmedeki rezervasyonlar. */
function fromInitial(initial: TransferState | null, bookings: TransferBooking[] = []): Store {
  return initial ? { ...initial, bookings, dirty: false } : { ...SEED, bookings };
}

const LEGACY_KEY = "kontuar.transfer.v1";

/** v1 (sekme kimlikli) depo bir kez UUID'ye taşınır; tüm referanslar yeniden bağlanır. */
function migrateLegacy(): Store | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(LEGACY_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  const old = parse(raw);
  const map = new Map<string, string>();
  const re = (id: string | null): string | null => {
    if (id == null) return null;
    if (UUID.test(id)) return id;
    if (!map.has(id)) map.set(id, crypto.randomUUID());
    return map.get(id)!;
  };
  const rid = (id: string) => re(id)!;
  const next: Store = {
    ...old,
    vehicles: old.vehicles.map((v) => ({ ...v, id: rid(v.id), featureIds: v.featureIds.map(rid), extraLinks: v.extraLinks.map((l) => ({ ...l, extraId: rid(l.extraId) })) })),
    points: old.points.map((p) => ({ ...p, id: rid(p.id) })),
    priceMatrix: old.priceMatrix.map((r) => ({ ...r, id: rid(r.id), fromPointId: rid(r.fromPointId), toPointId: rid(r.toPointId) })),
    popularRoutes: old.popularRoutes.map((r) => ({ ...r, id: rid(r.id), startId: re(r.startId), endId: re(r.endId), vehicleIds: r.vehicleIds.map(rid) })),
    marginRules: old.marginRules.map((r) => ({ ...r, id: rid(r.id), startLocationId: re(r.startLocationId), endLocationId: re(r.endLocationId), vehicleIds: r.vehicleIds.map(rid) })),
    mapZones: old.mapZones.map((z) => ({ ...z, id: rid(z.id) })),
    zonePriceMatrix: old.zonePriceMatrix.map((r) => ({ ...r, id: rid(r.id), fromZoneId: rid(r.fromZoneId), toZoneId: rid(r.toZoneId) })),
    rentalPoints: old.rentalPoints.map((p) => ({ ...p, id: rid(p.id) })),
    features: old.features.map((f) => ({ ...f, id: rid(f.id) })),
    extras: old.extras.map((e) => ({ ...e, id: rid(e.id) })),
    bookings: old.bookings.map((b) => ({ ...b, vehicleId: rid(b.vehicleId) })),
    dirty: true,
  };
  try {
    sessionStorage.removeItem(LEGACY_KEY);
  } catch {
    /* yoksay */
  }
  return next;
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

export function TransferCatalogProvider({ initial = null, children }: { initial?: TransferState | null; children: React.ReactNode }) {
  const raw = useSessionValue(KEY);
  const base = useMemo(() => fromInitial(initial), [initial]);
  const store = useMemo(() => parse(raw, base), [raw, base]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Promise<SyncResult> | null>(null);

  const read = useCallback(() => parse(readRaw(), base), [base]);

  const push = useCallback(async (): Promise<SyncResult> => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const current = parse(readRaw(), base);
    const { bookings: _bookings, dirty: _dirty, ...state } = current;
    void _bookings;
    void _dirty;
    const run = syncTransferState(state).then((res) => {
      if (res.ok) {
        const latest = parse(readRaw(), base);
        // Yazım sırasında yeni değişiklik olduysa işaret kalır.
        if (JSON.stringify({ ...latest, bookings: [], dirty: false }) === JSON.stringify({ ...current, bookings: [], dirty: false })) {
          writeSession(KEY, JSON.stringify({ ...latest, dirty: false }));
          notifySessionChange();
        }
      }
      return res;
    });
    pending.current = run;
    return run;
  }, [base]);

  const commit = useCallback(
    (next: Store) => {
      writeSession(KEY, JSON.stringify({ ...next, dirty: true }));
      notifySessionChange();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void push(), SYNC_DELAY_MS);
    },
    [push],
  );

  // Açılış: eski depo taşınır; sekme temizse tablo kazanır.
  useEffect(() => {
    const legacy = migrateLegacy();
    if (legacy) {
      commit({ ...legacy, bookings: legacy.bookings });
      return;
    }
    const local = parse(readRaw(), base);
    if (!local.dirty) {
      writeSession(KEY, JSON.stringify(fromInitial(initial, local.bookings)));
      notifySessionChange();
    }
  }, [initial, base, commit]);

  const flush = useCallback(() => push(), [push]);

  const addLibraryEntry = useCallback(
    <K extends ArrayKey>(key: K, _prefix: string, item: Omit<Store[K][number], "id">) => {
      const current = read();
      const created = { ...item, id: crypto.randomUUID() } as Store[K][number];
      commit({ ...current, [key]: [...current[key], created] });
      return created;
    },
    [commit, read],
  );

  const updateLibraryEntry = useCallback(
    <K extends ArrayKey>(key: K, id: string, patch: Partial<Store[K][number]>) => {
      const current = read();
      commit({
        ...current,
        [key]: current[key].map((item) => (item.id === id ? { ...item, ...patch } : item)),
      });
    },
    [commit, read],
  );

  const removeLibraryEntry = useCallback(
    <K extends ArrayKey>(key: K, id: string) => {
      const current = read();
      commit({ ...current, [key]: current[key].filter((item) => item.id !== id) });
    },
    [commit, read],
  );

  const createVehicle = useCallback(() => {
    const now = new Date().toISOString();
    const vehicle = emptyVehicle(crypto.randomUUID(), now);
    const current = read();
    commit({ ...current, vehicles: [vehicle, ...current.vehicles] });
    return vehicle;
  }, [commit, read]);

  const updateVehicle = useCallback(
    (id: string, patch: Partial<Vehicle>) => {
      const now = new Date().toISOString();
      updateLibraryEntry("vehicles", id, { ...patch, updatedAt: now });
    },
    [updateLibraryEntry],
  );

  const setVehicleStatus = useCallback(
    (id: string, status: VehicleStatus) => updateVehicle(id, { status }),
    [updateVehicle],
  );

  const removeVehicle = useCallback((id: string) => removeLibraryEntry("vehicles", id), [removeLibraryEntry]);

  const restoreVehicle = useCallback(
    (vehicle: Vehicle, index: number) => {
      const current = read();
      const next = [...current.vehicles];
      next.splice(Math.min(index, next.length), 0, vehicle);
      commit({ ...current, vehicles: next });
    },
    [commit, read],
  );

  const duplicateVehicle = useCallback(
    (id: string) => {
      const current = read();
      const source = current.vehicles.find((v) => v.id === id);
      if (!source) return null;
      const now = new Date().toISOString();
      const copy: Vehicle = {
        ...source,
        id: crypto.randomUUID(),
        title: `${source.title} (kopya)`,
        createdAt: now,
        updatedAt: now,
      };
      commit({ ...current, vehicles: [copy, ...current.vehicles] });
      return copy;
    },
    [commit, read],
  );

  const addPoint = useCallback(
    (point: Omit<TransferPoint, "id">) => addLibraryEntry("points", "tp", point),
    [addLibraryEntry],
  );
  const removePoint = useCallback((id: string) => removeLibraryEntry("points", id), [removeLibraryEntry]);
  const addFeature = useCallback(
    (feature: Omit<VehicleFeature, "id">) => addLibraryEntry("features", "vf", feature),
    [addLibraryEntry],
  );
  const addExtra = useCallback(
    (extra: Omit<VehicleExtra, "id">) => addLibraryEntry("extras", "ve", extra),
    [addLibraryEntry],
  );

  const setPointPrice = useCallback(
    (row: Omit<PointPriceRow, "id">) => {
      const current = read();
      const existing = current.priceMatrix.find(
        (r) => r.fromPointId === row.fromPointId && r.toPointId === row.toPointId && r.vehicleType === row.vehicleType,
      );
      const next = existing
        ? current.priceMatrix.map((r) => (r.id === existing.id ? { ...r, ...row } : r))
        : [...current.priceMatrix, { ...row, id: crypto.randomUUID() }];
      commit({ ...current, priceMatrix: next });
    },
    [commit, read],
  );
  const removePointPrice = useCallback((id: string) => removeLibraryEntry("priceMatrix", id), [removeLibraryEntry]);

  const addPopularRoute = useCallback(
    (route: Omit<PopularRoute, "id">) => addLibraryEntry("popularRoutes", "route", route),
    [addLibraryEntry],
  );
  const updatePopularRoute = useCallback(
    (id: string, patch: Partial<PopularRoute>) => updateLibraryEntry("popularRoutes", id, patch),
    [updateLibraryEntry],
  );
  const removePopularRoute = useCallback(
    (id: string) => removeLibraryEntry("popularRoutes", id),
    [removeLibraryEntry],
  );

  const addMarginRule = useCallback(
    (rule: Omit<TimeMarginRule, "id">) => addLibraryEntry("marginRules", "margin", rule),
    [addLibraryEntry],
  );
  const updateMarginRule = useCallback(
    (id: string, patch: Partial<TimeMarginRule>) => updateLibraryEntry("marginRules", id, patch),
    [updateLibraryEntry],
  );
  const removeMarginRule = useCallback(
    (id: string) => removeLibraryEntry("marginRules", id),
    [removeLibraryEntry],
  );

  const addMapZone = useCallback(
    (zone: Omit<MapZone, "id">) => addLibraryEntry("mapZones", "zone", zone),
    [addLibraryEntry],
  );
  const removeMapZone = useCallback((id: string) => removeLibraryEntry("mapZones", id), [removeLibraryEntry]);

  const setZonePrice = useCallback(
    (row: Omit<ZonePriceRow, "id">) => {
      const current = read();
      const existing = current.zonePriceMatrix.find(
        (r) => r.fromZoneId === row.fromZoneId && r.toZoneId === row.toZoneId && r.vehicleType === row.vehicleType,
      );
      const next = existing
        ? current.zonePriceMatrix.map((r) => (r.id === existing.id ? { ...r, ...row } : r))
        : [...current.zonePriceMatrix, { ...row, id: crypto.randomUUID() }];
      commit({ ...current, zonePriceMatrix: next });
    },
    [commit, read],
  );
  const removeZonePrice = useCallback(
    (id: string) => removeLibraryEntry("zonePriceMatrix", id),
    [removeLibraryEntry],
  );

  const updateKmFormula = useCallback(
    (patch: Partial<KmFormula>) => {
      const current = read();
      commit({ ...current, kmFormula: { ...current.kmFormula, ...patch } });
    },
    [commit, read],
  );

  const addRentalPoint = useCallback(
    (point: Omit<RentalPoint, "id">) => addLibraryEntry("rentalPoints", "rp", point),
    [addLibraryEntry],
  );
  const removeRentalPoint = useCallback(
    (id: string) => removeLibraryEntry("rentalPoints", id),
    [removeLibraryEntry],
  );

  const createBooking = useCallback(
    (booking: Omit<TransferBooking, "id" | "createdAt">) => {
      const current = read();
      const created: TransferBooking = { ...booking, id: nextId("rez"), createdAt: new Date().toISOString() };
      commit({ ...current, bookings: [created, ...current.bookings] });
      return created;
    },
    [commit, read],
  );
  const setBookingOperationStatus = useCallback(
    (id: string, status: TransferOperationStatus) => updateLibraryEntry("bookings", id, { operationStatus: status }),
    [updateLibraryEntry],
  );
  const updateBookingAssignment = useCallback(
    (id: string, driverName: string, driverNote: string) =>
      updateLibraryEntry("bookings", id, { assignedDriverName: driverName, assignedDriverNote: driverNote }),
    [updateLibraryEntry],
  );

  const updateSettings = useCallback(
    (patch: Partial<TransferSettings>) => {
      const current = read();
      commit({ ...current, settings: { ...current.settings, ...patch } });
    },
    [commit, read],
  );

  const value = useMemo<TransferCatalogContext>(
    () => ({
      vehicles: store.vehicles,
      points: store.points,
      priceMatrix: store.priceMatrix,
      popularRoutes: store.popularRoutes,
      marginRules: store.marginRules,
      mapZones: store.mapZones,
      zonePriceMatrix: store.zonePriceMatrix,
      kmFormula: store.kmFormula,
      rentalPoints: store.rentalPoints,
      bookings: store.bookings,
      features: store.features,
      extras: store.extras,
      settings: store.settings,
      createVehicle,
      updateVehicle,
      setVehicleStatus,
      removeVehicle,
      restoreVehicle,
      duplicateVehicle,
      addPoint,
      removePoint,
      addFeature,
      addExtra,
      setPointPrice,
      removePointPrice,
      addPopularRoute,
      updatePopularRoute,
      removePopularRoute,
      addMarginRule,
      updateMarginRule,
      removeMarginRule,
      addMapZone,
      removeMapZone,
      setZonePrice,
      removeZonePrice,
      updateKmFormula,
      addRentalPoint,
      removeRentalPoint,
      createBooking,
      setBookingOperationStatus,
      updateBookingAssignment,
      updateSettings,
      flush,
      dirty: !!store.dirty,
    }),
    [
      store,
      flush,
      createVehicle,
      updateVehicle,
      setVehicleStatus,
      removeVehicle,
      restoreVehicle,
      duplicateVehicle,
      addPoint,
      removePoint,
      addFeature,
      addExtra,
      setPointPrice,
      removePointPrice,
      addPopularRoute,
      updatePopularRoute,
      removePopularRoute,
      addMarginRule,
      updateMarginRule,
      removeMarginRule,
      addMapZone,
      removeMapZone,
      setZonePrice,
      removeZonePrice,
      updateKmFormula,
      addRentalPoint,
      removeRentalPoint,
      createBooking,
      setBookingOperationStatus,
      updateBookingAssignment,
      updateSettings,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTransferCatalog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTransferCatalog, TransferCatalogProvider içinde çağrılmalı");
  return ctx;
}
