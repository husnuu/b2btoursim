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
  return (
    <article className="group flex flex-col">
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
              className="absolute bottom-2 left-2 rounded-[var(--radius)] bg-surface/95 px-2 py-0.5
                         text-[length:var(--font-ui-sm)] font-medium text-danger"
            >
              {t("b2c.lastSpots")}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-[length:calc(var(--font-ui)*1.1)] font-medium leading-snug text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
            {result.title}
          </h3>

          <div className="flex flex-wrap items-baseline gap-x-4 text-[length:var(--font-ui-sm)] text-ink-2">
            <span className="tnum">{formatDuration(result.durationMinutes)}</span>
            {result.cancellation.type === "free" && (
              <span className="text-success">{t("b2c.freeCancel")}</span>
            )}
            <span>{t("b2c.languages", { languages: result.languages.join(", ") })}</span>
          </div>

          <div className="mt-1 flex items-baseline justify-between gap-3">
            <span className="tnum flex items-baseline gap-2 text-[length:var(--font-ui-sm)]">
              <span className="font-medium text-ink">{result.rating?.toLocaleString("tr-TR", { minimumFractionDigits: 1 })}</span>
              <span className="text-ink-3">
                {t("b2c.reviews", { count: formatNumber(result.reviewCount ?? 0) })}
              </span>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-[length:var(--font-ui-sm)] text-ink-3">
                {t("b2c.from")}
              </span>
              <PriceDisplay
                net={result.net}
                marginPct={result.defaultMarginPct}
                mode="retail"
                size="md"
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
