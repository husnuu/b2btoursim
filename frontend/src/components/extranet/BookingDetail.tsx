"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate, formatMoney, formatTime, t } from "@/lib/i18n";
import {
  bookingTotals,
  marginAmount,
  salePrice,
  supplierReference,
  type Booking,
} from "@/lib/types";
import {
  STATUS_META,
  canTransition,
  isTerminal,
  needsConfirmation,
  type BookingStatus,
} from "@/lib/booking-status";
import { Button, ButtonLink } from "@/components/primitives/Button";
import { StatusBadge } from "@/components/primitives/StatusBadge";
import { SupplierMark } from "@/components/primitives/SupplierMark";
import { ConfirmDialog } from "@/components/primitives/ConfirmDialog";
import { useToast } from "@/components/primitives/Toast";

/**
 * Rezervasyon detayı, değişiklik ve iptal — Sitemap Bölüm 2 (MVP).
 *
 * Bölüm 3.3'ün kuralı burada uygulanıyor: geri alınabilir işlemler onay
 * sormaz, "geri al" sunar; tedarikçiye giden iptal geri alınamadığı için
 * onay ister. Hangi işlemin görüneceğini durum makinesi belirler — buton
 * listesi elle yazılmaz.
 */
export function BookingDetail({ booking }: { booking: Booking }) {
  const [status, setStatus] = useState<BookingStatus>(booking.status);
  const [confirming, setConfirming] = useState<BookingStatus | null>(null);
  const { notify } = useToast();

  const totals = bookingTotals(booking);
  const meta = STATUS_META[status];
  const supplierRef = supplierReference(booking);

  const apply = (next: BookingStatus) => {
    const previous = status;
    setStatus(next);
    if (next === "cancelled") {
      notify(t("booking.cancelled", { ref: booking.ref }));
    } else {
      notify(t("booking.cancelled", { ref: booking.ref }), () => setStatus(previous));
    }
  };

  const request = (next: BookingStatus) => {
    if (needsConfirmation(next)) setConfirming(next);
    else apply(next);
  };

  const policy =
    booking.items[0] && "hoursBefore" in (booking.items[0] as object)
      ? ""
      : t("results.freeCancel", { hours: 24 });

  return (
    <div className="mx-auto w-full max-w-[72rem] px-[var(--pad-x)] py-5">
      <Link
        href="/extranet/rezervasyonlar"
        className="text-[length:var(--font-ui-sm)] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
      >
        {t("booking.back")}
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-dense text-xl font-medium text-ink">
              {t("booking.title", { ref: booking.ref })}
            </h1>
            <StatusBadge status={status} />
          </div>
          <p className="mt-1 text-ink-2">{booking.items[0].title}</p>
        </div>

        <dl className="grid grid-cols-[auto_auto] items-baseline gap-x-5 gap-y-1 text-[length:var(--font-ui-sm)]">
          <dt className="text-ink-3">{t("results.col.supplier")}</dt>
          <dd><SupplierMark supplier={booking.supplier} showName /></dd>
          <dt className="text-ink-3">{t("booking.supplierRef")}</dt>
          <dd className="tnum text-ink">{supplierRef ?? "—"}</dd>
          <dt className="text-ink-3">{t("booking.createdAt")}</dt>
          <dd className="tnum text-ink">{formatDate(booking.createdAt)}</dd>
          <dt className="text-ink-3">{t("booking.travelDate")}</dt>
          <dd className="tnum text-ink">{formatDate(booking.travelDate)}</dd>
        </dl>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div>
          {/* Kalemler */}
          <section>
            <h2 className="mb-2 font-dense text-base font-medium text-ink">
              {t("booking.items")}
            </h2>
            <table className="w-full border-collapse font-dense">
              <thead>
                <tr className="border-b border-line-strong text-[length:var(--font-ui-xs)] text-ink-3">
                  <th scope="col" className="py-1.5 text-start font-normal">
                    {t("product.optionCol.name")}
                  </th>
                  <th scope="col" className="w-20 px-2 py-1.5 text-start font-normal">
                    {t("results.col.time")}
                  </th>
                  <th scope="col" className="w-20 px-2 py-1.5 text-end font-normal">
                    {t("booking.col.qty")}
                  </th>
                  <th scope="col" className="w-28 px-2 py-1.5 text-end font-normal">
                    {t("results.col.net")}
                  </th>
                  <th scope="col" className="w-24 px-2 py-1.5 text-end font-normal">
                    {t("results.col.margin")}
                  </th>
                  <th scope="col" className="w-28 py-1.5 text-end font-normal">
                    {t("results.col.sale")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {booking.items.map((item) => (
                  <tr key={item.id} className="border-b border-line">
                    <td className="py-2 pe-3">
                      <p className="text-[length:var(--font-ui)] text-ink">{item.title}</p>
                      <p className="text-[length:var(--font-ui-sm)] text-ink-2">
                        {item.variantName}
                      </p>
                    </td>
                    <td className="tnum px-2 text-[length:var(--font-ui-sm)] text-ink-2">
                      {formatTime(item.startsAt)}
                    </td>
                    <td className="tnum px-2 text-end text-[length:var(--font-ui)] text-ink">
                      {item.quantity}
                    </td>
                    <td className="tnum px-2 text-end text-[length:var(--font-ui-sm)] text-ink-3">
                      {formatMoney(item.unitPrice * item.quantity)}
                    </td>
                    <td className="tnum px-2 text-end text-[length:var(--font-ui-sm)] text-margin-field">
                      {formatMoney(marginAmount(item.unitPrice, item.marginPct) * item.quantity)}
                    </td>
                    <td className="tnum text-end text-[length:calc(var(--font-ui)*1.1)] font-semibold text-ink">
                      {formatMoney(salePrice(item.unitPrice, item.marginPct) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-2 text-[length:var(--font-ui)] text-ink-2">
                    {t("common.total")}
                  </td>
                  <td className="tnum px-2 py-2 text-end text-[length:var(--font-ui-sm)] text-ink-3">
                    {formatMoney(totals.net)}
                  </td>
                  <td className="tnum px-2 py-2 text-end text-[length:var(--font-ui-sm)] text-margin-field">
                    {formatMoney(totals.margin)}
                  </td>
                  <td className="tnum py-2 text-end text-[length:calc(var(--font-ui)*1.3)] font-semibold text-ink">
                    {formatMoney(totals.sale)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          {/* Durum geçmişi */}
          <section className="mt-8">
            <h2 className="mb-2 font-dense text-base font-medium text-ink">
              {t("booking.timeline")}
            </h2>
            <ol className="border-t border-line">
              <TimelineRow
                at={formatDate(booking.createdAt)}
                status="draft"
                note={t("status.draft")}
              />
              <TimelineRow
                at={formatDate(booking.createdAt)}
                status="pending"
                note={t("checkout.confirming")}
              />
              {status !== "pending" && status !== "draft" && (
                <TimelineRow at={formatDate(booking.travelDate)} status={status} note={t(meta.label)} />
              )}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          {/* Katılımcı */}
          <section className="rounded-[var(--radius-lg)] border border-line-strong bg-surface p-4">
            <h2 className="font-dense text-[length:calc(var(--font-ui)*1.05)] font-medium text-ink">
              {t("booking.customer")}
            </h2>
            <p className="mt-2 text-[length:var(--font-ui)] text-ink">
              {booking.customer.fullName}
            </p>
            {booking.customer.email && (
              <p className="text-[length:var(--font-ui-sm)] text-ink-2">
                {booking.customer.email}
              </p>
            )}
            {booking.customer.phone && (
              <p className="tnum text-[length:var(--font-ui-sm)] text-ink-2">
                {booking.customer.phone}
              </p>
            )}
            {booking.note && (
              <>
                <p className="mt-3 text-[length:var(--font-ui-sm)] text-ink-3">
                  {t("checkout.note")}
                </p>
                <p className="text-[length:var(--font-ui-sm)] text-ink">{booking.note}</p>
              </>
            )}
          </section>

          {/* İşlemler — durum makinesi ne izin veriyorsa o görünür. */}
          <section className="rounded-[var(--radius-lg)] border border-line-strong bg-surface p-4">
            <h2 className="font-dense text-[length:calc(var(--font-ui)*1.05)] font-medium text-ink">
              {t("booking.actions")}
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              {status === "confirmed" && (
                <ButtonLink href={`/extranet/voucher/${booking.ref}`}>
                  {t("booking.downloadVoucher")}
                </ButtonLink>
              )}
              {canTransition(status, "partiallyCancelled") && (
                <Button onClick={() => request("partiallyCancelled")}>
                  {t("booking.cancelPartial")}
                </Button>
              )}
              {canTransition(status, "cancelled") && (
                <Button variant="danger" onClick={() => request("cancelled")}>
                  {t("booking.cancel")}
                </Button>
              )}
              {isTerminal(status) && (
                <p className="text-[length:var(--font-ui-sm)] text-ink-3">
                  {t("booking.noActions")}
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirming !== null}
        title={t("booking.confirmCancelTitle")}
        body={t("booking.confirmCancelBody", { policy: policy || "—" })}
        confirmLabel={t("booking.confirmCancelAction")}
        tone="danger"
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) apply(confirming);
          setConfirming(null);
        }}
      />
    </div>
  );
}

function TimelineRow({
  at,
  status,
  note,
}: {
  at: string;
  status: BookingStatus;
  note: string;
}) {
  return (
    <li className="flex items-center gap-4 border-b border-line py-2">
      <span className="tnum w-32 shrink-0 text-[length:var(--font-ui-sm)] text-ink-2">
        {at}
      </span>
      <StatusBadge status={status} />
      <span className="text-[length:var(--font-ui-sm)] text-ink-2">{note}</span>
    </li>
  );
}
