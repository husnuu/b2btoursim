import Link from "next/link";
import { formatTime, t } from "@/lib/i18n";
import type { SearchResult } from "@/lib/types";

/**
 * B2C hero'nun görsel çapası.
 *
 * Büyük bir kapak fotoğrafı yerine bu sayfanın konusuna en özgü şey:
 * bugünün kalkış tablosu. Saatler tabular, satırlar dar — Extranet'teki
 * aynı disiplinin tüketici kaydındaki karşılığı. "Perfeksiyon" geçişi:
 * saat sütunu daha büyük, canlı kontenjan notu eklendi.
 */
export function DepartureBoard({ departures }: { departures: SearchResult[] }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] bg-inverse text-ink-inverse shadow-[var(--shadow-raised)]">
      <div className="flex items-baseline gap-3 border-b border-ink-inverse-3/30 px-4 py-3">
        <h2 className="font-dense text-[length:var(--font-ui-sm)] font-medium uppercase tracking-wide text-ink-inverse">
          {t("b2c.boardTitle")}
        </h2>
        <span className="ms-auto text-[length:var(--font-ui-xs)] text-ink-inverse-3">{t("b2c.boardLive")}</span>
      </div>
      <ul>
        {departures.map((d) => (
          <li key={d.id}>
            <Link
              href={`/magaza/${d.productId}`}
              className="flex items-center gap-4 border-b border-ink-inverse-3/20 px-4 py-3
                         transition-colors last:border-0 hover:bg-ink-inverse/10"
            >
              <span className="tnum font-dense text-2xl font-semibold leading-none tracking-tight text-white">
                {formatTime(d.startsAt)}
              </span>
              <span className="min-w-0 flex-1 truncate text-[length:var(--font-ui)] text-ink-inverse">
                {d.title}
              </span>
              <span
                className={`tnum shrink-0 text-[length:var(--font-ui-sm)] ${
                  (d.remaining ?? 0) <= 6 ? "font-medium text-warning-inverse" : "text-ink-inverse-2"
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
