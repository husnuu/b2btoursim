"use client";

import { useState } from "react";
import { SelectField } from "@/components/primitives/Field";
import { formatMoney } from "@/lib/i18n";
import { findPointPrice, type VehicleType } from "@/lib/transfer";
import { useTransferCatalog } from "@/lib/transfer-store";

/**
 * 2.2 Araç Nokta Fiyatlandırma — N×N fiyat matrisi (Mimari Not). UI,
 * yalnızca seçilen "nereden" noktasının satırlarını gösterip
 * karmaşıklığı gizler.
 */
export function PriceMatrixEditor() {
  const { points, priceMatrix, setPointPrice, settings } = useTransferCatalog();
  const [fromPointId, setFromPointId] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("private");

  const destinations = points.filter((p) => p.id !== fromPointId);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="Fiyatlandırmak istediğiniz noktayı seçin" value={fromPointId} onChange={(e) => setFromPointId(e.target.value)}>
          <option value="">Seçilmedi</option>
          {points.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Fiyatlandırmak istediğiniz tipi seçin" value={vehicleType} onChange={(e) => setVehicleType(e.target.value as VehicleType)}>
          <option value="private">Private</option>
          <option value="shuttle">Shuttle</option>
        </SelectField>
      </div>

      {!fromPointId ? (
        <p className="text-[length:var(--font-ui-sm)] text-ink-3">
          Önce bir başlangıç noktası seçin; kütüphanedeki diğer noktalara olan tarifeler burada listelenir.
        </p>
      ) : destinations.length === 0 ? (
        <p className="text-[length:var(--font-ui-sm)] text-ink-3">
          Fiyatlandırılacak başka nokta yok — önce Araç Noktaları&apos;na en az iki nokta ekleyin.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {destinations.map((to) => {
            const row = findPointPrice(priceMatrix, fromPointId, to.id, vehicleType);
            return (
              <div key={to.id} className="grid grid-cols-[1fr_8rem] items-center gap-3 rounded-[var(--radius)] border border-line px-3 py-2">
                <span className="truncate text-[length:var(--font-ui)] text-ink">
                  {points.find((p) => p.id === fromPointId)?.name} → {to.name}
                </span>
                <input
                  type="number"
                  min={0}
                  defaultValue={row ? row.price / 100 : ""}
                  placeholder="Fiyat"
                  onBlur={(e) => {
                    const value = Number(e.target.value);
                    if (!e.target.value || Number.isNaN(value)) return;
                    setPointPrice({
                      fromPointId,
                      toPointId: to.id,
                      vehicleType,
                      price: Math.round(value * 100),
                      currency: settings.defaultCurrency,
                    });
                  }}
                  className="tnum h-8 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 text-end
                             text-[length:var(--font-ui-sm)] text-ink outline-none focus:border-action"
                />
              </div>
            );
          })}
        </div>
      )}

      {fromPointId && (
        <p className="text-[length:var(--font-ui-sm)] text-ink-3">
          Örnek: {formatMoney(0, settings.defaultCurrency)} varsayılan para birimiyle girilir; alanı boş bırakmak
          o hedefi fiyatsız (rezervasyona kapalı) tutar.
        </p>
      )}
    </div>
  );
}
