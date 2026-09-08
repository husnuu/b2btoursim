"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { NumberField, SelectField, TextField } from "@/components/primitives/Field";
import { useToast } from "@/components/primitives/Toast";
import { formatMoney } from "@/lib/i18n";
import { computePointPrice, reachablePoints } from "@/lib/transfer";
import { useTransferCatalog } from "@/lib/transfer-store";

/** 2.5 Nokta İle Rezervasyon — "Önceden Belirlenen Noktadan Transfer". */
export function PointBookingSearch() {
  const { points, priceMatrix, marginRules, vehicles, settings, createBooking } = useTransferCatalog();
  const { notify } = useToast();

  const [oneWay, setOneWay] = useState(true);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("10:00");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [searched, setSearched] = useState(false);

  const destinations = fromId ? reachablePoints(priceMatrix, fromId) : [];
  const totalPax = adults + children;

  const results = !searched
    ? []
    : vehicles
        .filter((v) => v.status === "aktif" && v.pricingModel === "rotaBazli" && v.seatCapacity >= totalPax)
        .map((v) => ({
          vehicle: v,
          price: computePointPrice(priceMatrix, marginRules, {
            fromPointId: fromId,
            toPointId: toId,
            vehicleType: v.vehicleType,
            vehicleId: v.id,
            time,
          }),
        }))
        .filter((r): r is { vehicle: (typeof vehicles)[number]; price: number } => r.price !== null);

  const book = (vehicleId: string, price: number) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;
    createBooking({
      model: "nokta",
      vehicleId,
      vehicleTitleSnapshot: vehicle.title,
      fromLabel: points.find((p) => p.id === fromId)?.name ?? "",
      toLabel: points.find((p) => p.id === toId)?.name ?? "",
      oneWay,
      date,
      time,
      returnDate: oneWay ? null : returnDate || null,
      returnTime: oneWay ? null : returnTime || null,
      adults,
      children,
      price,
      currency: settings.defaultCurrency,
      operationStatus: "planlamaBekliyor",
      assignedDriverName: "",
      assignedDriverNote: "",
    });
    notify("Rezervasyon oluşturuldu.");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input type="radio" checked={oneWay} onChange={() => setOneWay(true)} className="h-4 w-4 accent-[var(--action-primary)]" />
          <span className="text-[length:var(--font-ui)] text-ink">Tek Yön</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={!oneWay} onChange={() => setOneWay(false)} className="h-4 w-4 accent-[var(--action-primary)]" />
          <span className="text-[length:var(--font-ui)] text-ink">Gidiş-Dönüş</span>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Nereden"
          value={fromId}
          onChange={(e) => {
            setFromId(e.target.value);
            setToId("");
            setSearched(false);
          }}
        >
          <option value="">Bir yer arayın</option>
          {points.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Nereye"
          value={toId}
          onChange={(e) => {
            setToId(e.target.value);
            setSearched(false);
          }}
          disabled={!fromId}
        >
          <option value="">{fromId ? "Bir yer arayın" : "Önce Nereden seçin"}</option>
          {points
            .filter((p) => destinations.includes(p.id))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </SelectField>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <TextField label="Gidiş Tarihi" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <TextField label="Gidiş Saati" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        {!oneWay && (
          <>
            <TextField label="Dönüş Tarihi" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
            <TextField label="Dönüş Saati" type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} />
          </>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="Yetişkin" min={1} value={adults} onChange={(e) => setAdults(Number(e.target.value))} />
        <NumberField label="Çocuk" min={0} value={children} onChange={(e) => setChildren(Number(e.target.value))} />
      </div>

      <Button type="button" variant="primary" className="self-start" disabled={!fromId || !toId} onClick={() => setSearched(true)}>
        Ara
      </Button>

      {searched && (
        <div className="flex flex-col gap-2">
          {results.length === 0 ? (
            <p className="text-[length:var(--font-ui-sm)] text-ink-3">
              Bu güzergah ve kapasite için uygun araç bulunamadı — önce fiyatlandırma matrisini doldurun.
            </p>
          ) : (
            results.map(({ vehicle, price }) => (
              <div key={vehicle.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-line p-3">
                <div>
                  <p className="text-[length:var(--font-ui)] text-ink">{vehicle.title}</p>
                  <p className="text-[length:var(--font-ui-sm)] text-ink-3">
                    {vehicle.vehicleType === "private" ? "Private" : "Shuttle"} · {vehicle.seatCapacity} koltuk
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tnum text-[length:var(--font-ui)] font-medium text-ink">
                    {formatMoney(price, settings.defaultCurrency)}
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
    </div>
  );
}
