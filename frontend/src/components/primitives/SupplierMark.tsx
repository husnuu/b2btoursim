import type { Supplier } from "@/lib/types";

/**
 * Bölüm 3.3: sonuç hangi tedarikçiden geldi, acente bunu görmeli —
 * sorumluluk ve iptal politikası tedarikçiye bağlı.
 *
 * Dar kolonlarda iki harflik kod, geniş alanlarda tam ad görünür.
 *
 * `tone="inverse"` koyu yüzeyler için: aynı bileşen açık zemin renkleriyle
 * koyu panele konduğunda ad okunmaz hale geliyordu.
 */
export function SupplierMark({
  supplier,
  showName = false,
  tone = "default",
  className = "",
}: {
  supplier: Supplier;
  showName?: boolean;
  tone?: "default" | "inverse";
  className?: string;
}) {
  const inverse = tone === "inverse";

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        aria-hidden={showName ? "true" : undefined}
        title={showName ? undefined : supplier.name}
        className={`inline-grid h-[1.125rem] min-w-[1.75rem] place-items-center rounded-[2px]
                    border px-1 font-dense text-[length:var(--font-ui-xs)] font-semibold
                    leading-none ${
                      inverse
                        ? "border-ink-inverse-3/45 bg-transparent text-ink-inverse-2"
                        : "border-line-strong bg-sunken text-ink-2"
                    }`}
      >
        {supplier.code}
      </span>
      {showName ? (
        <span
          className={`truncate text-[length:var(--font-ui-sm)] ${
            inverse ? "text-ink-inverse-2" : "text-ink-2"
          }`}
        >
          {supplier.name}
        </span>
      ) : (
        <span className="sr-only">{supplier.name}</span>
      )}
    </span>
  );
}
