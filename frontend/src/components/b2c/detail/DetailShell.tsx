import Link from "next/link";
import { t } from "@/lib/i18n";
import type { Cutoff, Gallery } from "@/lib/storefront/details";

/**
 * İlan detay sayfalarının ortak parçaları. Referans: acente sitelerinde
 * detay sayfası kartın uzun hâlidir — breadcrumb, başlık, meta çipler,
 * görseller, bölümler, sağda talep kutusu, altta benzer ilanlar.
 */

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Konum" className="text-[length:var(--font-ui-sm)] text-ink-2">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/magaza" className="hover:text-ink">{t("b2c.detail.home")}</Link>
        </li>
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="text-ink-3">›</span>
            {it.href ? <Link href={it.href} className="hover:text-ink">{it.label}</Link> : <span className="text-ink">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Chips({ items }: { items: (string | null | undefined | false)[] }) {
  const list = items.filter((x): x is string => !!x);
  if (!list.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {list.map((c) => (
        <li key={c} className="rounded-[var(--radius)] border border-line bg-surface px-2 py-0.5 text-[length:var(--font-ui-sm)] text-ink-2">
          {c}
        </li>
      ))}
    </ul>
  );
}

/** Görsel ızgarası: ilk büyük, kalanlar küçük. Gerçek görsel yoksa ton. */
export function GalleryGrid({ gallery }: { gallery: Gallery }) {
  const [first, ...rest] = gallery;
  return (
    <div className="mt-6 grid gap-2 sm:grid-cols-[2fr_1fr]" aria-label={t("b2c.detail.gallery")}>
      <div className="aspect-[16/10] rounded-[var(--radius-lg)]" style={{ background: first.tone, backgroundImage: "var(--image-sheen-wide)" }} role="img" aria-label={first.alt || undefined} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
        {(rest.length ? rest : [first, first]).slice(0, 2).map((g, i) => (
          <div key={i} className="aspect-[16/10] rounded-[var(--radius-lg)] sm:aspect-auto" style={{ background: g.tone, backgroundImage: "var(--image-sheen)" }} />
        ))}
      </div>
    </div>
  );
}

export function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-6">
      <h2 className="font-dense text-lg font-medium text-ink">{title}</h2>
      <div className="mt-3 max-w-[68ch] leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}

export function SpecList({ items }: { items: [string, string | number | null | undefined][] }) {
  const list = items.filter(([, v]) => v !== null && v !== undefined && v !== "");
  return (
    <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
      {list.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 border-b border-line py-1.5">
          <dt className="text-ink-2">{k}</dt>
          <dd className="tnum text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function IncludeList({ includes, excludes }: { includes: string[]; excludes: string[] }) {
  return (
    <ul className="space-y-1">
      {includes.map((x) => (
        <li key={`i-${x}`} className="flex gap-2"><span aria-hidden="true" className="text-success">✓</span>{x}</li>
      ))}
      {excludes.map((x) => (
        <li key={`e-${x}`} className="flex gap-2 text-ink-3"><span aria-hidden="true">✕</span>{x}</li>
      ))}
    </ul>
  );
}

/** Dahil/Hariç — iki kolon, başlıklı. "Perfeksiyon" geçişi (1b): tek liste yerine tarama hızı için ayrılmış. */
export function IncludeExcludeGrid({ includes, excludes }: { includes: string[]; excludes: string[] }) {
  if (includes.length === 0 && excludes.length === 0) return null;
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {includes.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[length:var(--font-ui)] font-medium text-ink">{t("b2c.detail.included")}</h3>
          {includes.map((x) => (
            <span key={x} className="flex gap-2 text-[length:var(--font-ui-sm)] text-ink-2">
              <span aria-hidden="true" className="font-semibold text-success">✓</span>
              {x}
            </span>
          ))}
        </div>
      )}
      {excludes.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[length:var(--font-ui)] font-medium text-ink">{t("b2c.detail.excluded")}</h3>
          {excludes.map((x) => (
            <span key={x} className="flex gap-2 text-[length:var(--font-ui-sm)] text-ink-2">
              <span aria-hidden="true" className="font-semibold text-danger">—</span>
              {x}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Buluşma noktası haritası — API anahtarı gerektirmeyen Google Maps
 * gömme adresi. Tasarım notu: "buluşma noktası haritası tur detayında
 * zorunlu" (Baymard bulgusu); gerçek adres zaten elde olduğu için yeni
 * bir veri kaynağı gerekmez.
 */
export function MapEmbed({ query, title }: { query: string; title: string }) {
  if (!query.trim()) return null;
  return (
    <iframe
      title={t("b2c.detail.mapTitle", { title })}
      src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className="h-[11rem] w-full rounded-[var(--radius-lg)] border border-line"
    />
  );
}

/** İptal politikasının tek cümlelik özeti — renkli kutuda, ayrıntı tablosunun üstünde. */
export function CancellationBanner({ template, cutoffs }: { template: string | null; cutoffs: Cutoff[] }) {
  if (template === "kati" && cutoffs.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-danger-tint px-4 py-3 text-[length:var(--font-ui-sm)] text-danger">
        <span className="font-medium">{t("results.noCancel")}</span>
      </div>
    );
  }
  const fullRefund = cutoffs.filter((c) => c.refundPct >= 100).map((c) => c.daysBefore);
  const hours = fullRefund.length ? Math.min(...fullRefund) * 24 : template === "esnek" ? 24 : 48;
  return (
    <div className="rounded-[var(--radius-lg)] bg-success-tint px-4 py-3 text-[length:var(--font-ui-sm)] text-success">
      <span className="font-medium">{t("b2c.detail.freeCancelHeadline", { hours })}</span>
    </div>
  );
}

export function CancellationTable({ template, cutoffs }: { template: string | null; cutoffs: Cutoff[] }) {
  if (template === "kati" && cutoffs.length === 0) return <p>{t("results.noCancel")}</p>;
  if (cutoffs.length === 0) return <p>{t("results.freeCancel", { hours: template === "esnek" ? 24 : 48 })}</p>;
  return (
    <ul className="space-y-1">
      {[...cutoffs].sort((a, b) => b.daysBefore - a.daysBefore).map((c) => (
        <li key={c.daysBefore} className="tnum">{t("b2c.detail.cancellationRow", { days: c.daysBefore, pct: c.refundPct })}</li>
      ))}
      <li className="text-ink-3">{t("b2c.detail.noShow")}</li>
    </ul>
  );
}

export function WhatsAppLink({ number, title }: { number: string; title: string }) {
  if (!number) return null;
  const text = encodeURIComponent(`Merhaba, "${title}" hakkında bilgi almak istiyorum.`);
  return (
    <a
      href={`https://wa.me/${number.replace(/^\+/, "")}?text=${text}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-9 items-center justify-center rounded-[var(--radius)] border border-line-strong bg-surface px-3 text-[length:var(--font-ui)] text-ink hover:bg-sunken"
    >
      {t("b2c.detail.whatsapp")}
    </a>
  );
}
