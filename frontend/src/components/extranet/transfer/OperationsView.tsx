"use client";

import { useMemo, useState } from "react";
import { TextField } from "@/components/primitives/Field";
import { TransferOperationStatusBadge } from "@/components/primitives/TransferOperationStatusBadge";
import { formatDate } from "@/lib/i18n";
import { useTransferCatalog } from "@/lib/transfer-store";
import type { TransferOperationStatus } from "@/lib/transfer";

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const STATUS_ORDER: TransferOperationStatus[] = ["planlamaBekliyor", "aktifTransfer", "tamamlandi"];

/**
 * 5.2 Operasyon — lojistik/saha yürütme perspektifi. "Zamanlama Haritası"
 * (Faz3) burada gerçek bir takvim/harita widget'ı değil, günlere gruplu
 * basit bir liste olarak uygulanır (bkz. plan Varsayım 2).
 */
export function OperationsView() {
  const { bookings, setBookingOperationStatus, updateBookingAssignment } = useTransferCatalog();
  const [rangeStart, setRangeStart] = useState(isoDate(0));
  const [rangeEnd, setRangeEnd] = useState(isoDate(7));
  const [showHelp, setShowHelp] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [driverName, setDriverName] = useState("");
  const [driverNote, setDriverNote] = useState("");

  const inRange = useMemo(
    () => bookings.filter((b) => (!b.date || (b.date >= rangeStart && b.date <= rangeEnd))),
    [bookings, rangeStart, rangeEnd],
  );

  const counts = useMemo(() => {
    const map: Record<TransferOperationStatus, number> = { planlamaBekliyor: 0, aktifTransfer: 0, tamamlandi: 0 };
    for (const b of inRange) map[b.operationStatus] += 1;
    return map;
  }, [inRange]);

  const byDay = useMemo(() => {
    const groups = new Map<string, typeof inRange>();
    for (const b of inRange) {
      const key = b.date || "Tarihsiz";
      groups.set(key, [...(groups.get(key) ?? []), b]);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [inRange]);

  const startAssign = (id: string, currentName: string, currentNote: string) => {
    setAssigning(id);
    setDriverName(currentName);
    setDriverNote(currentNote);
  };

  const saveAssign = (id: string) => {
    updateBookingAssignment(id, driverName, driverNote);
    setAssigning(null);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-[var(--pad-x)] py-5">
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="font-dense text-base font-medium text-ink">Transfer Operasyonu</h1>
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

      <button
        type="button"
        onClick={() => setShowHelp((v) => !v)}
        className="self-start text-[length:var(--font-ui-sm)] text-ink-3 underline decoration-line-strong underline-offset-2 hover:text-ink"
      >
        Nasıl Çalışıyor?
      </button>
      {showHelp && (
        <div className="rounded-[var(--radius-lg)] border border-line-strong bg-sunken p-3 text-[length:var(--font-ui-sm)] text-ink-2">
          Bu ekran, seçili tarih aralığındaki tüm transfer rezervasyonlarını saha
          yürütme durumuna göre gruplar. Bir rezervasyon oluşturulduğunda
          &quot;Planlama Bekliyor&quot; olarak başlar; operasyon ekibi transfer
          gerçekleşirken &quot;Aktif Transfer&quot;e, tamamlandığında
          &quot;Tamamlandı&quot;ya çeker. Şoför/araç atama her satırdan yapılır.
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h2 className="text-[length:var(--font-ui-sm)] font-medium uppercase tracking-wide text-ink-3">
          Zamanlama Haritası
        </h2>
        {byDay.length === 0 ? (
          <p className="text-[length:var(--font-ui-sm)] text-ink-3">Bu aralıkta transfer yok.</p>
        ) : (
          byDay.map(([day, items]) => (
            <div key={day} className="flex flex-col gap-2">
              <p className="text-[length:var(--font-ui-sm)] font-medium text-ink">
                {day === "Tarihsiz" ? day : formatDate(`${day}T00:00:00.000Z`)}
              </p>
              {items.map((booking) => (
                <div key={booking.id} className="flex flex-col gap-2 rounded-[var(--radius)] border border-line p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[length:var(--font-ui)] text-ink">
                        {booking.time} · {booking.fromLabel} → {booking.toLabel}
                      </p>
                      <p className="text-[length:var(--font-ui-sm)] text-ink-3">{booking.vehicleTitleSnapshot}</p>
                    </div>
                    <select
                      value={booking.operationStatus}
                      onChange={(e) => setBookingOperationStatus(booking.id, e.target.value as TransferOperationStatus)}
                      className="h-7 shrink-0 rounded-[var(--radius)] border border-line-strong bg-surface text-[length:var(--font-ui-sm)] text-ink outline-none focus:border-action"
                    >
                      <option value="planlamaBekliyor">Planlama Bekliyor</option>
                      <option value="aktifTransfer">Aktif Transfer</option>
                      <option value="tamamlandi">Tamamlandı</option>
                    </select>
                  </div>
                  {assigning === booking.id ? (
                    <div className="flex items-end gap-2">
                      <TextField label="Şoför adı" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
                      <TextField label="Not" value={driverNote} onChange={(e) => setDriverNote(e.target.value)} />
                      <button
                        type="button"
                        onClick={() => saveAssign(booking.id)}
                        className="h-9 shrink-0 rounded-[var(--radius)] border border-line-strong bg-surface px-3 text-[length:var(--font-ui-sm)] text-ink hover:bg-sunken"
                      >
                        Kaydet
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startAssign(booking.id, booking.assignedDriverName, booking.assignedDriverNote)}
                      className="self-start text-[length:var(--font-ui-sm)] text-ink-3 underline decoration-line-strong underline-offset-2 hover:text-ink"
                    >
                      {booking.assignedDriverName ? `Şoför: ${booking.assignedDriverName}` : "Şoför/araç ata"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
