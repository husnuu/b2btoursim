import { formatMoney, formatTime, t } from "@/lib/i18n";
import { SEARCH_RESULTS } from "@/data/mock";
import { marginAmount, salePrice } from "@/lib/types";
import { PriceDisplay } from "@/components/primitives/PriceDisplay";
import { SupplierMark } from "@/components/primitives/SupplierMark";

/**
 * Sayfanın merkezi ve tek tonal olayı.
 *
 * Ürünün tezi tek bakışta görünsün diye iki panel yan yana duruyor: solda
 * acentenin terminali (koyu, yoğun, üç sayı), sağda müşterinin gördüğü kart
 * (açık, ferah, tek sayı). Karanlık–aydınlık karşıtlığı açıklamayı kendisi
 * yapıyor.
 *
 * Aradaki delikli dikey çizgi sayfanın tek süsü ve bir şey anlatıyor:
 * net fiyat ile marjın asla geçmediği sınır.
 */
const R = SEARCH_RESULTS[0];

export function ViewSplit() {
  const margin = R.defaultMarginPct;

  return (
    <div className="grid items-stretch md:grid-cols-[1fr_3rem_1fr]">
      {/* Acente terminali */}
      <div
        data-density="compact"
        className="rounded-[var(--radius-lg)] border border-ink-inverse-3/25 bg-inverse-raised p-5"
      >
        <p className="font-dense text-[length:calc(var(--font-ui)*1.15)] font-medium text-ink-inverse">
          {t("site.split.agency")}
        </p>

        <div className="mt-4 border-y border-ink-inverse-3/25 py-2.5">
          <p className="font-dense text-[length:calc(var(--font-ui)*1.1)] text-ink-inverse">
            {R.title}
          </p>
          <div className="mt-1 flex items-center gap-4 font-dense text-[length:var(--font-ui-sm)] text-ink-inverse-2">
            <span className="tnum">{formatTime(R.startsAt)}</span>
            <SupplierMark supplier={R.supplier} showName tone="inverse" />
          </div>
        </div>

        <dl className="mt-3 font-dense">
          <Line label={t("results.col.net")} value={formatMoney(R.net)} tone="muted" />
          <Line
            label={t("results.col.margin")}
            hint={`%${margin}`}
            value={formatMoney(marginAmount(R.net, margin))}
            tone="money"
          />
          <Line
            label={t("results.col.sale")}
            value={formatMoney(salePrice(R.net, margin))}
            tone="strong"
          />
        </dl>
      </div>

      {/* Veri sınırı: net fiyat ve marjın geçmediği çizgi. */}
      <div aria-hidden="true" className="grid place-items-center py-6 md:py-0">
        <span className="h-px w-full border-t border-dashed border-ink-inverse-3/50 md:h-full md:w-px md:border-l md:border-t-0" />
      </div>

      {/* Müşteri görünümü */}
      <div className="flex flex-col rounded-[var(--radius-lg)] bg-surface p-5">
        <p className="font-dense text-[length:calc(var(--font-ui)*1.15)] font-medium text-ink">
          {t("site.split.customer")}
        </p>

        {/* Yoğunluk farkı bilinçli: solda dört satır, sağda tek fiyat.
            İçerik dikeyde ortalanıyor ki boşluk hata gibi durmasın. */}
        <div className="mt-4 flex flex-1 items-center gap-4">
          <span
            aria-hidden="true"
            className="h-24 w-32 shrink-0 rounded-[var(--radius)]"
            style={{ background: R.imageTone, backgroundImage: "var(--image-sheen)" }}
          />
          <div className="min-w-0">
            <p className="text-[length:calc(var(--font-ui)*1.1)] leading-snug text-ink">
              {R.title}
            </p>
            {R.cancellation.type === "free" && (
              <p className="mt-1 text-[length:var(--font-ui-sm)] text-success">
                {t("results.freeCancel", { hours: R.cancellation.hoursBefore })}
              </p>
            )}
            <p className="mt-4 flex items-baseline gap-2">
              <span className="text-[length:var(--font-ui-sm)] text-ink-3">
                {t("b2c.from")}
              </span>
              <PriceDisplay net={R.net} marginPct={margin} mode="retail" size="lg" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Line({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: "muted" | "money" | "strong";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink-inverse-3/25 py-2 last:border-0">
      <dt className="flex items-baseline gap-2 text-[length:var(--font-ui-sm)] text-ink-inverse-2">
        {label}
        {hint && <span className="tnum text-margin-inverse">{hint}</span>}
      </dt>
      <dd
        className={`tnum ${
          tone === "strong"
            ? "text-[length:calc(var(--font-ui)*1.45)] font-semibold text-ink-inverse"
            : tone === "money"
              ? "text-[length:var(--font-ui)] text-margin-inverse"
              : "text-[length:var(--font-ui)] text-ink-inverse-2"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
