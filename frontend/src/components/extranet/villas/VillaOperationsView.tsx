"use client";

import { useMemo, useState } from "react";
import { TextField } from "@/components/primitives/Field";
import { TransferOperationStatusBadge } from "@/components/primitives/TransferOperationStatusBadge";
import { OPERATION_STATUS_META } from "@/lib/transfer-status";
import { formatMoney } from "@/lib/i18n";
import { useVillaCatalog } from "@/lib/villa-store";
import type { TransferOperationStatus } from "@/lib/transfer";

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const STATUS_ORDER: TransferOperationStatus[] = ["planlamaBekliyor", "aktifTransfer", "tamamlandi"];

/**
 * Bölüm 6 — Operasyon. Transfer/Tekne'nin operasyon panel iskeleti
 * (doküman "yeniden kullanılabilir" diyor) + Check-in/Check-out Panosu
 * (Faz2).
 */
export function VillaOperationsView() {
  const { bookings, setBookingOperationStatus } = useVillaCatalog();
  const [rangeStart, setRangeStart] = useState(isoDate(0));
  const [rangeEnd, setRangeEnd] = useState(isoDate(7));

  const inRange = useMemo(
    () => bookings.filter((b) => b.checkInDate <= rangeEnd && b.checkOutDate >= rangeStart),
    [bookings, rangeStart, rangeEnd],
  );

  const counts = useMemo(() => {
    const map: Record<TransferOperationStatus, number> = { planlamaBekliyor: 0, aktifTransfer: 0, tamamlandi: 0 };
    for (const b of inRange) map[b.operationStatus] += 1;
    return map;
  }, [inRange]);

  const checkIns = inRange.filter((b) => b.checkInDate >= rangeStart && b.checkInDate <= rangeEnd).sort((a, b) => a.checkInDate.localeCompare(b.checkInDate));
  const checkOuts = inRange.filter((b) => b.checkOutDate >= rangeStart && b.checkOutDate <= rangeEnd).sort((a, b) => a.checkOutDate.localeCompare(b.checkOutDate));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-[var(--pad-x)] py-5">
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="font-dense text-base font-medium text-ink">Villa Operasyonu</h1>
        <div className="ms-auto flex items-end gap-2">
          <TextField label="Başlangıç" type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
          <TextField label="Bitiş" type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="rounded-[var(--radius-lg)] border border-line p-3">
            <TransferOperationStatusBadge status={status} />
            <p className="tnum mt-2 text-2xl font-medium text-ink">{counts[status]}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="flex flex-col gap-2">
          <h2 className="text-[length:var(--font-ui-sm)] font-medium uppercase tracking-wide text-ink-3">Check-in Panosu</h2>
          {checkIns.length === 0 ? (
            <p className="text-[length:var(--font-ui-sm)] text-ink-3">Bu aralıkta giriş yok.</p>
          ) : (
            checkIns.map((b) => (
              <div key={b.id} className="rounded-[var(--radius)] border border-line p-2">
                <p className="tnum text-[length:var(--font-ui-sm)] text-ink">{b.checkInDate} · {b.villaTitleSnapshot}</p>
              </div>
            ))
          )}
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-[length:var(--font-ui-sm)] font-medium uppercase tracking-wide text-ink-3">Check-out Panosu</h2>
          {checkOuts.length === 0 ? (
            <p className="text-[length:var(--font-ui-sm)] text-ink-3">Bu aralıkta çıkış yok.</p>
          ) : (
            checkOuts.map((b) => (
              <div key={b.id} className="rounded-[var(--radius)] border border-line p-2">
                <p className="tnum text-[length:var(--font-ui-sm)] text-ink">{b.checkOutDate} · {b.villaTitleSnapshot}</p>
              </div>
            ))
          )}
        </section>
      </div>

      <div className="flex flex-col gap-2">
        {inRange.length === 0 ? (
          <p className="text-[length:var(--font-ui-sm)] text-ink-3">Bu aralıkta rezervasyon yok.</p>
        ) : (
          inRange.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-line p-3">
              <div className="min-w-0">
                <p className="truncate text-[length:var(--font-ui)] text-ink">{booking.villaTitleSnapshot}</p>
                <p className="tnum text-[length:var(--font-ui-sm)] text-ink-3">
                  {booking.checkInDate} → {booking.checkOutDate} · {formatMoney(booking.price, booking.currency)}
                </p>
              </div>
              <select
                aria-label="Durum"
                value={booking.operationStatus}
                onChange={(e) => setBookingOperationStatus(booking.id, e.target.value as TransferOperationStatus)}
                className="h-7 w-44 shrink-0 rounded-[var(--radius)] border border-line-strong bg-surface text-[length:var(--font-ui-sm)] text-ink outline-none focus:border-action"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {OPERATION_STATUS_META[s].glyph} {s}
                  </option>
                ))}
              </select>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
