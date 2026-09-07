"use client";

import { t } from "@/lib/i18n";
import type { SupplierProgress } from "@/lib/types";

/**
 * Bölüm 3.3: kademeli sonuç yükleme + kısmi hata.
 *
 * Her tedarikçi kendi segmentine sahip: bekliyor / yanıtladı / yanıt vermedi.
 * Kısmi hata kenar durum değil, günlük gerçek — düşen kaynak listeden
 * silinmez, kendi segmentinde "tekrar dene" ile durur.
 */
export function SupplierStatusStrip({
  progress,
  onRetry,
}: {
  progress: SupplierProgress[];
  onRetry: (supplierId: string) => void;
}) {
  const done = progress.filter((p) => p.state !== "pending").length;
  const total = progress.length;
  const complete = done === total;

  return (
    <div
      className="sticky top-0 z-20 flex flex-wrap items-center gap-x-4 gap-y-1.5
                 border-b border-line bg-surface/95 px-[var(--pad-x)] py-1.5 backdrop-blur"
    >
      <p
        className="tnum shrink-0 text-[length:var(--font-ui-sm)] text-ink-2"
        aria-live="polite"
      >
        {complete
          ? t("suppliers.complete", { total })
          : t("suppliers.progress", { done, total })}
      </p>

      <ul className="flex flex-wrap items-center gap-1.5">
        {progress.map((p) => (
          <li key={p.supplier.id}>
            {p.state === "failed" ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-[var(--radius)] border
                           border-danger/35 bg-danger-tint py-px pe-1 ps-1.5
                           text-[length:var(--font-ui-xs)] text-danger"
              >
                <b className="font-dense font-semibold">{p.supplier.code}</b>
                <span>{t("suppliers.failed")}</span>
                <button
                  type="button"
                  onClick={() => onRetry(p.supplier.id)}
                  className="rounded-[2px] border border-danger/40 bg-surface px-1.5
                             font-medium text-danger hover:bg-danger hover:text-white"
                >
                  {t("suppliers.retry")}
                </button>
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 rounded-[var(--radius)] border px-1.5 py-px
                            text-[length:var(--font-ui-xs)] ${
                              p.state === "responded"
                                ? "border-success/30 bg-success-tint text-success"
                                : "border-line bg-sunken text-ink-3"
                            }`}
              >
                <b className="font-dense font-semibold">{p.supplier.code}</b>
                {p.state === "responded" ? (
                  <span className="tnum">
                    {t("suppliers.resultCount", { count: p.resultCount })}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-3"
                    />
                    {t("suppliers.pending")}
                  </span>
                )}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
