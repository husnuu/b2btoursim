import Link from "next/link";
import {
  AGENCY,
  AGENCY_STATS,
  ANNOUNCEMENTS,
  BOOKINGS,
  CURRENT_USER,
} from "@/data/mock";
import { formatMoney, formatShortDate, t } from "@/lib/i18n";
import { primaryItem, salePrice } from "@/lib/types";
import { SearchBar } from "@/components/extranet/SearchBar";
import { SearchTabs } from "@/components/extranet/SearchTabs";
import { StatusBadge } from "@/components/primitives/StatusBadge";
import { SupplierMark } from "@/components/primitives/SupplierMark";

/**
 * Acente ana sayfası — Sitemap Bölüm 2, Dashboard (MVP).
 *
 * Bağlam dokümanı Bölüm 3.4: dashboard en çok tasarım eforu isteyen ama en
 * az kullanılan ekran. Bu yüzden burada süs yok — dört sayı, hızlı arama ve
 * operatörün bugün gerçekten bakacağı iki liste.
 */
const RECENT = BOOKINGS.slice(0, 6);

export default function ExtranetHomePage() {
  return (
    <div className="mx-auto w-full max-w-[86rem] px-[var(--pad-x)] py-6">
      <h1 className="text-xl font-medium text-ink">
        {t("home.title", { name: CURRENT_USER.fullName.split(" ")[0] })}
      </h1>

      {/* Hızlı arama — dashboard'un asıl işi buraya götürmek. */}
      <section className="mt-4 rounded-[var(--radius-lg)] border border-line-strong bg-surface p-4">
        <div className="mb-3 border-b border-line">
          <SearchTabs active="tur" />
        </div>
        <SearchBar />
      </section>

      {/* Sayılar: dekoratif kutu yok, tek satır ölçüm şeridi. */}
      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-line-strong bg-line md:grid-cols-4">
        <Metric label={t("home.pending")} value={String(AGENCY_STATS.pendingBookings)} />
        <Metric label={t("home.confirmedThisMonth")} value={String(AGENCY_STATS.confirmedThisMonth)} />
        <Metric label={t("home.salesThisMonth")} value={formatMoney(AGENCY_STATS.grossSalesThisMonth)} />
        <Metric
          label={t("home.marginThisMonth")}
          value={formatMoney(AGENCY_STATS.marginThisMonth)}
          tone="money"
        />
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Son rezervasyonlar */}
        <section className="rounded-[var(--radius-lg)] border border-line-strong bg-surface">
          <header className="flex items-center justify-between border-b border-line px-3 py-2">
            <h2 className="font-dense text-[length:calc(var(--font-ui)*1.05)] font-medium text-ink">
              {t("home.recentBookings")}
            </h2>
            <Link
              href="/extranet/rezervasyonlar"
              className="text-[length:var(--font-ui-sm)] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
            >
              {t("home.seeAll")}
            </Link>
          </header>
          <ul>
            {RECENT.map((b) => {
              const item = primaryItem(b);
              return (
                <li key={b.id}>
                  <Link
                    href={`/extranet/rezervasyonlar/${b.ref}`}
                    className="flex h-[var(--row-h)] items-center gap-3 border-b border-line px-3 font-dense last:border-0 hover:bg-action-tint"
                  >
                    <span className="tnum w-20 text-[length:var(--font-ui)] text-ink">
                      {b.ref}
                    </span>
                    <span className="w-32 truncate text-[length:var(--font-ui)] text-ink">
                      {b.customer.fullName}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[length:var(--font-ui-sm)] text-ink-2">
                      {item.title}
                    </span>
                    <SupplierMark supplier={b.supplier} className="shrink-0" />
                    <span className="tnum w-16 text-end text-[length:var(--font-ui-sm)] text-ink-2">
                      {formatShortDate(b.travelDate)}
                    </span>
                    <span className="w-28 shrink-0">
                      <StatusBadge status={b.status} />
                    </span>
                    <span className="tnum w-24 text-end text-[length:var(--font-ui)] font-semibold text-ink">
                      {formatMoney(salePrice(item.unitPrice, item.marginPct) * item.quantity)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="flex flex-col gap-6">
          {/* Duyurular */}
          <section className="rounded-[var(--radius-lg)] border border-line-strong bg-surface">
            <h2 className="border-b border-line px-3 py-2 font-dense text-[length:calc(var(--font-ui)*1.05)] font-medium text-ink">
              {t("home.announcements")}
            </h2>
            <ul>
              {ANNOUNCEMENTS.map((a) => (
                <li key={a.id} className="border-b border-line p-3 last:border-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <p
                      className={`text-[length:var(--font-ui)] font-medium ${
                        a.tone === "warning" ? "text-warning" : "text-ink"
                      }`}
                    >
                      {a.title}
                    </p>
                    <span className="tnum shrink-0 text-[length:var(--font-ui-xs)] text-ink-3">
                      {formatShortDate(a.date)}
                    </span>
                  </div>
                  <p className="mt-1 text-[length:var(--font-ui-sm)] leading-relaxed text-ink-2">
                    {a.body}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Bakiye özeti */}
          <section className="rounded-[var(--radius-lg)] border border-line-strong bg-surface p-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-dense text-[length:calc(var(--font-ui)*1.05)] font-medium text-ink">
                {t("balance.available")}
              </h2>
              <Link
                href="/extranet/bakiye"
                className="text-[length:var(--font-ui-sm)] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
              >
                {t("home.seeAll")}
              </Link>
            </div>
            <p className="tnum mt-1 text-2xl font-semibold text-ink">
              {formatMoney(AGENCY.balance, AGENCY.currency)}
            </p>
            <p className="tnum mt-1 text-[length:var(--font-ui-sm)] text-ink-2">
              {t("balance.limit", {
                amount: formatMoney(AGENCY.creditLimit, AGENCY.currency),
              })}
            </p>
            <p className="mt-3 flex items-baseline justify-between border-t border-line pt-2 text-[length:var(--font-ui-sm)]">
              <span className="text-ink-3">{t("balance.term")}</span>
              <span className="tnum text-ink-2">
                {t("balance.termDays", { days: AGENCY.paymentTermDays })}
              </span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * Ölçüm hücresi. <dl> yalnızca dt/dd/div doğrudan çocuklarını kabul eder;
 * bu yüzden hücre bir <div>, bağlantı değil — sayılara giden yol
 * bölüm başlıklarındaki "Tümünü gör" bağlantısı.
 */
function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "money";
}) {
  return (
    <div className="bg-surface p-3">
      <dt className="text-[length:var(--font-ui-sm)] text-ink-2">{label}</dt>
      <dd
        className={`tnum mt-1 text-[length:calc(var(--font-ui)*1.75)] font-semibold leading-none ${
          tone === "money" ? "text-margin-field" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
