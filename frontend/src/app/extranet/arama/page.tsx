import Link from "next/link";
import { RECENT_SEARCHES } from "@/data/mock";
import { formatShortDate, t } from "@/lib/i18n";
import { SearchBar } from "@/components/extranet/SearchBar";
import { SearchTabs } from "@/components/extranet/SearchTabs";

/** Arama girişi — sekmeli widget (Sitemap Bölüm 5.2, MVP). */
export default function AramaPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-[var(--pad-x)] py-10">
      <h1 className="text-2xl font-medium text-ink">{t("search.heading")}</h1>
      <p className="mt-1 max-w-[60ch] text-ink-2">{t("search.emptyBody")}</p>

      <div className="mt-6 border-b border-line">
        <SearchTabs active="tur" />
      </div>
      <div className="mt-4">
        <SearchBar autoFocus />
      </div>

      <section className="mt-10">
        <h2 className="text-[length:var(--font-ui-sm)] text-ink-3">
          {t("search.recent")}
        </h2>
        <ul className="mt-2 border-t border-line">
          {RECENT_SEARCHES.map((s) => {
            const params = new URLSearchParams({
              nereye: s.destination,
              tarih: s.date.slice(0, 10),
              yetiskin: String(s.adults),
              cocuk: String(s.children),
            });
            return (
              <li key={s.destination}>
                <Link
                  href={`/extranet/arama/${s.type === "hotel" ? "otel" : "tur"}?${params}`}
                  className="flex h-[var(--row-h)] items-center gap-6 border-b border-line px-1 hover:bg-action-tint"
                >
                  <span className="w-40 font-dense text-[length:var(--font-ui)] font-medium text-ink">
                    {s.destination}
                  </span>
                  <span className="w-24 text-[length:var(--font-ui-sm)] text-ink-2">
                    {t(s.type === "hotel" ? "search.tabHotel" : "search.tabTour")}
                  </span>
                  <span className="tnum w-24 text-[length:var(--font-ui-sm)] text-ink-2">
                    {formatShortDate(s.date)}
                  </span>
                  <span className="text-[length:var(--font-ui-sm)] text-ink-2">
                    {t("search.paxSummary", { adults: s.adults, children: s.children })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
