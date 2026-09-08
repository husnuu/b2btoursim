"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { NumberField, TextField } from "@/components/primitives/Field";
import { useToast } from "@/components/primitives/Toast";
import { formatMoney } from "@/lib/i18n";
import { computeKmFormulaPrice, computeZonePrice, matchAddressToZone } from "@/lib/transfer";
import { useTransferCatalog } from "@/lib/transfer-store";

/**
 * 3.5 Haritadan Rezervasyon (Faz3) — serbest adres girişi; sistem adresi
 * bir Harita Alanı'na eşleştirip fiyatı hesaplar (bkz. plan Varsayım 1:
 * gerçek geocoding yerine anahtar kelime eşleşmesi).
 */
export function ZoneBookingSearch() {
  const { mapZones, zonePriceMatrix, marginRules, kmFormula, vehicles, settings, createBooking } = useTransferCatalog();
  const { notify } = useToast();

  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [km, setKm] = useState(10);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [searched, setSearched] = useState(false);

  const fromZone = matchAddressToZone(fromAddress, mapZones);
  const toZone = matchAddressToZone(toAddress, mapZones);

  const results =
    !searched || !fromZone || !toZone
      ? []
      : vehicles
          .filter((v) => v.status === "aktif" && v.pricingModel === "rotaBazli")
          .map((v) => {
            const price = kmFormula.enabled
              ? computeKmFormulaPrice(kmFormula, km, v.vehicleType)
              : computeZonePrice(zonePriceMatrix, marginRules, {
                  fromZoneId: fromZone.id,
                  toZoneId: toZone.id,
                  vehicleType: v.vehicleType,
                  vehicleId: v.id,
                  time,
                });
            return { vehicle: v, price };
          })
          .filter((r): r is { vehicle: (typeof vehicles)[number]; price: number } => r.price !== null);

  const book = (vehicleId: string, price: number) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;
    createBooking({
      model: "harita",
      vehicleId,
      vehicleTitleSnapshot: vehicle.title,
      fromLabel: fromAddress,
      toLabel: toAddress,
      oneWay: true,
      date,
      time,
      returnDate: null,
      returnTime: null,
      adults: 1,
      children: 0,
      price,
      currency: kmFormula.enabled ? kmFormula.currency : settings.defaultCurrency,
      operationStatus: "planlamaBekliyor",
      assignedDriverName: "",
      assignedDriverNote: "",
    });
    notify("Rezervasyon oluşturuldu.");
  };

  return (
    <div className="flex flex-col gap-5">
      {mapZones.length === 0 ? (
        <p className="text-[length:var(--font-ui-sm)] text-ink-3">Önce Harita Alanları&apos;na en az iki bölge ekleyin.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Nereden (serbest adres)"
              value={fromAddress}
              onChange={(e) => {
                setFromAddress(e.target.value);
                setSearched(false);
              }}
              hint={fromZone ? `Eşleşen bölge: ${fromZone.name}` : fromAddress ? "Eşleşen bölge bulunamadı" : undefined}
            />
            <TextField
              label="Nereye (serbest adres)"
              value={toAddress}
              onChange={(e) => {
                setToAddress(e.target.value);
                setSearched(false);
              }}
              hint={toZone ? `Eşleşen bölge: ${toZone.name}` : toAddress ? "Eşleşen bölge bulunamadı" : undefined}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <TextField label="Tarih" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <TextField label="Saat" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            {kmFormula.enabled && <NumberField label="Mesafe (km)" min={0} value={km} onChange={(e) => setKm(Number(e.target.value))} />}
          </div>

          <Button type="button" variant="primary" className="self-start" disabled={!fromZone || !toZone} onClick={() => setSearched(true)}>
            Ara
          </Button>

          {searched && (
            <div className="flex flex-col gap-2">
              {results.length === 0 ? (
                <p className="text-[length:var(--font-ui-sm)] text-ink-3">Uygun araç/fiyat bulunamadı.</p>
              ) : (
                results.map(({ vehicle, price }) => (
                  <div key={vehicle.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-line p-3">
                    <p className="text-[length:var(--font-ui)] text-ink">{vehicle.title}</p>
                    <div className="flex items-center gap-3">
                      <span className="tnum text-[length:var(--font-ui)] font-medium text-ink">
                        {formatMoney(price, kmFormula.enabled ? kmFormula.currency : settings.defaultCurrency)}
                      </span>
                      <Button type="button" variant="primary" size="sm" onClick={() => book(vehicle.id, price)}>
                        Rezervasyon Oluştur
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
