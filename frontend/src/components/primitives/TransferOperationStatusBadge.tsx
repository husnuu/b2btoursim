import { OPERATION_STATUS_META } from "@/lib/transfer-status";
import type { TransferOperationStatus } from "@/lib/transfer";
import type { StatusTone } from "@/lib/booking-status";
import { t } from "@/lib/i18n";

const tones: Record<StatusTone, string> = {
  info: "text-info bg-info-tint border-info/25",
  warning: "text-warning bg-warning-tint border-warning/25",
  neutral: "text-neutral bg-neutral-tint border-neutral/25",
  success: "text-success bg-success-tint border-success/25",
  danger: "text-danger bg-danger-tint border-danger/25",
};

export function TransferOperationStatusBadge({
  status,
  className = "",
}: {
  status: TransferOperationStatus;
  className?: string;
}) {
  const meta = OPERATION_STATUS_META[status];
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
