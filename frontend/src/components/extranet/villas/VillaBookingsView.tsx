"use client";

import { useState } from "react";
import { EmptyState } from "@/components/primitives/States";
import { Button } from "@/components/primitives/Button";
import { NumberField, SelectField, TextField } from "@/components/primitives/Field";
import { TransferOperationStatusBadge } from "@/components/primitives/TransferOperationStatusBadge";
import { useToast } from "@/components/primitives/Toast";
import { formatMoney } from "@/lib/i18n";
import { computeNightlyTotal, hasVillaConflict, type VillaBookingMethod } from "@/lib/villa";
import { useVillaCatalog } from "@/lib/villa-store";

const METHOD_LABELS: Record<VillaBookingMethod, string> = {
  talepTopla: "Talep Topla",
  onlineOdemeIleAl: "Online Ödeme ile Rezervasyon Al",
  belirliOranOdeme: "Belirli Oranda Online Ödeme Al",
  belirliOranOdemeYuvarla: "Belirli Oranda Online Ödeme Al ve Kalanı Yuvarla",
};

/** Bölüm 6 — Rezervasyonlar. */
export function VillaBookingsView() {
  const { villas, bookings, createBooking } = useVillaCatalog();
  const { notify } = useToast();

  const activeVillas = villas.filter((v) => v.status === "aktif");

  const [villaId, setVillaId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [method, setMethod] = useState<VillaBookingMethod>("talepTopla");

  const villa = activeVillas.find((v) => v.id === villaId);
  const { nights, total } = villa && checkIn && checkOut ? computeNightlyTotal(villa.nightlyRate, checkIn, checkOut) : { nights: 0, total: 0 };

  const conflict = villa && checkIn && checkOut ? hasVillaConflict(bookings, villa.id, checkIn, checkOut) : false;
  const belowMinNights = villa ? nights > 0 && nights < villa.minNights : false;

  const book = () => {
    if (!villa || !checkIn || !checkOut || conflict || nights <= 0) return;
    createBooking({
      villaId: villa.id,
      villaTitleSnapshot: villa.title,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      guests,
      nights,
      price: total,
      currency: villa.priceCurrency,
      bookingMethod: method,
      operationStatus: "planlamaBekliyor",
    });
    notify("Rezervasyon oluşturuldu.");
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-[var(--pad-x)] py-5">
      <section className="flex flex-col gap-4">
        <h1 className="font-dense text-base font-medium text-ink">Rezervasyon Oluştur</h1>
        {activeVillas.length === 0 ? (
          <p className="text-[length:var(--font-ui-sm)] text-ink-3">Önce Villalar&apos;da en az bir villayı yayınlayın (Aktif).</p>
        ) : (
          <>
            <SelectField label="Villa" value={villaId} onChange={(e) => setVillaId(e.target.value)}>
              <option value="">Seçilmedi</option>
              {activeVillas.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </SelectField>

            {villa && (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <TextField label="Check-in tarihi" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                  <TextField label="Check-out tarihi" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                  <NumberField label="Misafir sayısı" min={1} max={villa.capacity} value={guests} onChange={(e) => setGuests(Number(e.target.value))} />
                </div>

                <SelectField label="Rezervasyon Yöntemi" value={method} onChange={(e) => setMethod(e.target.value as VillaBookingMethod)}>
                  {villa.bookingMethods.map((m) => (
                    <option key={m} value={m}>
                      {METHOD_LABELS[m]}
                    </option>
                  ))}
                </SelectField>

                {conflict && (
                  <p className="rounded-[var(--radius)] border border-danger/40 bg-danger-tint px-3 py-2 text-[length:var(--font-ui-sm)] text-danger">
                    Bu villa seçilen tarih aralığında zaten rezerve — çakışma önleme kuralı gereği ikinci rezervasyon oluşturulamaz.
                  </p>
                )}
                {belowMinNights && (
                  <p className="rounded-[var(--radius)] border border-warning/40 bg-warning-tint px-3 py-2 text-[length:var(--font-ui-sm)] text-warning">
                    Bu villa için minimum konaklama süresi {villa.minNights} gece (Faz3 kuralı — bilgilendirme amaçlı, rezervasyonu engellemez).
                  </p>
                )}

                {nights > 0 && (
                  <p className="tnum text-[length:var(--font-ui)] text-ink">
                    {nights} gece × {formatMoney(villa.nightlyRate, villa.priceCurrency)} = <strong>{formatMoney(total, villa.priceCurrency)}</strong>
                  </p>
                )}

                <Button type="button" variant="primary" className="self-start" disabled={!checkIn || !checkOut || conflict || nights <= 0} onClick={book}>
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
                  <p className="truncate text-[length:var(--font-ui)] text-ink">{b.villaTitleSnapshot}</p>
                  <p className="tnum text-[length:var(--font-ui-sm)] text-ink-3">
                    {b.checkInDate} → {b.checkOutDate} ({b.nights} gece)
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
