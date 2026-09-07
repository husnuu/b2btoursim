import { STATUS_META, type BookingStatus, type StatusTone } from "@/lib/booking-status";
import { t } from "@/lib/i18n";

/**
 * Rezervasyon durumu. Bölüm 3.3 + 8: sadece renkle ayırmak yetmez —
 * her durum kendi işaretiyle birlikte gelir, renk körlüğünde de okunur.
 */

const tones: Record<StatusTone, string> = {
  info: "text-info bg-info-tint border-info/25",
  warning: "text-warning bg-warning-tint border-warning/25",
  neutral: "text-neutral bg-neutral-tint border-neutral/25",
  success: "text-success bg-success-tint border-success/25",
  danger: "text-danger bg-danger-tint border-danger/25",
};

export function StatusBadge({
  status,
  className = "",
}: {
  status: BookingStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius)] border px-1.5 py-px font-dense text-[length:var(--font-ui-sm)] leading-5 ${tones[meta.tone]} ${className}`}
    >
      <span aria-hidden="true" className="text-[0.9em] leading-none">
        {meta.glyph}
      </span>
      {t(meta.label)}
    </span>
  );
}
