import { t } from "@/lib/i18n";
import { PEER_AGENCIES } from "@/lib/marketplace-store";
import { ButtonLink } from "@/components/primitives/Button";

/**
 * Abonelik duvarı — **tek** bileşen, tek ikon, tek metin.
 *
 * Spesifikasyon Bölüm 3.4 referans üründe iki farklı duvar tasarımı
 * gözlemlemiş (gri unlock + "Abonelik Gerekli" / sarı padlock + "Bu Özellik
 * Abonelik Gerektirir") ve tek bir bileşene indirgenmesini önermiş. Burası o.
 *
 * Ayrıca referanstan bilinçli bir sapma: orada duvarın arkasında **hiçbir şey**
 * görünmüyor. Ödemeden değeri göremeyen kimse ödemez. Burada tedarikçi
 * sayısı ve şehirleri açık; kilitli olan fiyat, iletişim ve kontrat kurma.
 */
export function SubscriptionWall({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line-strong bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5">
        <div>
          <p className="flex items-center gap-2 font-dense text-[length:calc(var(--font-ui)*1.15)] font-medium text-ink">
            <span
              aria-hidden="true"
              className="inline-grid h-5 w-5 place-items-center rounded-[2px] border border-line-strong text-[length:var(--font-ui-xs)] text-ink-2"
            >
              ⌷
            </span>
            {t("mp.wall.title")}
          </p>
          <p className="mt-2 max-w-[54ch] text-ink-2">
            {t("mp.wall.body", { count: PEER_AGENCIES.length })}
          </p>
        </div>
        <ButtonLink href="/extranet/ayarlar" variant="primary">
          {t("mp.wall.cta")}
        </ButtonLink>
      </div>

      {children && (
        <div className="p-5">
          <p className="mb-3 text-[length:var(--font-ui-sm)] text-ink-3">
            {t("mp.wall.preview")}
          </p>
          {children}
        </div>
      )}
    </div>
  );
}
