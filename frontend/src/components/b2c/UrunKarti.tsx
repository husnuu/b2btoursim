import Link from "next/link";
import { CalendarCheck, Sparkles, Timer } from "lucide-react";
import { formatMoney, formatNumber, t } from "@/lib/i18n";
import type { KartUrun } from "@/lib/storefront/kart";
import { ProductMedia } from "./ProductMedia";

/**
 * Vitrin ürün kartı — beş tip için tek bileşen (VITRIN.md §5), Seyyah
 * vitrin görünümü: büyük köşeli beyaz kart, 16/11 görsel, sol üstte
 * metinli rozet, görselin altında tip etiketi, gövdede meta satırları,
 * altta ayraçlı fiyat satırı. Hover'da kart yükselir, görsel yakınlaşır.
 *
 * Fiyat her zaman satış fiyatı ve aksan renginde; birimi `priceUnit`
 * söyler. Puan yalnız veri varsa (bugün hiçbir kaynakta yok). Rozet
 * metinli: renk tek başına anlam taşımaz.
 */
export function UrunKarti({
  item,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  preview = false,
}: {
  item: KartUrun;
  sizes?: string;
  preview?: boolean;
}) {
  const BadgeIcon = item.badge === "sonYerler" ? Timer : Sparkles;
  const body = (
    <>
      <div className="relative aspect-[16/11] overflow-hidden bg-sunken">
        <ProductMedia photo={item.photo} tone={item.tone} sizes={sizes} className="transition-transform duration-[1.2s] ease-out group-hover:scale-110" />
        {item.badge && (
          <span className="absolute top-0 left-0 flex items-center gap-1.5 rounded-br-[var(--radius)] bg-inverse px-3 py-1.5 text-[13px] font-semibold text-ink-inverse">
            <BadgeIcon className="size-3.5 text-highlight" />
            {item.badge === "sonYerler" ? t("b2c.lastSpots") : t("b2c.badge.oneCikan")}
          </span>
        )}
        <span className="absolute bottom-3 left-4 rounded-full bg-highlight px-3 py-1 text-[12px] font-bold tracking-wide text-on-highlight uppercase">
          {t(`b2c.kind.${item.kind}`)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[17px] leading-snug font-semibold text-ink">
          {item.subtitle && <span className="font-normal text-ink-3 italic">{item.subtitle} – </span>}
          {item.title}
        </h3>

        {(item.meta.length > 0 || item.freeCancelHours != null) && (
          <ul className="mt-3 flex flex-col gap-1.5 text-[14px] text-ink-2">
            {item.meta.slice(0, 3).map((m) => (
              <li key={m} className="tnum flex items-center gap-2.5">
                <span aria-hidden="true" className="size-1.5 shrink-0 rotate-45 bg-highlight" />
                {m}
              </li>
            ))}
            {item.freeCancelHours != null && (
              <li className="flex items-center gap-2.5 font-medium text-success">
                <CalendarCheck className="size-4 shrink-0" />
                {t("b2c.freeCancel")}
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          {item.rating ? (
            <span className="tnum flex items-baseline gap-1.5 text-[13px]">
              <span className="rounded-[var(--radius)] bg-success px-1.5 py-0.5 font-semibold text-ink-inverse">
                {item.rating.score.toLocaleString("tr-TR", { minimumFractionDigits: 1 })}
              </span>
              <span className="text-ink-3">{t("b2c.reviews", { count: formatNumber(item.rating.count) })}</span>
            </span>
          ) : (
            <span className="text-[13px] font-semibold text-ink underline decoration-2 underline-offset-4 group-hover:decoration-highlight">
              {t("b2c.viewDetail")}
            </span>
          )}
          <span className="text-right">
            {item.price != null && item.price > 0 ? (
              <>
                <span className="block text-[12px] text-ink-3">{t(`b2c.unit.${item.priceUnit}`)}</span>
                <b className="tnum block text-2xl font-extrabold tracking-tight text-action">{formatMoney(item.price, item.currency)}</b>
              </>
            ) : (
              <span className="text-[14px] font-semibold text-ink-2">{t("b2c.quote")}</span>
            )}
          </span>
        </div>
      </div>
    </>
  );

  const cls =
    "group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] bg-surface shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-500 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]";

  return (
    <article className="h-full">
      {preview ? (
        <span className={cls}>{body}</span>
      ) : (
        <Link href={item.href} className={cls}>
          {body}
        </Link>
      )}
    </article>
  );
}
