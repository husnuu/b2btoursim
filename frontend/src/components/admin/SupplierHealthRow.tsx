import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import type { Supplier } from "@/lib/types";
import { AdminRow, Cell } from "./AdminTable";
import { SupplierMark } from "@/components/primitives/SupplierMark";

const STATUS: Record<string, { label: MessageKey; cls: string; glyph: string }> = {
  sandbox: { label: "supplierStatus.sandbox", cls: "text-info", glyph: "◔" },
  active: { label: "supplierStatus.active", cls: "text-success", glyph: "✓" },
  degraded: { label: "supplierStatus.degraded", cls: "text-warning", glyph: "!" },
  disabled: { label: "supplierStatus.disabled", cls: "text-ink-3", glyph: "✕" },
};

/**
 * Tedarikçi sağlık satırı.
 *
 * Eşikler ekranda sabit: %99 altı çalışma süresi ve %5 üstü hata oranı
 * uyarı rengine döner. Operatör hangi sayının kötü olduğunu bilmek zorunda
 * kalmasın diye renk kararı burada veriliyor.
 */
export function SupplierHealthRow({ supplier }: { supplier: Supplier }) {
  const st = STATUS[supplier.status];
  const slowish = supplier.avgLatencyMs > 5000;
  const errorish = supplier.errorRatePct > 5;
  const downish = supplier.uptimePct < 99;

  return (
    <AdminRow>
      <Cell>
        <span className="flex items-center gap-2">
          <SupplierMark supplier={supplier} />
          {supplier.name}
        </span>
      </Cell>
      <Cell>
        <span className={`flex items-center gap-1.5 text-[length:var(--font-ui-sm)] ${st.cls}`}>
          <span aria-hidden="true">{st.glyph}</span>
          {t(st.label)}
        </span>
      </Cell>
      <Cell align="end" className={`tnum ${downish ? "text-warning" : "text-ink-2"}`}>
        %{supplier.uptimePct.toFixed(2)}
      </Cell>
      <Cell align="end" className={`tnum ${slowish ? "text-warning" : "text-ink-2"}`}>
        {supplier.avgLatencyMs} ms
      </Cell>
      <Cell align="end" className={`tnum ${errorish ? "text-danger" : "text-ink-2"}`}>
        %{supplier.errorRatePct.toFixed(1)}
      </Cell>
    </AdminRow>
  );
}
