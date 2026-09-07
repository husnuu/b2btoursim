import Link from "next/link";
import { formatDuration, formatMoney, t } from "@/lib/i18n";
import { SEARCH_RESULTS } from "@/data/mock";
import { salePrice } from "@/lib/types";
import { SupplierMark } from "@/components/primitives/SupplierMark";
import { StatusBadge } from "@/components/primitives/StatusBadge";

/**
 * Yazılmış iki yüzeyin minyatürü.
 *
 * Sahte tarayıcı çerçevesi ya da genel ikon yok — panellerin içi ürünün
 * gerçek bileşenleri, gerçek verisiyle. Görsel ağırlık aynı zamanda doğruyu
 * söylüyor: var olan iki yüzey büyük, henüz olmayan üçü tek satır.
 */

const EXTRANET_ROWS = ["r1", "r7", "r3", "r5"]
  .map((id) => SEARCH_RESULTS.find((r) => r.id === id)!)
  .filter(Boolean);

const STORE_TILES = ["r1", "r3"]
  .map((id) => SEARCH_RESULTS.find((r) => r.id === id)!)
  .filter(Boolean);

const PLANNED = [
  { name: "Süper Admin", who: "Platform operatörü", line: "Tenant kurulumu, tedarikçi adaptörleri, roller." },
  { name: "Tedarikçi portalı", who: "Küçük tedarikçi ve DMC", line: "Kendi ürününü yükleyen tedarikçiler için self servis." },
  { name: "Mobil", who: "Personel ve seyahatçi", line: "Önce PWA, ardından native." },
];

export function SurfaceShowcase() {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Extranet minyatürü */}
        <Panel
          href="/extranet"
          name="B2B Extranet"
          who="Acente ve alt acente personeli"
          line="Günlük operasyon aracı. Arama, rezervasyon, bakiye, voucher."
        >
          <div data-density="compact" className="bg-surface">
            <div className="flex items-center gap-2 border-b border-line px-3 py-1.5 font-dense text-[length:var(--font-ui-xs)] text-ink-3">
              <span className="flex-1">{t("results.col.product")}</span>
              <span className="w-16 text-end">{t("results.col.net")}</span>
              <span className="w-10 text-end">{t("results.col.margin")}</span>
              <span className="w-20 text-end">{t("results.col.sale")}</span>
            </div>
            {EXTRANET_ROWS.map((r) => (
              <div
                key={r.id}
                className="flex h-[var(--row-h)] items-center gap-2 border-b border-line px-3 font-dense last:border-0"
              >
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 rounded-[2px]"
                  style={{ background: r.imageTone }}
                />
                <span className="min-w-0 flex-1 truncate text-[length:var(--font-ui)] text-ink">
                  {r.title}
                </span>
                <SupplierMark supplier={r.supplier} className="shrink-0" />
                <span className="tnum w-16 text-end text-[length:var(--font-ui-sm)] text-ink-3">
                  {formatMoney(r.net)}
                </span>
                <span className="tnum w-10 text-end text-[length:var(--font-ui-sm)] text-margin-field">
                  %{r.defaultMarginPct}
                </span>
                <span className="tnum w-20 text-end text-[length:var(--font-ui)] font-semibold text-ink">
                  {formatMoney(salePrice(r.net, r.defaultMarginPct))}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-3 border-t border-line px-3 py-1.5">
              <StatusBadge status="confirmed" />
              <StatusBadge status="pending" />
              <StatusBadge status="completed" />
            </div>
          </div>
        </Panel>

        {/* Mağaza minyatürü */}
        <Panel
          href="/magaza"
          name="B2C mağaza"
          who="Son kullanıcı"
          line="Kendi markanızla, arama motorlarına açık satış sayfaları."
        >
          <div className="grid grid-cols-2 gap-4 bg-surface p-4">
            {STORE_TILES.map((r) => (
              <div key={r.id} className="flex flex-col gap-2">
                <span
                  aria-hidden="true"
                  className="aspect-[4/3] w-full rounded-[var(--radius)]"
                  style={{ background: r.imageTone, backgroundImage: "var(--image-sheen)" }}
                />
                <span className="line-clamp-2 text-[length:var(--font-ui-sm)] leading-snug text-ink">
                  {r.title}
                </span>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="tnum text-[length:var(--font-ui-xs)] text-ink-3">
                    {formatDuration(r.durationMinutes)}
                  </span>
                  <span className="tnum text-[length:var(--font-ui)] font-medium text-ink">
                    {formatMoney(salePrice(r.net, r.defaultMarginPct))}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <ul className="mt-10 border-t border-line">
        {PLANNED.map((s) => (
          <li
            key={s.name}
            className="grid gap-1 border-b border-line py-4 sm:grid-cols-[16rem_1fr] sm:gap-8"
          >
            <span className="flex flex-col">
              <span className="font-dense text-[length:calc(var(--font-ui)*1.1)] font-medium text-ink-2">
                {s.name}
              </span>
              <span className="text-[length:var(--font-ui-sm)] text-ink-3">{s.who}</span>
            </span>
            <span className="text-ink-3">{s.line}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Panel({
  href,
  name,
  who,
  line,
  children,
}: {
  href: string;
  name: string;
  who: string;
  line: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border
                 border-line-strong bg-surface transition-colors hover:border-ink-3"
    >
      <div className="border-b border-line px-5 py-4">
        <p className="font-dense text-[length:calc(var(--font-ui)*1.25)] font-medium text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
          {name}
        </p>
        <p className="text-[length:var(--font-ui-sm)] text-ink-3">{who}</p>
        <p className="mt-2 max-w-[42ch] text-ink-2">{line}</p>
      </div>
      {/* Minyatür ürünün gerçek bileşenleriyle çiziliyor. */}
      <div className="min-h-0 flex-1 bg-sunken/40">{children}</div>
    </Link>
  );
}
