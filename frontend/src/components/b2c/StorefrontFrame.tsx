import Link from "next/link";
import { t } from "@/lib/i18n";
import type { SiteConfig } from "@/lib/site/config";
import type { StorefrontProfile } from "@/lib/storefront/profile";
import { BRAND_PALETTE, themeVars } from "@/lib/theme";

/**
 * Vitrin kabuğu — üst çubuk, içerik, altbilgi. Karakter `config`ten:
 * marka rengi, çubuk tonu, köşe yumuşaklığı, menü, altbilgi.
 *
 * "Perfeksiyon" geçişi (2a): ince bir üst bant (telefon/WhatsApp — yalnız
 * gerçek veri varsa) ve zengin, koyu bir altbilgi (gerçek iletişim bilgisi
 * + TÜRSAB no, tasarımda uydurma bir sayı değil). Başlık çubuğu hâlâ
 * `theme.header` ile açık/koyu seçilebilir; altbilgi bu seçimden bağımsız
 * her zaman koyu — bir sitenin en altında bu her zaman iyi okunur.
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
  const hasUtility = !!(profile?.contactPhone || config.footer.whatsapp);

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

      {hasUtility && (
        <div className="hidden bg-inverse px-4 text-[length:var(--font-ui-xs)] text-ink-inverse-2 sm:block">
          <div className="mx-auto flex h-8 w-full max-w-6xl items-center gap-5">
            {profile?.contactPhone && (
              <a href={`tel:${profile.contactPhone.replace(/\s/g, "")}`} className="tnum flex items-center gap-1.5 hover:text-ink-inverse">
                <PhoneIcon />
                {profile.contactPhone}
              </a>
            )}
            <span className="flex-1" />
            {config.footer.whatsapp && (
              <a href={`https://wa.me/${config.footer.whatsapp.replace(/^\+/, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-ink-inverse">
                <WhatsAppIcon />
                {t("b2c.detail.whatsapp")}
              </a>
            )}
          </div>
        </div>
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
              <L
                href="/magaza/sepet"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[length:var(--font-ui-sm)] font-medium ${
                  inverse ? "bg-ink-inverse/10 text-ink-inverse hover:bg-ink-inverse/15" : "bg-action-tint text-action hover:brightness-95"
                }`}
              >
                <CartIcon />
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

      <footer className="mt-16 bg-inverse text-ink-inverse">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <span className="font-dense text-base font-semibold tracking-tight text-ink-inverse">{name}</span>
            {config.footer.note && <p className="max-w-[32ch] text-[length:var(--font-ui-sm)] text-ink-inverse-2">{config.footer.note}</p>}
            {config.footer.showTursab && profile?.tursabNo && (
              <p className="text-[length:var(--font-ui-xs)] text-ink-inverse-3">{t("b2c.tursab", { no: profile.tursabNo })}</p>
            )}
          </div>

          <nav aria-label={t("b2c.nav.about")} className="flex flex-col gap-2">
            <span className="text-[length:var(--font-ui-xs)] font-medium uppercase tracking-wide text-ink-inverse-3">{t("footerNav.explore")}</span>
            <L href="/magaza/hakkimizda" className="text-[length:var(--font-ui-sm)] text-ink-inverse-2 hover:text-ink-inverse">{t("b2c.nav.about")}</L>
            {moduleLinks.map((l) => (
              <L key={l.href} href={l.href} className="text-[length:var(--font-ui-sm)] text-ink-inverse-2 hover:text-ink-inverse">{l.label}</L>
            ))}
          </nav>

          <nav aria-label={t("footerNav.support")} className="flex flex-col gap-2">
            <span className="text-[length:var(--font-ui-xs)] font-medium uppercase tracking-wide text-ink-inverse-3">{t("footerNav.support")}</span>
            <L href="/magaza/sss" className="text-[length:var(--font-ui-sm)] text-ink-inverse-2 hover:text-ink-inverse">{t("b2c.nav.faq")}</L>
            <L href="/magaza/iptal-iade" className="text-[length:var(--font-ui-sm)] text-ink-inverse-2 hover:text-ink-inverse">{t("b2c.nav.terms")}</L>
            <L href="/magaza/kvkk" className="text-[length:var(--font-ui-sm)] text-ink-inverse-2 hover:text-ink-inverse">{t("b2c.nav.privacy")}</L>
          </nav>

          <div className="flex flex-col gap-2">
            <span className="text-[length:var(--font-ui-xs)] font-medium uppercase tracking-wide text-ink-inverse-3">{t("b2c.nav.contact")}</span>
            {profile?.address && <p className="text-[length:var(--font-ui-sm)] text-ink-inverse-2">{profile.address}</p>}
            {profile?.contactPhone && (
              <a href={`tel:${profile.contactPhone.replace(/\s/g, "")}`} className="tnum text-[length:var(--font-ui-sm)] text-ink-inverse-2 hover:text-ink-inverse">
                {profile.contactPhone}
                {profile.phoneHours && <span className="ms-2 text-ink-inverse-3">{profile.phoneHours}</span>}
              </a>
            )}
            {profile?.contactEmail && <p className="text-[length:var(--font-ui-sm)] text-ink-inverse-2">{profile.contactEmail}</p>}
            {config.footer.instagram && (
              <a href={`https://instagram.com/${config.footer.instagram}`} rel="noreferrer" target="_blank" className="text-[length:var(--font-ui-sm)] text-ink-inverse-2 hover:text-ink-inverse">
                Instagram
              </a>
            )}
          </div>
        </div>
        <div className="border-t border-ink-inverse-3/20">
          <p className="mx-auto w-full max-w-6xl px-4 py-4 text-[length:var(--font-ui-xs)] text-ink-inverse-3">
            © {new Date().getFullYear()} {name}. Fiyatlar vergiler dahildir.
          </p>
        </div>
      </footer>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 1h2a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L7.1 9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12Z" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 7h12l-1.4 13H7.4L6 7Z" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </svg>
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
