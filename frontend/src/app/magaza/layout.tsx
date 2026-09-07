import Link from "next/link";
import { AGENCY } from "@/data/mock";
import { t } from "@/lib/i18n";

/**
 * B2C mağaza kabuğu. Bu ağaç SSR/ISR ile üretilir — organik trafik B2C'nin
 * tüm müşteri edinme stratejisi (Bölüm 8).
 *
 * Yoğunluk burada comfortable: aynı bileşenler, gevşek ölçek.
 */
export default function MagazaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2
                   focus:rounded-[var(--radius)] focus:bg-action focus:px-3 focus:py-2 focus:text-on-action"
      >
        {t("nav.skipToContent")}
      </a>

      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
          <Link
            href="/magaza"
            className="font-dense text-lg font-semibold tracking-tight text-ink"
          >
            {AGENCY.name}
          </Link>
          <nav className="ms-auto flex items-center gap-5 text-[length:var(--font-ui)] text-ink-2">
            <Link href="/magaza/tur-arama" className="hover:text-ink">
              Turlar
            </Link>
            <Link href="/magaza/sepet" className="hover:text-ink">
              {t("b2c.cart")}
            </Link>
            <Link href="/giris" className="hover:text-ink">
              {t("site.nav.signIn")}
            </Link>
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
              <li><Link href="/magaza/hakkimizda" className="hover:text-ink">{t("b2c.nav.about")}</Link></li>
              <li><Link href="/magaza/sss" className="hover:text-ink">{t("b2c.nav.faq")}</Link></li>
              <li><Link href="/magaza/iptal-iade" className="hover:text-ink">{t("b2c.nav.terms")}</Link></li>
              <li><Link href="/magaza/kvkk" className="hover:text-ink">{t("b2c.nav.privacy")}</Link></li>
              <li><Link href="/magaza/iletisim" className="hover:text-ink">{t("b2c.nav.contact")}</Link></li>
            </ul>
          </nav>
          <p className="mt-5 border-t border-line pt-5 text-[length:var(--font-ui-sm)] text-ink-3">
            {AGENCY.name} — TÜRSAB belgeli acente. Fiyatlar TRY cinsindendir ve
            vergiler dahildir.
          </p>
        </div>
      </footer>
    </div>
  );
}
