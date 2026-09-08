"use client";

import { useState } from "react";
import { EmptyState } from "@/components/primitives/States";
import { Button } from "@/components/primitives/Button";
import { NumberField, SelectField, TextField } from "@/components/primitives/Field";
import { TransferOperationStatusBadge } from "@/components/primitives/TransferOperationStatusBadge";
import { useToast } from "@/components/primitives/Toast";
import { formatMoney } from "@/lib/i18n";
import {
  computeHourlyBoatPrice,
  computeMultiDayPrice,
  computePerPersonPrice,
  hasBoatConflict,
  hasCaptainConflict,
  type CaptainOption,
} from "@/lib/boat";
import { useBoatCatalog } from "@/lib/boat-store";

/** Bölüm 6 — Rezervasyonlar (Transfer'deki birleşik liste iskeletiyle aynı desen). */
export function BoatBookingsView() {
  const { boats, bookings, createBooking } = useBoatCatalog();
  const { notify } = useToast();

  const activeBoats = boats.filter((b) => b.status === "aktif");

  const [boatId, setBoatId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [fromTime, setFromTime] = useState("10:00");
  const [toDate, setToDate] = useState("");
  const [toTime, setToTime] = useState("14:00");
  const [captainChoice, setCaptainChoice] = useState<CaptainOption>("kaptanli");
  const [captainName, setCaptainName] = useState("");
  const [hours, setHours] = useState(4);
  const [units, setUnits] = useState(1);
  const [guests, setGuests] = useState(2);

  const boat = activeBoats.find((b) => b.id === boatId);
  const effectiveCaptainOption = boat?.captainOption === "herIkisi" ? captainChoice : boat?.captainOption ?? "kaptanli";

  const range = { fromDate, fromTime, toDate: toDate || fromDate, toTime };
  const boatConflict = boat && fromDate ? hasBoatConflict(bookings, boat.id, range) : false;
  const captainConflict = boat && captainName && fromDate ? hasCaptainConflict(bookings, captainName, range) : false;

  const price = !boat
    ? 0
    : boat.pricingModel === "saatlik"
      ? computeHourlyBoatPrice(boat.hourlyRate ?? 0, hours, boat.hourlyTiers)
      : boat.pricingModel === "cokGunlu"
        ? computeMultiDayPrice(boat.multiDay, units)
        : computePerPersonPrice(boat.perPerson, guests);

  const captainFeeTotal = boat && effectiveCaptainOption !== "kaptansiz" && boat.captainFee
    ? boat.captainFeeUnit === "saatlik"
      ? boat.captainFee * hours
      : boat.captainFee * Math.max(units, 1)
    : 0;

  const book = () => {
    if (!boat || !fromDate || boatConflict) return;
    createBooking({
      boatId: boat.id,
      boatTitleSnapshot: boat.title,
      fromDate,
      fromTime,
      toDate: toDate || fromDate,
      toTime,
      captainOption: effectiveCaptainOption,
      assignedCaptainName: captainName,
      pricingModel: boat.pricingModel,
      price: price + captainFeeTotal,
      currency: boat.currency,
      securityDeposit: boat.securityDeposit,
      securityDepositStatus: boat.securityDeposit > 0 ? "bloke" : "iadeEdildi",
      operationStatus: "planlamaBekliyor",
    });
    notify("Rezervasyon oluşturuldu.");
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-[var(--pad-x)] py-5">
      <section className="flex flex-col gap-4">
        <h1 className="font-dense text-base font-medium text-ink">Rezervasyon Oluştur</h1>
        {activeBoats.length === 0 ? (
          <p className="text-[length:var(--font-ui-sm)] text-ink-3">Önce Tekneler&apos;de en az bir tekneyi yayınlayın (Aktif).</p>
        ) : (
          <>
            <SelectField label="Tekne" value={boatId} onChange={(e) => setBoatId(e.target.value)}>
              <option value="">Seçilmedi</option>
              {activeBoats.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </SelectField>

            {boat && (
              <>
                <div className="grid gap-3 sm:grid-cols-4">
                  <TextField label="Başlangıç tarihi" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                  <TextField label="Başlangıç saati" type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} />
                  <TextField label="Bitiş tarihi" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                  <TextField label="Bitiş saati" type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} />
                </div>

                {boat.captainOption === "herIkisi" && (
                  <SelectField label="Kaptan seçimi (bu rezervasyon için)" value={captainChoice} onChange={(e) => setCaptainChoice(e.target.value as CaptainOption)}>
                    <option value="kaptanli">Kaptanlı</option>
                    <option value="kaptansiz">Kaptansız</option>
                  </SelectField>
                )}
                {effectiveCaptainOption !== "kaptansiz" && (
                  <TextField label="Atanan kaptan adı" value={captainName} onChange={(e) => setCaptainName(e.target.value)} hint="Faz3 kaptan çakışma kontrolü için (basitleştirilmiş simülasyon)." />
                )}

                {boat.pricingModel === "saatlik" && <NumberField label="Süre (saat)" min={boat.minRentalHours} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="max-w-xs" />}
                {boat.pricingModel === "cokGunlu" && <NumberField label={boat.multiDay.unit === "gece" ? "Gece sayısı" : "Gün sayısı"} min={boat.multiDay.minUnits} max={boat.multiDay.maxUnits} value={units} onChange={(e) => setUnits(Number(e.target.value))} className="max-w-xs" />}
                {boat.pricingModel === "kisiBasi" && <NumberField label="Kişi sayısı" min={boat.perPerson.minGroupSize} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="max-w-xs" />}

                {boatConflict && (
                  <p className="rounded-[var(--radius)] border border-danger/40 bg-danger-tint px-3 py-2 text-[length:var(--font-ui-sm)] text-danger">
                    Bu tekne seçilen tarih/saat aralığında zaten rezerve — çakışma önleme kuralı gereği ikinci rezervasyon oluşturulamaz.
                  </p>
                )}
                {captainConflict && (
                  <p className="rounded-[var(--radius)] border border-warning/40 bg-warning-tint px-3 py-2 text-[length:var(--font-ui-sm)] text-warning">
                    &quot;{captainName}&quot; aynı saat aralığında başka bir rezervasyona atanmış görünüyor (simüle kontrol).
                  </p>
                )}

                <p className="tnum text-[length:var(--font-ui)] text-ink">
                  Toplam: <strong>{formatMoney(price + captainFeeTotal, boat.currency)}</strong>
                  {boat.securityDeposit > 0 && <span className="ms-2 text-[length:var(--font-ui-sm)] text-ink-3">+ {formatMoney(boat.securityDeposit, boat.currency)} depozito (bloke)</span>}
                </p>

                <Button type="button" variant="primary" className="self-start" disabled={!fromDate || boatConflict} onClick={book}>
                  Rezervasyon Oluştur
                </Button>
              </>
            )}
          </>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-dense text-base font-medium text-ink">Rezervasyonlar</h2>
        {bookings.length === 0 ? (
          <EmptyState title="Şu anda rezervasyonunuz bulunmamaktadır" body="Yukarıdaki formdan bir rezervasyon oluşturun." />
        ) : (
          <div className="flex flex-col gap-1.5">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-line px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[length:var(--font-ui)] text-ink">{b.boatTitleSnapshot}</p>
                  <p className="tnum text-[length:var(--font-ui-sm)] text-ink-3">
                    {b.fromDate} {b.fromTime} → {b.toDate} {b.toTime}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="tnum text-[length:var(--font-ui-sm)] font-medium text-ink">{formatMoney(b.price, b.currency)}</span>
                  <TransferOperationStatusBadge status={b.operationStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
