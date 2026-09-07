import { t } from "@/lib/i18n";

/** Boş beyaz ekran yerine iskelet — Bölüm 7. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton block rounded-[2px] ${className}`} />;
}

/** Sonuç tablosu için satır iskeleti; gerçek satırla aynı yükseklikte. */
export function ResultRowSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label={t("search.searching")}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rule-b flex h-[var(--row-h)] items-center gap-[var(--gap)] px-[var(--pad-x)]"
          style={{ opacity: 1 - i * 0.18 }}
        >
          <Skeleton className="h-5 w-5 shrink-0" />
          <Skeleton className="h-3 w-[min(28rem,38%)]" />
          <Skeleton className="ms-auto h-3 w-16" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      ))}
    </div>
  );
}
