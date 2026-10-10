import Link from "next/link";
import { HelpCircle, Mail, MapPin, Phone, Search, ShoppingBag, Waves } from "lucide-react";
import { t } from "@/lib/i18n";
import type { SiteConfig } from "@/lib/site/config";
import { vitrinFontClass } from "@/lib/storefront/fonts";
import type { StorefrontProfile } from "@/lib/storefront/profile";
import { BRAND_PALETTE, themeVars } from "@/lib/theme";
import { RevealObserver } from "@/components/effects/RevealObserver";
import { IconInstagram, IconWhatsApp } from "./icons";
import { NavTabs } from "./NavTabs";
import { TrustBadge, parseFaq } from "./StorefrontHome";
import { TopBanner } from "./TopBanner";

/**
 * Vitrin kabuğu (Seyyah vitrin tasarımı): iletişim bandı, iki satırlı
 * yapışkan beyaz başlık (solda arama, ortada acente logosu, sağda sepet /
 * giriş / yardım; ikinci satırda ikonlu modül sekmeleri), içerik, güven
 * şeridi ve koyu altbilgi. Karakter `config`ten: marka rengi, çubuk tonu,
 * köşe, menü, altbilgi.
 *
 * Kök `data-surface="vitrin"` taşır: zemin, köşe ve font rolleri
 * `globals.css`'te bu seçici altında ezilir; Plus Jakarta Sans + Fraunces
 * değişkenleri yalnız bu köke yüklenir (`vitrinFontClass`).
 *
 * Başlık iki satır ve her genişlikte sabit yükseklik (`--header-h`,
 * 110 px); iletişim bandı başlığın DIŞINDA kalır ki bu değer sabit kalsın.
 * Aynı bileşen gerçek vitrinde ve editörün önizlemesinde çalışır;
 * önizlemede bağlantılar kapalı.
 */
export type NavLink = { label: string; href: string };

