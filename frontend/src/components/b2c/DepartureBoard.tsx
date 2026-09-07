import Link from "next/link";
import { formatTime, t } from "@/lib/i18n";
import type { SearchResult } from "@/lib/types";

/**
 * B2C hero'nun görsel çapası.
 *
 * Büyük bir kapak fotoğrafı yerine bu sayfanın konusuna en özgü şey:
 * bugünün kalkış tablosu. Saatler tabular, satırlar dar — Extranet'teki
 * aynı disiplinin tüketici kaydındaki karşılığı.
 */
export function DepartureBoard({ departures }: { departures: SearchResult[] }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] bg-inverse text-ink-inverse">
      <h2 className="border-b border-ink-inverse-3/30 px-4 py-2.5 font-dense text-[length:var(--font-ui-sm)] text-ink-inverse-2">
        {t("b2c.boardTitle")}
      </h2>
      <ul>
        {departures.map((d) => (
          <li key={d.id}>
            <Link
              href={`/magaza/${d.productId}`}
              className="flex items-center gap-4 border-b border-ink-inverse-3/20 px-4 py-2.5
                         transition-colors last:border-0 hover:bg-ink-inverse/10"
            >
              <span className="tnum font-dense text-xl font-semibold tracking-tight text-white">
                {formatTime(d.startsAt)}
              </span>
              <span className="min-w-0 flex-1 truncate text-[length:var(--font-ui)] text-ink-inverse">
                {d.title}
              </span>
              <span
                className={`tnum shrink-0 text-[length:var(--font-ui-sm)] ${
                  (d.remaining ?? 0) <= 6 ? "text-warning-inverse" : "text-ink-inverse-2"
                }`}
              >
                {t("product.remaining", { count: d.remaining ?? 0 })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
