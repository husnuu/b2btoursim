import Link from "next/link";
import { formatTime, t } from "@/lib/i18n";
import type { DepartureRow, TodayBoard } from "@/lib/storefront/departures";

/**
 * "BUGÜNÜN KALKIŞLARI" — ana sayfanın tam genişlikte koyu bandı.
 *
 * Extranet'teki program disiplininin tüketici tarafı: bugünün TÜM kalkışları,
 * geçmiş saatler dahil (KALKTI olarak). Koyu blok, sayfanın ortasında kontrast
 * kırılması yaratır; reklam gramerinde değil bilgi gramerinde durduğu için
 * "banner körlüğü"ne yakalanmaz.
 */
export function DepartureBoard({ title, board }: { title: string; board: TodayBoard }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="font-dense text-[length:clamp(1.3rem,2.6vw,1.65rem)] font-semibold uppercase tracking-[0.06em] text-ink-inverse">
          {title}
        </h2>
        <span className="tnum text-[length:var(--font-ui-xs)] text-ink-inverse-2">{todayLabel()}</span>
        <span className="ms-auto text-[length:var(--font-ui-xs)] text-ink-inverse-2">{t("b2c.board.liveNote")}</span>
      </div>

      {board.rows.map((d) => (
        <Row key={d.id} row={d} />
      ))}

      {board.tomorrowNext && (
        <p className="pt-3 text-[length:var(--font-ui-xs)] text-ink-inverse-2">
          {t("b2c.board.tomorrow", {
            time: formatTime(board.tomorrowNext.startsAt),
            title: board.tomorrowNext.title,
            count: board.tomorrowNext.remaining,
          })}{" "}
          <Link href={`/magaza/${board.tomorrowNext.tourSlug}`} className="text-ink-inverse underline underline-offset-2">
            {t("b2c.board.tomorrowCta")}
          </Link>
        </p>
      )}
    </div>
  );
}

function Row({ row }: { row: DepartureRow }) {
  // Kalkmış sefer ikinci planda: aynı satır, sönük mürekkep.
  const ink = row.status === "kalkti" ? "text-ink-inverse-2" : "text-ink-inverse";
  return (
    <Link
      href={`/magaza/${row.tourSlug}`}
      className="grid h-11 grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-inverse-raised font-dense
                 transition-colors last:border-b-0 hover:bg-inverse-raised sm:grid-cols-[5.625rem_minmax(0,1fr)_9.375rem_10.625rem] sm:gap-x-0"
    >
      <span className={`tnum text-[length:calc(var(--font-ui)*1.07)] font-semibold ${ink}`}>{formatTime(row.startsAt)}</span>
      <span className={`truncate text-[length:var(--font-ui)] ${ink}`}>{row.title}</span>
      <span className={`tnum hidden text-[length:var(--font-ui-sm)] sm:block ${ink}`}>
        {row.status === "kalkti" ? "—" : t("b2c.board.seats", { count: row.remaining })}
      </span>
      <Status status={row.status} />
    </Link>
  );
}

function Status({ status }: { status: DepartureRow["status"] }) {
  if (status === "sonKoltuklar") {
    return (
      <span className="justify-self-end sm:justify-self-start">
        {/* Hafif eğik çerçeve: elle vurulmuş bir damga gibi, dikkat çeker ama bağırmaz. */}
        <span className="inline-block -rotate-2 rounded-[2px] border-[1.5px] border-warning-inverse px-2 py-0.5 text-[length:var(--font-ui-xs)] font-semibold uppercase tracking-[0.08em] text-warning-inverse">
          {t("b2c.board.sonKoltuklar")}
        </span>
      </span>
    );
  }
  const tone = status === "kalkti" ? "text-ink-inverse-2" : "text-margin-inverse";
  return (
    <span className={`justify-self-end text-[length:var(--font-ui-xs)] font-semibold uppercase tracking-[0.12em] sm:justify-self-start ${tone}`}>
      {status === "kalkti" ? t("b2c.board.kalkti") : t("b2c.board.musait")}
    </span>
  );
}

/** Bandın başlığındaki tarih: "16 Eylül, Çarşamba" — İstanbul saatiyle. */
function todayLabel(): string {
  return new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
    timeZone: "Europe/Istanbul",
  });
}
