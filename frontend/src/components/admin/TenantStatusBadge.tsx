import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import type { TenantStatus } from "@/lib/types";

/** Kiracı durumu — renk tek başına anlam taşımasın diye işaretle birlikte. */
const META: Record<TenantStatus, { label: MessageKey; cls: string; glyph: string }> = {
  trial: { label: "tenantStatus.trial", cls: "text-info bg-info-tint border-info/25", glyph: "◔" },
  active: { label: "tenantStatus.active", cls: "text-success bg-success-tint border-success/25", glyph: "✓" },
  suspended: { label: "tenantStatus.suspended", cls: "text-warning bg-warning-tint border-warning/25", glyph: "‖" },
  closed: { label: "tenantStatus.closed", cls: "text-neutral bg-neutral-tint border-neutral/25", glyph: "✕" },
};

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const m = META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius)] border px-1.5 py-px font-dense text-[length:var(--font-ui-sm)] leading-5 ${m.cls}`}
    >
      <span aria-hidden="true" className="text-[0.9em] leading-none">{m.glyph}</span>
      {t(m.label)}
    </span>
  );
}