export function StorefrontFrame({
  name,
  config,
  profile,
  moduleLinks = [],
  preview = false,
  staticPages = false,
  notice,
  children,
}: {
  name: string;
  config: SiteConfig;
  profile: StorefrontProfile | null;
  /** İçeriği olan modül bölümlerinden otomatik üretilen sekmeler (Turlar, Tekneler…). */
  moduleLinks?: NavLink[];
  preview?: boolean;
  /** Örnek vitrin: içerik sayfaları sabit metinle var, bağlantılar her zaman çizilir. */
  staticPages?: boolean;
  /** Kabuğun en üstünde, vitrin kapsamı İÇİNDE basılan uyarı (örnek vitrin banner'ı). */
  notice?: React.ReactNode;
  children: React.ReactNode;
}) {
  const brand = BRAND_PALETTE.find((b) => b.id === config.theme.brand) ?? BRAND_PALETTE[0];
  // Köşe ölçeği: yumuşak 12/22/28 (Seyyah), keskin 4/6/8.
  const style: React.CSSProperties = {
    ...(themeVars(brand.hex, brand.highlight) as React.CSSProperties),
    ...((config.theme.radius === "sharp"
      ? { "--radius": "4px", "--radius-lg": "6px", "--radius-xl": "8px" }
      : { "--radius": "12px", "--radius-lg": "22px", "--radius-xl": "28px" }) as React.CSSProperties),
  };
  const inverse = config.theme.header === "inverse";
  const L = preview ? PreviewLink : Link;
  const hasUtility = !!(profile?.contactPhone || config.footer.whatsapp);
  const navLinks = [...moduleLinks, ...config.nav.links.filter((l) => !moduleLinks.some((m) => m.href === l.href))];
  const tursabNo = config.footer.showTursab ? profile?.tursabNo ?? null : null;
  const year = new Date().getFullYear();
  // İçerik sayfaları: metni olmayan sayfa yoktur, bağlantısı da çizilmez (VITRIN.md §4.6).
  const hasFaq = staticPages || config.sections.some((x) => x.kind === "faq" && x.enabled && parseFaq(x.body).length > 0);
  const hasIptal = staticPages || config.pages.iptalIade.trim().length > 0;
  const hasKvkk = staticPages || config.pages.kvkk.trim().length > 0;
  const hasSupport = hasFaq || hasIptal || hasKvkk;

  const ink = inverse ? "text-ink-inverse" : "text-ink";
  const ink2 = inverse ? "text-ink-inverse-2 hover:text-ink-inverse" : "text-ink-2 hover:text-ink";
  const footLink = "text-[15px] text-ink-inverse-2 transition-colors hover:text-ink-inverse";

  return (
    <div className={`${vitrinFontClass} flex min-h-dvh flex-col bg-paper text-ink`} style={style} data-surface="vitrin" data-preview={preview || undefined}>
      {!preview && (
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-[var(--radius)] focus:bg-action focus:px-3 focus:py-2 focus:text-on-action"
        >
          {t("nav.skipToContent")}
        </a>
      )}

      {notice}
      {config.nav.announcement && <TopBanner text={config.nav.announcement} preview={preview} />}

      {hasUtility && (
        <div className="hidden bg-inverse px-4 text-[13px] text-ink-inverse-2 sm:block">
          <div className="mx-auto flex h-9 w-full max-w-[1320px] items-center gap-5">
            {profile?.contactPhone && (
              <a href={`tel:${profile.contactPhone.replace(/\s/g, "")}`} className="tnum flex items-center gap-1.5 hover:text-ink-inverse">
                <Phone className="size-3.5" />
                {profile.contactPhone}
                {profile.phoneHours && <span className="ms-1 text-ink-inverse-3">{profile.phoneHours}</span>}
              </a>
            )}
            <span className="flex-1" />
            {config.footer.whatsapp && (
              <a href={`https://wa.me/${config.footer.whatsapp.replace(/^\+/, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-ink-inverse">
                <IconWhatsApp size={13} />
                {t("b2c.detail.whatsapp")}
              </a>
            )}
          </div>
        </div>
      )}

      {/* --- Başlık: iki satır, yapışkan, sabit yükseklik --------------------- */}
      <header className={`sticky top-0 z-30 ${inverse ? "bg-inverse text-ink-inverse" : "bg-surface/95 text-ink shadow-[0_1px_0_0_var(--border-default)] backdrop-blur"}`}>
        <div className="mx-auto grid h-16 w-full max-w-[1320px] grid-cols-[1fr_auto] items-center gap-4 px-4 lg:grid-cols-[1fr_auto_1fr]">
          {/* Arama alanı: GET /magaza/tur-arama?nereye=… — katalog bunu süzer. */}
          <form
            action={preview ? undefined : "/magaza/tur-arama"}
            role="search"
            className={`hidden h-11 max-w-[400px] items-center gap-3 rounded-[var(--radius)] px-4 transition-colors lg:flex ${
              inverse ? "bg-inverse-raised focus-within:ring-2 focus-within:ring-ink-inverse" : "bg-sunken focus-within:bg-surface focus-within:ring-2 focus-within:ring-ink"
            }`}
          >
            <Search className="size-5 shrink-0" />
            <input
              name="nereye"
              type="search"
              disabled={preview}
              placeholder={t("b2c.nav.searchPlaceholder")}
              aria-label={t("b2c.nav.search")}
              className={`min-w-0 flex-1 bg-transparent text-[15px] italic outline-none placeholder:italic ${
                inverse ? "text-ink-inverse placeholder:text-ink-inverse-3" : "text-ink placeholder:text-ink-3"
              }`}
            />
          </form>

          <L href="/magaza" aria-label={name} className="flex items-center gap-2.5 justify-self-start lg:justify-self-center">
            <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius)] bg-highlight text-on-highlight">
              <Waves className="size-5" strokeWidth={2.4} />
            </span>
            <span className={`truncate text-xl leading-none font-extrabold tracking-tight sm:text-2xl ${ink}`}>{name}</span>
          </L>

          <nav aria-label={t("b2c.nav.menu")} className="flex items-center justify-end gap-4 text-[15px] font-medium sm:gap-5">
            <L href="/magaza/tur-arama" aria-label={t("b2c.nav.search")} className={`grid h-10 w-10 place-items-center rounded-full lg:hidden ${ink2}`}>
              <Search className="size-5" />
            </L>
            {config.nav.showCart && (
              <L
                href="/magaza/sepet"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold ${
                  inverse ? "bg-inverse-raised text-ink-inverse" : "bg-action-tint text-action hover:brightness-95"
                }`}
              >
                <ShoppingBag className="size-[18px]" />
                <span className="hidden sm:inline">{t("b2c.cart")}</span>
              </L>
            )}
            {config.nav.showSignIn && (
              <L href="/giris" className={`hidden hover:underline md:block ${ink2}`}>
                {t("site.nav.signIn")}
              </L>
            )}
            <a href="#yardim" className={`flex items-center gap-1.5 hover:underline ${ink2}`}>
              <HelpCircle className="size-5" />
              <span className="hidden sm:inline">{t("b2c.nav.help")}</span>
            </a>
          </nav>
        </div>
        <div className={`border-t ${inverse ? "border-inverse-raised" : "border-line"}`}>
          <div className="mx-auto flex h-11 w-full max-w-[1320px] items-stretch px-2">
            <NavTabs links={[{ label: t("b2c.nav.home"), href: "/magaza" }, ...navLinks]} inverse={inverse} preview={preview} />
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      {/* --- Altbilgi: güven şeridi + koyu dört kolon + telif ---------------- */}
      <footer id="yardim" className="mt-24">
        {(config.theme.trustBadges.length > 0 || tursabNo) && (
          <div className="border-t border-line bg-paper">
            <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-center gap-2.5 px-4 py-5">
              <TrustBadge>{t("b2c.trust.instant")}</TrustBadge>
              {config.theme.trustBadges.map((b) => (
                <TrustBadge key={b}>{b}</TrustBadge>
              ))}
              {tursabNo && <TrustBadge>{t("b2c.tursab", { no: tursabNo })}</TrustBadge>}
            </div>
          </div>
        )}
        <div className="bg-inverse text-ink-inverse">
          <div className="mx-auto grid w-full max-w-[1320px] gap-12 px-4 py-16 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div>
              <span className="flex items-center gap-2.5">
                <span className="grid size-11 place-items-center rounded-[var(--radius)] bg-highlight text-on-highlight">
                  <Waves className="size-6" strokeWidth={2.4} />
                </span>
                <span className="text-2xl font-extrabold tracking-tight text-ink-inverse">{name}</span>
              </span>
              {config.footer.note && <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-ink-inverse-2">{config.footer.note}</p>}
              <ul className="mt-6 flex flex-col gap-2 text-[15px] text-ink-inverse-2">
                {profile?.contactPhone && (
                  <li>
                    <a href={`tel:${profile.contactPhone.replace(/\s/g, "")}`} className="tnum flex items-center gap-2 hover:text-ink-inverse">
                      <Phone className="size-4 text-warning-inverse" /> {profile.contactPhone}
                      {profile.phoneHours && <span className="text-ink-inverse-3">{profile.phoneHours}</span>}
                    </a>
                  </li>
                )}
                {profile?.contactEmail && (
                  <li className="flex items-center gap-2">
                    <Mail className="size-4 text-warning-inverse" /> {profile.contactEmail}
                  </li>
                )}
                {profile?.address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-1 size-4 shrink-0 text-warning-inverse" /> <span>{profile.address}</span>
                  </li>
                )}
              </ul>
            </div>

            <nav aria-label={t("footerNav.explore")}>
              <h2 className="font-bold text-ink-inverse">{t("footerNav.explore")}</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                <li><L href="/magaza/hakkimizda" className={footLink}>{t("b2c.nav.about")}</L></li>
                {moduleLinks.map((l) => (
                  <li key={l.href}><L href={l.href} className={footLink}>{l.label}</L></li>
                ))}
                {config.nav.links.filter((l) => !moduleLinks.some((m) => m.href === l.href)).map((l) => (
                  <li key={l.href}><L href={l.href} className={footLink}>{l.label}</L></li>
                ))}
              </ul>
            </nav>

            <nav aria-label={t("footerNav.support")}>
              <h2 className="font-bold text-ink-inverse">{t("footerNav.support")}</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {hasFaq && <li><L href="/magaza/sss" className={footLink}>{t("b2c.nav.faq")}</L></li>}
                {hasIptal && <li><L href="/magaza/iptal-iade" className={footLink}>{t("b2c.nav.terms")}</L></li>}
                {hasKvkk && <li><L href="/magaza/kvkk" className={footLink}>{t("b2c.nav.privacy")}</L></li>}
                <li><L href="/magaza/iletisim" className={footLink}>{t("b2c.nav.contact")}</L></li>
                {!hasSupport && <li className="text-[15px] text-ink-inverse-3">{t("b2c.contactPending")}</li>}
              </ul>
            </nav>

            <div>
              <h2 className="font-bold text-ink-inverse">{t("b2c.nav.contact")}</h2>
              <ul className="mt-4 flex flex-col gap-2.5 text-[15px] text-ink-inverse-2">
                {config.footer.whatsapp && (
                  <li>
                    <a href={`https://wa.me/${config.footer.whatsapp.replace(/^\+/, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-ink-inverse">
                      <IconWhatsApp size={15} /> {t("b2c.detail.whatsapp")}
                    </a>
                  </li>
                )}
                {config.footer.instagram && (
                  <li>
                    <a href={`https://instagram.com/${config.footer.instagram}`} rel="noreferrer" target="_blank" className="flex items-center gap-2 hover:text-ink-inverse">
                      <IconInstagram size={16} /> @{config.footer.instagram}
                    </a>
                  </li>
                )}
                {tursabNo && <li className="text-ink-inverse-3">{t("b2c.tursab", { no: tursabNo })}</li>}
                {!config.footer.whatsapp && !config.footer.instagram && !tursabNo && !profile?.contactPhone && (
                  <li className="text-ink-inverse-3">{t("b2c.contactPending")}</li>
                )}
              </ul>
            </div>
          </div>
          <div className="border-t border-ink-inverse-3/20">
            <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-2 px-4 py-6 text-sm text-ink-inverse-3 sm:flex-row sm:items-center sm:justify-between">
              <span>© {year} {name}</span>
              <span>{t("b2c.footer.taxNote")}</span>
            </div>
          </div>
        </div>
      </footer>
      <RevealObserver />
    </div>
  );
}

/** Önizlemede bağlantı gibi görünen ama gitmeyen öğe. */
export function PreviewLink({ href: _href, className, children }: { href: string; className?: string; children: React.ReactNode; "aria-label"?: string }) {
  void _href;
  return (
    <span className={className} aria-disabled="true">
      {children}
    </span>
  );
}
