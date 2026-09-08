"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { NumberField, SelectField, TextField } from "@/components/primitives/Field";
import { useToast } from "@/components/primitives/Toast";
import { formatMoney } from "@/lib/i18n";
import { computeHourlyPrice, type RentalPointRole } from "@/lib/transfer";
import { useTransferCatalog } from "@/lib/transfer-store";

const ROLE_LABELS: Record<RentalPointRole, string> = {
  pickup: "Yalnızca alış",
  dropoff: "Yalnızca bırakış",
  both: "Alış ve bırakış",
};

/**
 * Model C — Saatlik Kiralama. Kiralama Noktaları, Araç Noktaları'ndan
 * tamamen ayrı bir katalogdur (Bölüm 4.1); fiyat noktaya bağlı değildir,
 * yalnızca süre × saatlik ücrettir (Bölüm 4.2).
 */
export function SaatlikKiralamaView() {
  const { rentalPoints, addRentalPoint, removeRentalPoint, vehicles, settings, createBooking } = useTransferCatalog();
  const { notify } = useToast();

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<{ name: string; role: RentalPointRole }>({ name: "", role: "both" });

  const savePoint = () => {
    if (!form.name.trim()) return;
    addRentalPoint(form);
    setForm({ name: "", role: "both" });
    setAdding(false);
  };

  const hourlyVehicles = vehicles.filter((v) => v.status === "aktif" && v.pricingModel === "saatlikKiralama" && v.hourlyRate);
  const pickupPoints = rentalPoints.filter((p) => p.role !== "dropoff");
  const dropoffPoints = rentalPoints.filter((p) => p.role !== "pickup");

  const [vehicleId, setVehicleId] = useState("");
  const [pickupId, setPickupId] = useState("");
  const [dropoffId, setDropoffId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [hours, setHours] = useState(4);

  const vehicle = hourlyVehicles.find((v) => v.id === vehicleId);
  const price = vehicle?.hourlyRate ? computeHourlyPrice(vehicle.hourlyRate, hours) : null;

  const book = () => {
    if (!vehicle || price === null) return;
    createBooking({
      model: "saatlik",
      vehicleId: vehicle.id,
      vehicleTitleSnapshot: vehicle.title,
      fromLabel: rentalPoints.find((p) => p.id === pickupId)?.name ?? "",
      toLabel: rentalPoints.find((p) => p.id === dropoffId)?.name ?? "",
      oneWay: true,
      date,
      time,
      returnDate: null,
      returnTime: null,
      adults: 1,
      children: 0,
      price,
      currency: settings.defaultCurrency,
      operationStatus: "planlamaBekliyor",
      assignedDriverName: "",
      assignedDriverNote: "",
    });
    notify("Rezervasyon oluşturuldu.");
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-[var(--pad-x)] py-5">
      <section className="flex flex-col gap-4">
        <h1 className="font-dense text-base font-medium text-ink">Kiralama Noktaları</h1>
        {rentalPoints.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {rentalPoints.map((point) => (
              <li key={point.id} className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-line px-3 py-2">
                <span className="text-[length:var(--font-ui)] text-ink">
                  {point.name}
                  <span className="ms-2 text-[length:var(--font-ui-sm)] text-ink-3">{ROLE_LABELS[point.role]}</span>
                </span>
                <Button type="button" size="sm" variant="danger" onClick={() => removeRentalPoint(point.id)}>
                  Sil
                </Button>
              </li>
            ))}
          </ul>
        )}
        {!adding ? (
          <Button type="button" size="sm" className="self-start" onClick={() => setAdding(true)}>
            Nokta ekle
          </Button>
        ) : (
          <div className="flex items-end gap-2">
            <TextField label="Nokta adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <SelectField label="Rol" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as RentalPointRole })}>
              <option value="both">Alış ve bırakış</option>
              <option value="pickup">Yalnızca alış</option>
              <option value="dropoff">Yalnızca bırakış</option>
            </SelectField>
            <Button type="button" onClick={() => setAdding(false)}>
              Vazgeç
            </Button>
            <Button type="button" variant="primary" onClick={savePoint}>
              Kaydet
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-line-strong bg-sunken p-3">
        <h2 className="text-[length:var(--font-ui-sm)] font-medium text-ink">İş Kuralları</h2>
        <ul className="list-disc space-y-1 ps-4 text-[length:var(--font-ui-sm)] text-ink-2">
          <li>Fiyat noktaya bağlı değildir: bırakış ile alış arasındaki süre × aracın saatlik ücreti.</li>
          <li>Bırakış = Alış olabilir; kiralamada güzergah tanımı yoktur.</li>
          <li>Saatlik ücreti olmayan araç, kiralama aramasında listelenmez.</li>
          <li>Nokta adı rezervasyona kopyalanır; bir noktayı silmek geçmiş kiralamaları etkilemez.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-dense text-base font-medium text-ink">Rezervasyon Oluştur</h2>
        {hourlyVehicles.length === 0 ? (
          <p className="text-[length:var(--font-ui-sm)] text-ink-3">
            Önce Araçlar&apos;da fiyatlandırma şekli &quot;Saatlik kiralama&quot; olan ve saatlik ücreti girilmiş bir araç oluşturun.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField label="Araç" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                <option value="">Seçilmedi</option>
                {hourlyVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title} — {formatMoney(v.hourlyRate ?? 0, settings.defaultCurrency)}/saat
                  </option>
                ))}
              </SelectField>
              <NumberField label="Süre (saat)" min={1} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField label="Alış noktası" value={pickupId} onChange={(e) => setPickupId(e.target.value)}>
                <option value="">Seçilmedi</option>
                {pickupPoints.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Bırakış noktası" value={dropoffId} onChange={(e) => setDropoffId(e.target.value)}>
                <option value="">Seçilmedi</option>
                {dropoffPoints.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Tarih" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <TextField label="Saat" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            {price !== null && (
              <p className="tnum text-[length:var(--font-ui)] text-ink">
                Toplam: <strong>{formatMoney(price, settings.defaultCurrency)}</strong>
              </p>
            )}
            <Button
              type="button"
              variant="primary"
              className="self-start"
              disabled={!vehicle || !pickupId || !dropoffId}
              onClick={book}
            >
              Rezervasyon Oluştur
            </Button>
          </>
        )}
      </section>
    </div>
  );
}
