import { formatMoney, t } from "@/lib/i18n";

export type OzetSatir = { id: string; title: string; sub?: string; tutar: number };

/**
 * Yapışkan özet kartı (VITRIN.md §4.8, referans `OzetKarti`). Sepet ve ödeme
 * sayfalarında sağda; satır tutarları ve toplam `kalemler()`/`toplam()`
 * sonucudur, kart kendi hesap yapmaz. `children` birincil eylem ve notlar.
 */
export function OzetKarti({
  satirlar,
  toplamTutar,
  currency = "TRY",
  children,
}: {
  satirlar: OzetSatir[];
  toplamTutar: number;
  currency?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-[var(--shadow-lift)]">
      <h2 className="font-dense text-[17px] font-semibold text-ink">{t("b2c.request.summary")}</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {satirlar.map((s) => (
          <li key={s.id} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[length:var(--font-ui-sm)] text-ink">{s.title}</span>
              {s.sub && <span className="tnum block text-[12.5px] text-ink-3">{s.sub}</span>}
            </span>
            <span className="tnum text-[length:var(--font-ui)] text-ink">{formatMoney(s.tutar, currency)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
        <dt className="text-ink-2">{t("common.total")}</dt>
        <dd className="tnum font-dense text-2xl font-bold text-ink">{formatMoney(toplamTutar, currency)}</dd>
      </dl>
      {children}
    </div>
  );
}
