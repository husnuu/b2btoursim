import type {
  KmFormula, MapZone, PointPriceRow, PopularRoute, RentalPoint, TimeMarginRule, TransferPoint,
  TransferSettings, Vehicle, VehicleExtra, VehicleFeature, ZonePriceRow,
} from "@/lib/transfer";

/**
 * Transfer modülünün tabloya yazılan kısmı — rezervasyonlar hariç. Depo
 * (`transfer-store.tsx`) bu şekli tutar; `loadTransferState` okur,
 * `syncTransferState` yazar (tam durum: eksik satır silinir).
 */
export type TransferState = {
  vehicles: Vehicle[];
  points: TransferPoint[];
  priceMatrix: PointPriceRow[];
  popularRoutes: PopularRoute[];
  marginRules: TimeMarginRule[];
  mapZones: MapZone[];
  zonePriceMatrix: ZonePriceRow[];
  kmFormula: KmFormula;
  rentalPoints: RentalPoint[];
  features: VehicleFeature[];
  extras: VehicleExtra[];
  settings: TransferSettings;
};

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
