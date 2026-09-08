"use client";

import { useMemo, useState } from "react";
import { TextField } from "@/components/primitives/Field";
import { TransferOperationStatusBadge } from "@/components/primitives/TransferOperationStatusBadge";
import { OPERATION_STATUS_META } from "@/lib/transfer-status";
import { formatMoney } from "@/lib/i18n";
import { hasCaptainConflict } from "@/lib/boat";
import { useBoatCatalog } from "@/lib/boat-store";
import type { TransferOperationStatus } from "@/lib/transfer";

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const STATUS_ORDER: TransferOperationStatus[] = ["planlamaBekliyor", "aktifTransfer", "tamamlandi"];
const DEPOSIT_LABELS: Record<string, string> = { bloke: "Bloke", iadeEdildi: "İade edildi", kesintiYapildi: "Kesinti yapıldı" };

/**
 * Bölüm 6 — Operasyon. Transfer'in `OperationsView.tsx`'iyle aynı iskelet
 * (doküman "aynı iskelet kullanılır" diyor) + depozito durumu + Faz3
 * kaptan çakışma uyarısı (bkz. plan Varsayım 2).
 */
export function BoatOperationsView() {
  const { bookings, setBookingOperationStatus, setBookingDepositStatus } = useBoatCatalog();
  const [rangeStart, setRangeStart] = useState(isoDate(0));
  const [rangeEnd, setRangeEnd] = useState(isoDate(7));

  const inRange = useMemo(
    () => bookings.filter((b) => !b.fromDate || (b.fromDate >= rangeStart && b.fromDate <= rangeEnd)),
    [bookings, rangeStart, rangeEnd],
  );

  const counts = useMemo(() => {
    const map: Record<TransferOperationStatus, number> = { planlamaBekliyor: 0, aktifTransfer: 0, tamamlandi: 0 };
    for (const b of inRange) map[b.operationStatus] += 1;
    return map;
  }, [inRange]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-[var(--pad-x)] py-5">
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="font-dense text-base font-medium text-ink">Tekne Operasyonu</h1>
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

      <div className="flex flex-col gap-2">
        {inRange.length === 0 ? (
          <p className="text-[length:var(--font-ui-sm)] text-ink-3">Bu aralıkta rezervasyon yok.</p>
        ) : (
          inRange.map((booking) => {
            const captainWarning =
              booking.assignedCaptainName &&
              hasCaptainConflict(bookings, booking.assignedCaptainName, {
                fromDate: booking.fromDate,
                fromTime: booking.fromTime,
                toDate: booking.toDate,
                toTime: booking.toTime,
              }, booking.id);
            return (
              <div key={booking.id} className="flex flex-col gap-2 rounded-[var(--radius)] border border-line p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[length:var(--font-ui)] text-ink">
                      {booking.fromDate} {booking.fromTime} · {booking.boatTitleSnapshot}
                    </p>
                    <p className="tnum text-[length:var(--font-ui-sm)] text-ink-3">{formatMoney(booking.price, booking.currency)}</p>
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
                {captainWarning && (
                  <p className="text-[length:var(--font-ui-sm)] text-warning">
                    Kaptan &quot;{booking.assignedCaptainName}&quot; aynı saatte başka bir tekneyle çakışıyor olabilir (simüle kontrol).
                  </p>
                )}
                {booking.securityDeposit > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[length:var(--font-ui-sm)] text-ink-2">
                      Depozito: {formatMoney(booking.securityDeposit, booking.currency)}
                    </span>
                    <select
                      aria-label="Depozito durumu"
                      value={booking.securityDepositStatus}
                      onChange={(e) => setBookingDepositStatus(booking.id, e.target.value as typeof booking.securityDepositStatus)}
                      className="h-7 w-40 rounded-[var(--radius)] border border-line-strong bg-surface text-[length:var(--font-ui-sm)] text-ink outline-none focus:border-action"
                    >
                      {Object.entries(DEPOSIT_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
