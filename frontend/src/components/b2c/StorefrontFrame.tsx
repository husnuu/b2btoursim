import Link from "next/link";
import { t } from "@/lib/i18n";
import type { SiteConfig } from "@/lib/site/config";
import type { StorefrontProfile } from "@/lib/storefront/profile";
import { BRAND_PALETTE, themeVars } from "@/lib/theme";

/**
 * Vitrin kabuğu — üst çubuk, içerik, altbilgi. Karakter `config`ten:
 * marka rengi, çubuk tonu, köşe yumuşaklığı, menü, altbilgi.
 *
 * Aynı bileşen iki yerde çalışır: gerçek vitrin (yayınlanmış yapı) ve
 * editörün önizlemesi (taslak yapı). Önizlemede bağlantılar kapalı:
 * kullanıcı iframe içinde gezinip kaybolmasın.
 */
export type NavLink = { label: string; href: string };

export function StorefrontFrame({
  name,
  config,
  profile,
  moduleLinks = [],
  preview = false,
  children,
}: {
  name: string;
  config: SiteConfig;
  profile: StorefrontProfile | null;
  /** İçeriği olan modül bölümlerinden otomatik üretilen sekmeler (Turlar, Tekneler…). */
  moduleLinks?: NavLink[];
  preview?: boolean;
  children: React.ReactNode;
}) {
  const brandHex = BRAND_PALETTE.find((b) => b.id === config.theme.brand)?.hex ?? BRAND_PALETTE[0].hex;
  const style: React.CSSProperties = {
    ...(themeVars(brandHex) as React.CSSProperties),
    ...(config.theme.radius === "sharp"
      ? ({ "--radius": "2px", "--radius-lg": "3px" } as React.CSSProperties)
      : ({ "--radius": "6px", "--radius-lg": "12px" } as React.CSSProperties)),
  };
  const inverse = config.theme.header === "inverse";
  const L = preview ? PreviewLink : Link;

  return (
    <div className="flex min-h-dvh flex-col bg-paper" style={style} data-preview={preview || undefined}>
      {!preview && (
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2
                     focus:rounded-[var(--radius)] focus:bg-action focus:px-3 focus:py-2 focus:text-on-action"
        >
          {t("nav.skipToContent")}
        </a>
      )}

      <header className={inverse ? "bg-inverse text-ink-inverse" : "border-b border-line bg-surface"}>
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
          <L
            href="/magaza"
            className={`font-dense text-lg font-semibold tracking-tight ${inverse ? "text-ink-inverse" : "text-ink"}`}
          >
            {name}
          </L>
          <nav
            className={`ms-auto flex items-center gap-5 text-[length:var(--font-ui)] ${
              inverse ? "text-ink-inverse-2" : "text-ink-2"
            }`}
          >
            {[...moduleLinks, ...config.nav.links.filter((l) => !moduleLinks.some((m) => m.href === l.href))].map((l) => (
              <L key={l.href + l.label} href={l.href} className={inverse ? "hover:text-ink-inverse" : "hover:text-ink"}>
                {l.label}
              </L>
            ))}
            {config.nav.showCart && (
              <L href="/magaza/sepet" className={inverse ? "hover:text-ink-inverse" : "hover:text-ink"}>
                {t("b2c.cart")}
              </L>
            )}
            {config.nav.showSignIn && (
              <L href="/giris" className={inverse ? "hover:text-ink-inverse" : "hover:text-ink"}>
                {t("site.nav.signIn")}
              </L>
            )}
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="mt-16 border-t border-line bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <nav aria-label={t("b2c.nav.about")}>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[length:var(--font-ui-sm)] text-ink-2">
              <li><L href="/magaza/hakkimizda" className="hover:text-ink">{t("b2c.nav.about")}</L></li>
              <li><L href="/magaza/sss" className="hover:text-ink">{t("b2c.nav.faq")}</L></li>
              <li><L href="/magaza/iptal-iade" className="hover:text-ink">{t("b2c.nav.terms")}</L></li>
              <li><L href="/magaza/kvkk" className="hover:text-ink">{t("b2c.nav.privacy")}</L></li>
              <li><L href="/magaza/iletisim" className="hover:text-ink">{t("b2c.nav.contact")}</L></li>
              {config.footer.instagram && (
                <li>
                  <a href={`https://instagram.com/${config.footer.instagram}`} rel="noreferrer" target="_blank" className="hover:text-ink">
                    Instagram
                  </a>
                </li>
              )}
              {config.footer.whatsapp && (
                <li>
                  <a href={`https://wa.me/${config.footer.whatsapp.replace(/^\+/, "")}`} rel="noreferrer" target="_blank" className="hover:text-ink">
                    WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </nav>
          <p className="mt-5 border-t border-line pt-5 text-[length:var(--font-ui-sm)] text-ink-3">
            {name}
            {config.footer.showTursab && profile?.tursabNo ? ` — ${t("b2c.tursab", { no: profile.tursabNo })}.` : "."}{" "}
            {config.footer.note || "Fiyatlar vergiler dahildir."}
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Önizlemede bağlantı gibi görünen ama gitmeyen öğe. */
function PreviewLink({ href: _href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  void _href;
  return (
    <span className={className} aria-disabled="true">
      {children}
    </span>
  );
}
