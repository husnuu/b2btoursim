import Link from "next/link";
import { CalendarCheck, Check, ChevronRight, ExternalLink, MapPin, X, type LucideIcon } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Cutoff } from "@/lib/storefront/details";

/**
 * İlan detay sayfalarının ortak parçaları (Seyyah vitrin ürün sayfası):
 * breadcrumb, tip etiketi, çipler, kalın bölüm başlıkları, hızlı bilgi
 * ızgarası, zaman çizelgesi, dahil/hariç, buluşma noktası, iptal kutusu.
 */

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Konum" className="text-sm text-ink-3">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/magaza" className="underline underline-offset-2 hover:text-ink">{t("b2c.detail.home")}</Link>
        </li>
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            <ChevronRight className="size-3.5" aria-hidden="true" />
            {it.href ? <Link href={it.href} className="underline underline-offset-2 hover:text-ink">{it.label}</Link> : <span className="line-clamp-1 text-ink">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Aksan renkli tip etiketi: "TUR", "TEKNE"… */
export function KindPill({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded-full bg-highlight px-3.5 py-1 text-[13px] font-bold tracking-wide text-on-highlight uppercase">{children}</span>;
}

export function Chips({ items }: { items: (string | null | undefined | false)[] }) {
  const list = items.filter((x): x is string => !!x);
  if (!list.length) return null;
  return (
    <ul className="mt-5 flex flex-wrap gap-2">
      {list.map((c) => (
        <li key={c} className="rounded-[var(--radius)] bg-sunken px-3.5 py-2 text-[15px] font-medium text-ink">
          {c}
        </li>
      ))}
    </ul>
  );
}

export function DetailSection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-[calc(var(--header-h)+4rem)] pt-12 first:pt-8">
      <h2 className="text-[1.6rem] font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h2>
      <div className="mt-5 text-[17px] leading-[1.75] text-ink-2">{children}</div>
    </section>
  );
}

