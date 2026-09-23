import Link from "next/link";
import { formatDuration, formatNumber, t } from "@/lib/i18n";
import type { SearchResult } from "@/lib/types";
import { PriceDisplay } from "@/components/primitives/PriceDisplay";

/**
 * B2C ürün kartı — ResultRow'un muadili ama aynı bileşen DEĞİL (Bölüm 7).
 *
 * Buradaki fiyat her zaman retail: net ve marj B2C yüzeyinde hiçbir koşulda
 * görünmez. Kart görsel ağırlıklı ve comfortable yoğunlukta çalışır.
 */
export function ProductCard({
  result,
  urgent = false,
}: {
  result: SearchResult;
  urgent?: boolean;
}) {
  const showRating = (result.reviewCount ?? 0) > 0;

  return (
    <article className="group flex flex-col transition-transform duration-200 hover:-translate-y-0.5">
      <Link href={`/magaza/${result.productId}`} className="flex flex-col gap-3">
        <div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-lg)]"
          style={{ background: result.imageTone }}
        >
          {/* Görsel yer tutucu: CDN'den WebP/AVIF, lazy, boyutlandırılmış. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 opacity-30 mix-blend-overlay"
            style={{ backgroundImage: "var(--image-sheen)" }}
          />
          {urgent && (
            <span
              className="absolute bottom-2.5 left-2.5 rounded-full bg-surface px-2.5 py-1
                         text-[length:var(--font-ui-xs)] font-semibold text-danger shadow-[var(--shadow-raised)]"
            >
              {t("b2c.lastSpots")}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5 px-0.5">
          <h3 className="font-dense text-[length:calc(var(--font-ui)*1.15)] font-medium leading-snug tracking-[0.01em] text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
            {result.title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[length:var(--font-ui-xs)] text-ink-3">
            <span className="tnum inline-flex items-center gap-1">
              <ClockIcon /> {formatDuration(result.durationMinutes)}
            </span>
            <span className="inline-flex items-center gap-1">
              <GlobeIcon /> {t("b2c.languages", { languages: result.languages.join(", ") })}
            </span>
            {result.cancellation.type === "free" && (
              <span className="text-success">{t("b2c.freeCancel")}</span>
            )}
          </div>

          <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-line pt-2">
            {showRating ? (
              <span className="tnum flex items-baseline gap-1.5 text-[length:var(--font-ui-sm)]">
                <span className="font-medium text-ink">{result.rating?.toLocaleString("tr-TR", { minimumFractionDigits: 1 })}</span>
                <span className="text-ink-3">
                  {t("b2c.reviews", { count: formatNumber(result.reviewCount ?? 0) })}
                </span>
              </span>
            ) : (
              <span className="text-[length:var(--font-ui-sm)] font-medium text-ink underline decoration-line-strong underline-offset-2">
                {t("b2c.viewDetail")}
              </span>
            )}
            <span className="flex flex-col items-end leading-none">
              <span className="text-[length:var(--font-ui-xs)] text-ink-3">{t("b2c.from")}</span>
              <PriceDisplay
                net={result.net}
                marginPct={result.defaultMarginPct}
                mode="retail"
                size="md"
                tone="text-warning"
                className="mt-0.5"
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9s1.3-6.3 3.8-9Z" />
    </svg>
  );
}
