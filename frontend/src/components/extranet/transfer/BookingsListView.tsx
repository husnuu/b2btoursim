"use client";

import { useMemo, useState } from "react";
import { AGENCY } from "@/data/mock";
import { EmptyState } from "@/components/primitives/States";
import { TransferOperationStatusBadge } from "@/components/primitives/TransferOperationStatusBadge";
import { formatMoney } from "@/lib/i18n";
import { useTransferCatalog } from "@/lib/transfer-store";
import type { TransferBookingModel } from "@/lib/transfer";

const MODEL_LABELS: Record<TransferBookingModel, string> = {
  nokta: "Nokta Bazlı",
  harita: "Harita Bazlı",
  saatlik: "Saatlik Kiralama",
};

/** 5.1 Rezervasyonlar — üç modelin ortak listesi. */
export function BookingsListView() {
  const { bookings } = useTransferCatalog();
  const [dateFilter, setDateFilter] = useState<"tumZamanlar" | "bugun">("tumZamanlar");

  const rows = useMemo(() => {
    if (dateFilter === "tumZamanlar") return bookings;
    const today = new Date().toISOString().slice(0, 10);
    return bookings.filter((b) => b.date === today);
  }, [bookings, dateFilter]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-[var(--pad-x)] py-2.5">
        <h1 className="font-dense text-base font-medium text-ink">Rezervasyonlar</h1>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as "tumZamanlar" | "bugun")}
          className="ms-auto h-8 rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 text-[length:var(--font-ui-sm)] text-ink outline-none focus:border-action"
        >
          <option value="tumZamanlar">Tüm zamanlar</option>
          <option value="bugun">Bugün</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Şu anda rezervasyonunuz bulunmamaktadır" body="Nokta, Harita veya Saatlik Kiralama modelinden bir rezervasyon oluşturun." />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div role="row" className="flex items-center gap-[var(--gap)] border-b border-line-strong px-[var(--pad-x)] py-1.5 text-[length:var(--font-ui-xs)] text-ink-3">
            <span className="w-28">Rezervasyon ID</span>
            <span className="w-32">Müşteri/Acente</span>
            <span className="min-w-0 flex-1">Güzergah/Nokta</span>
            <span className="w-28">Tarih-Saat</span>
            <span className="w-32">Araç</span>
            <span className="w-24 text-end">Tutar</span>
            <span className="w-32">Durum</span>
          </div>
          {rows.map((booking) => (
            <div key={booking.id} role="row" className="flex items-center gap-[var(--gap)] border-b border-line px-[var(--pad-x)] py-2">
              <span className="tnum w-28 truncate text-[length:var(--font-ui-sm)] text-ink-3">{booking.id}</span>
              <span className="w-32 truncate text-[length:var(--font-ui-sm)] text-ink-2">{AGENCY.name}</span>
              <span className="min-w-0 flex-1 truncate text-[length:var(--font-ui)] text-ink">
                {booking.fromLabel} → {booking.toLabel}
                <span className="ms-2 text-[length:var(--font-ui-xs)] text-ink-3">{MODEL_LABELS[booking.model]}</span>
              </span>
              <span className="tnum w-28 text-[length:var(--font-ui-sm)] text-ink-2">
                {booking.date || "—"} {booking.time}
              </span>
              <span className="w-32 truncate text-[length:var(--font-ui-sm)] text-ink-2">{booking.vehicleTitleSnapshot}</span>
              <span className="tnum w-24 text-end text-[length:var(--font-ui-sm)] font-medium text-ink">
                {formatMoney(booking.price, booking.currency)}
              </span>
              <span className="w-32">
                <TransferOperationStatusBadge status={booking.operationStatus} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
