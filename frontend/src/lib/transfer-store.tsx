"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
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

/**
 * Transfer kataloğu, Tur kataloğuyla aynı desende (bkz. `tour-store.tsx`)
 * sekme başına sessionStorage'da tutulur. Backend bağlandığında bu dosya
 * silinir, `transfer.ts` içindeki tipler kalır.
 */

const KEY = "kontuar.transfer.v1";

type Store = {
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
  points: [
    {
      id: "tp-havalimani",
      name: "Kayseri Havalimanı",
      address: "Kayseri Erkilet Havalimanı",
      description: "Dış hatlar terminali çıkışı.",
    },
    {
      id: "tp-goreme-merkez",
      name: "Göreme Merkez",
      address: "Göreme, Nevşehir",
      description: "Otel bölgesi ve merkez.",
    },
  ],
  priceMatrix: [],
  popularRoutes: [],
  marginRules: [],
  mapZones: [],
  zonePriceMatrix: [],
  kmFormula: emptyKmFormula(),
  rentalPoints: [],
  bookings: [],
  features: [
    { id: "vf-klima", name: "Klima" },
    { id: "vf-wifi", name: "Wi-Fi" },
  ],
  extras: [{ id: "ve-bebek-koltugu", name: "Bebek Koltuğu", price: 150_00, currency: "TRY", type: "perBooking" }],
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
};

const Ctx = createContext<TransferCatalogContext | null>(null);

function parse(raw: string | null): Store {
  if (!raw) return SEED;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.vehicles) && Array.isArray(parsed.points) && parsed.settings) {
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

export function TransferCatalogProvider({ children }: { children: React.ReactNode }) {
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
      commit({
        ...current,
        [key]: current[key].map((item) => (item.id === id ? { ...item, ...patch } : item)),
      });
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

  const createVehicle = useCallback(() => {
    const now = new Date().toISOString();
    const vehicle = emptyVehicle(nextId("arac"), now);
    const current = parse(readRaw());
    commit({ ...current, vehicles: [vehicle, ...current.vehicles] });
    return vehicle;
  }, [commit]);

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
      const current = parse(readRaw());
      const next = [...current.vehicles];
      next.splice(Math.min(index, next.length), 0, vehicle);
      commit({ ...current, vehicles: next });
    },
    [commit],
  );

  const duplicateVehicle = useCallback(
    (id: string) => {
      const current = parse(readRaw());
      const source = current.vehicles.find((v) => v.id === id);
      if (!source) return null;
      const now = new Date().toISOString();
      const copy: Vehicle = {
        ...source,
        id: nextId("arac"),
        title: `${source.title} (kopya)`,
        createdAt: now,
        updatedAt: now,
      };
      commit({ ...current, vehicles: [copy, ...current.vehicles] });
      return copy;
    },
    [commit],
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
      const current = parse(readRaw());
      const existing = current.priceMatrix.find(
        (r) => r.fromPointId === row.fromPointId && r.toPointId === row.toPointId && r.vehicleType === row.vehicleType,
      );
      const next = existing
        ? current.priceMatrix.map((r) => (r.id === existing.id ? { ...r, ...row } : r))
        : [...current.priceMatrix, { ...row, id: nextId("ppr") }];
      commit({ ...current, priceMatrix: next });
    },
    [commit],
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
      const current = parse(readRaw());
      const existing = current.zonePriceMatrix.find(
        (r) => r.fromZoneId === row.fromZoneId && r.toZoneId === row.toZoneId && r.vehicleType === row.vehicleType,
      );
      const next = existing
        ? current.zonePriceMatrix.map((r) => (r.id === existing.id ? { ...r, ...row } : r))
        : [...current.zonePriceMatrix, { ...row, id: nextId("zpr") }];
      commit({ ...current, zonePriceMatrix: next });
    },
    [commit],
  );
  const removeZonePrice = useCallback(
    (id: string) => removeLibraryEntry("zonePriceMatrix", id),
    [removeLibraryEntry],
  );

  const updateKmFormula = useCallback(
    (patch: Partial<KmFormula>) => {
      const current = parse(readRaw());
      commit({ ...current, kmFormula: { ...current.kmFormula, ...patch } });
    },
    [commit],
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
      const current = parse(readRaw());
      const created: TransferBooking = { ...booking, id: nextId("rez"), createdAt: new Date().toISOString() };
      commit({ ...current, bookings: [created, ...current.bookings] });
      return created;
    },
    [commit],
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
      const current = parse(readRaw());
      commit({ ...current, settings: { ...current.settings, ...patch } });
    },
    [commit],
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
    }),
    [
      store,
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
