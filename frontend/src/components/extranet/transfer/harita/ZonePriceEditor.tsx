"use client";

import { useState } from "react";
import { NumberField, SelectField } from "@/components/primitives/Field";
import { findZonePrice, type VehicleType } from "@/lib/transfer";
import { useTransferCatalog } from "@/lib/transfer-store";

/** 3.2 Harita Alanı Fiyatlandırma (Faz3) — Bölge→Bölge tarifesi ya da Kilometre formülü. */
export function ZonePriceEditor() {
  const { mapZones, zonePriceMatrix, setZonePrice, kmFormula, updateKmFormula, settings } = useTransferCatalog();
  const [fromZoneId, setFromZoneId] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("private");

  const destinations = mapZones.filter((z) => z.id !== fromZoneId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={!kmFormula.enabled}
            onChange={() => updateKmFormula({ enabled: false })}
            className="h-4 w-4 accent-[var(--action-primary)]"
          />
          <span className="text-[length:var(--font-ui)] text-ink">Bölge → Bölge tarifesi</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={kmFormula.enabled}
            onChange={() => updateKmFormula({ enabled: true })}
            className="h-4 w-4 accent-[var(--action-primary)]"
          />
          <span className="text-[length:var(--font-ui)] text-ink">Kilometre formülü</span>
        </label>
      </div>

      {!kmFormula.enabled ? (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Fiyatlandırmak istediğiniz bölgeyi seçin" value={fromZoneId} onChange={(e) => setFromZoneId(e.target.value)}>
              <option value="">Seçilmedi</option>
              {mapZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Araç Tipi" value={vehicleType} onChange={(e) => setVehicleType(e.target.value as VehicleType)}>
              <option value="private">Private</option>
              <option value="shuttle">Shuttle</option>
            </SelectField>
          </div>

          {!fromZoneId ? (
            <p className="text-[length:var(--font-ui-sm)] text-ink-3">Önce bir bölge seçin.</p>
          ) : destinations.length === 0 ? (
            <p className="text-[length:var(--font-ui-sm)] text-ink-3">Fiyatlandırılacak başka bölge yok.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {destinations.map((to) => {
                const row = findZonePrice(zonePriceMatrix, fromZoneId, to.id, vehicleType);
                return (
                  <div key={to.id} className="grid grid-cols-[1fr_8rem] items-center gap-3 rounded-[var(--radius)] border border-line px-3 py-2">
                    <span className="truncate text-[length:var(--font-ui)] text-ink">
                      {mapZones.find((z) => z.id === fromZoneId)?.name} → {to.name}
                    </span>
                    <input
                      type="number"
                      min={0}
                      defaultValue={row ? row.price / 100 : ""}
                      placeholder="Fiyat"
                      onBlur={(e) => {
                        const value = Number(e.target.value);
                        if (!e.target.value || Number.isNaN(value)) return;
                        setZonePrice({
                          fromZoneId,
                          toZoneId: to.id,
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
        </div>
      ) : (
        <div className="grid gap-3 rounded-[var(--radius-lg)] border border-line p-3 sm:grid-cols-2">
          <NumberField
            label="Taban ücret"
            min={0}
            value={kmFormula.baseFare / 100}
            onChange={(e) => updateKmFormula({ baseFare: Math.round(Number(e.target.value) * 100) })}
          />
          <NumberField
            label="Km başına birim ücret"
            min={0}
            value={kmFormula.perKm / 100}
            onChange={(e) => updateKmFormula({ perKm: Math.round(Number(e.target.value) * 100) })}
          />
          <NumberField
            label="Private çarpanı"
            min={0}
            step={0.1}
            value={kmFormula.privateMultiplier}
            onChange={(e) => updateKmFormula({ privateMultiplier: Number(e.target.value) })}
          />
          <NumberField
            label="Shuttle çarpanı"
            min={0}
            step={0.1}
            value={kmFormula.shuttleMultiplier}
            onChange={(e) => updateKmFormula({ shuttleMultiplier: Number(e.target.value) })}
          />
          <p className="text-[length:var(--font-ui-sm)] text-ink-3 sm:col-span-2">
            Gerçek zamanlı harita mesafe API&apos;si yok; Haritadan Rezervasyon adımında mesafe elle girilir.
          </p>
        </div>
      )}
    </div>
  );
}
