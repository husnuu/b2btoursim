import { VISA_STATUS_META, type VisaStatus } from "@/lib/visa-status";
import type { StatusTone } from "@/lib/booking-status";
import { t } from "@/lib/i18n";

const tones: Record<StatusTone, string> = {
  info: "text-info bg-info-tint border-info/25",
  warning: "text-warning bg-warning-tint border-warning/25",
  neutral: "text-neutral bg-neutral-tint border-neutral/25",
  success: "text-success bg-success-tint border-success/25",
  danger: "text-danger bg-danger-tint border-danger/25",
};

export function VisaStatusBadge({ status, className = "" }: { status: VisaStatus; className?: string }) {
  const meta = VISA_STATUS_META[status];
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