/** Hızlı bilgi: ikonlu dört hücre, çizgili ızgara. */
export function QuickInfo({ items }: { items: { Icon: LucideIcon; label: string; value: string | null | undefined }[] }) {
  const list = items.filter((x) => x.value);
  if (!list.length) return null;
  return (
    <dl className={`grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-line bg-line ${list.length >= 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
      {list.map(({ Icon, label, value }) => (
        <div key={label} className="bg-surface p-4">
          <Icon className="size-5 text-ink" />
          <dt className="mt-3 text-sm text-ink-3">{label}</dt>
          <dd className="font-semibold text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Program zaman çizelgesi: kesikli çizgi, ilk ve son durak koyu. */
export function Timeline({ steps }: { steps: { time?: string; title: string; body?: string }[] }) {
  return (
    <ol className="relative ms-3 border-s-2 border-dashed border-ink/20">
      {steps.map((s, i) => (
        <li key={`${s.title}-${i}`} data-reveal style={{ "--d": `${i * 80}ms` } as React.CSSProperties} className="relative pb-8 ps-8 last:pb-0">
          <span
            aria-hidden="true"
            className={`absolute top-0 -start-[13px] grid size-6 place-items-center rounded-full border-[3px] border-surface ${i === 0 || i === steps.length - 1 ? "bg-inverse" : "bg-highlight"}`}
          />
          {s.time && <span className="tnum inline-block rounded-[var(--radius)] bg-sunken px-2 py-0.5 text-sm font-bold text-ink">{s.time}</span>}
          <h3 className={`text-lg font-bold text-ink ${s.time ? "mt-2" : ""}`}>{s.title}</h3>
          {s.body && <p className="mt-1 text-ink-2">{s.body}</p>}
        </li>
      ))}
    </ol>
  );
}

export function SpecList({ items }: { items: [string, string | number | null | undefined][] }) {
  const list = items.filter(([, v]) => v !== null && v !== undefined && v !== "");
  return (
    <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
      {list.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 border-b border-line py-2">
          <dt className="text-ink-2">{k}</dt>
          <dd className="tnum font-semibold text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function IncludeList({ includes, excludes }: { includes: string[]; excludes: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {includes.map((x) => (
        <li key={`i-${x}`} className="flex gap-3"><Check className="mt-0.5 size-5 shrink-0 text-success" strokeWidth={3} aria-hidden="true" />{x}</li>
      ))}
      {excludes.map((x) => (
        <li key={`e-${x}`} className="flex gap-3 text-ink-3"><X className="mt-0.5 size-5 shrink-0 text-amber" strokeWidth={3} aria-hidden="true" />{x}</li>
      ))}
    </ul>
  );
}

/** Dahil/Hariç — iki kolon, başlıklı. */
export function IncludeExcludeGrid({ includes, excludes }: { includes: string[]; excludes: string[] }) {
  if (includes.length === 0 && excludes.length === 0) return null;
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {includes.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-ink">{t("b2c.detail.included")}</h3>
          <ul className="mt-4 flex flex-col gap-3">
            {includes.map((x) => (
              <li key={x} className="flex gap-3"><Check className="mt-0.5 size-5 shrink-0 text-success" strokeWidth={3} aria-hidden="true" />{x}</li>
            ))}
          </ul>
        </div>
      )}
      {excludes.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-ink">{t("b2c.detail.excluded")}</h3>
          <ul className="mt-4 flex flex-col gap-3">
            {excludes.map((x) => (
              <li key={x} className="flex gap-3"><X className="mt-0.5 size-5 shrink-0 text-amber" strokeWidth={3} aria-hidden="true" />{x}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Buluşma noktası: üstte harita (API anahtarsız Google Maps gömme), altta
 * adres ve "Haritada aç" bağlantısı — Seyyah'ın kart düzeni.
 */
export function MeetingPoint({ query, title, note }: { query: string; title: string; note?: string | null }) {
  if (!query.trim()) return null;
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-line">
      <iframe
        title={t("b2c.detail.mapTitle", { title })}
        src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-44 w-full border-0 bg-action-tint"
      />
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex gap-3 text-ink"><MapPin className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> {query}</p>
          {note && <p className="mt-1 ps-8 text-sm text-ink-3">{note}</p>}
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1.5 font-semibold text-ink underline underline-offset-4"
        >
          {t("b2c.detail.openMap")} <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

/** Eski ad; harita tek başına gereken yerler için. */
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

/** İptal politikasının tek cümlelik özeti — renkli kutuda. */
export function CancellationBanner({ template, cutoffs }: { template: string | null; cutoffs: Cutoff[] }) {
  if (template === "kati" && cutoffs.length === 0) {
    return (
      <div className="flex gap-4 rounded-[var(--radius-lg)] bg-amber-soft p-5">
        <CalendarCheck className="size-6 shrink-0 text-amber" aria-hidden="true" />
        <p className="text-[17px] font-medium text-ink">{t("results.noCancel")}</p>
      </div>
    );
  }
  const fullRefund = cutoffs.filter((c) => c.refundPct >= 100).map((c) => c.daysBefore);
  const hours = fullRefund.length ? Math.min(...fullRefund) * 24 : template === "esnek" ? 24 : 48;
  return (
    <div className="flex gap-4 rounded-[var(--radius-lg)] bg-success-tint p-5">
      <CalendarCheck className="size-6 shrink-0 text-success" aria-hidden="true" />
      <p className="text-[17px] font-medium text-ink">{t("b2c.detail.freeCancelHeadline", { hours })}</p>
    </div>
  );
}

export function CancellationTable({ template, cutoffs }: { template: string | null; cutoffs: Cutoff[] }) {
  if (template === "kati" && cutoffs.length === 0) return <p>{t("results.noCancel")}</p>;
  if (cutoffs.length === 0) return <p>{t("results.freeCancel", { hours: template === "esnek" ? 24 : 48 })}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {[...cutoffs].sort((a, b) => b.daysBefore - a.daysBefore).map((c) => (
        <li key={c.daysBefore} className="tnum flex gap-3"><span aria-hidden="true" className="mt-2.5 size-2 shrink-0 rounded-full bg-ink" />{t("b2c.detail.cancellationRow", { days: c.daysBefore, pct: c.refundPct })}</li>
      ))}
      <li className="flex gap-3 text-ink-3"><span aria-hidden="true" className="mt-2.5 size-2 shrink-0 rounded-full bg-ink-3" />{t("b2c.detail.noShow")}</li>
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
      className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius)] border-[1.5px] border-ink bg-surface px-4 font-semibold text-ink transition-colors hover:bg-sunken"
    >
      {t("b2c.detail.whatsapp")}
    </a>
  );
}
