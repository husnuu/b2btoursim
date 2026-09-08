import type { MessageKey } from "./i18n";
import type { StatusTone } from "./booking-status";
import type { TransferOperationStatus, VehicleStatus } from "./transfer";

/**
 * Araç durumu (Aktif/Pasif) basit bir hızlı-değiştirme anahtarıdır —
 * Tur/Rezervasyon durum makinelerindeki gibi geçiş grafiği gerekmez
 * (Bölüm 1.1: "Durum ... hızlı değiştirme dropdown'ı").
 *
 * Operasyon durumu (Bölüm 5.2) sırayla ilerler ama kullanıcı tarafından
 * serbestçe değiştirilebilir bir sahada iş akışıdır, bu yüzden burada da
 * katı bir `canTransition` yerine yalnızca görsel meta tutulur.
 */

export const VEHICLE_STATUS_META: Record<VehicleStatus, { label: MessageKey; tone: StatusTone; glyph: string }> = {
  aktif: { label: "transferVehicleStatus.aktif", tone: "success", glyph: "✓" },
  pasif: { label: "transferVehicleStatus.pasif", tone: "warning", glyph: "◑" },
};

export const OPERATION_STATUS_META: Record<
  TransferOperationStatus,
  { label: MessageKey; tone: StatusTone; glyph: string }
> = {
  planlamaBekliyor: { label: "transferOp.planlamaBekliyor", tone: "warning", glyph: "◐" },
  aktifTransfer: { label: "transferOp.aktifTransfer", tone: "success", glyph: "●" },
  tamamlandi: { label: "transferOp.tamamlandi", tone: "neutral", glyph: "◼" },
};
