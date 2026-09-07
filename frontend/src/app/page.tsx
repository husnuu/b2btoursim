import Link from "next/link";
import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { SEARCH_SUPPLIERS } from "@/data/mock";
import { ButtonLink } from "@/components/primitives/Button";
import { SupplierMark } from "@/components/primitives/SupplierMark";
import { LivePriceDemo } from "@/components/site/LivePriceDemo";
import { SupplierStripDemo } from "@/components/site/SupplierStripDemo";
import { ViewSplit } from "@/components/site/ViewSplit";
import { SurfaceShowcase } from "@/components/site/SurfaceShowcase";
import { ContactLines } from "@/components/site/ContactLines";

/**
 * Platformun tanıtım sayfası.
 *
 * Sayfa, operatörün ekranından müşterinin ekranına doğru bir yürüyüş:
 * canlı fiyat satırı → tedarikçilerin yanıtı → iki ekran arasındaki sınır →
 * yüzeyler → iletişim.
 *
 * Tek tonal olay ortadaki koyu bölüm. O bölüm zaten iki farklı ekranı
 * anlattığı için karanlık–aydınlık karşıtlığı açıklamayı kendisi yapıyor;
 * sayfanın geri kalanı sessiz kalıyor.
 *
 * Her panel ürünün gerçek bileşeni — sayfada ürünün resmi değil, kendisi var.
 */
export const metadata: Metadata = {
  title: "Kontuar — acenteler için satış terminali",
  description:
    "Bağlı tedarikçilerinizi tek aramada sorgulayın; net fiyatı, marjı ve satış fiyatını aynı satırda görün. Seyahat acenteleri ve tur operatörleri için çok kiracılı satış platformu.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2
                   focus:rounded-[var(--radius)] focus:bg-action focus:px-3 focus:py-2 focus:text-on-action"
      >
        {t("nav.skipToContent")}
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-8 px-5">
          <Link
            href="/"
            className="font-dense text-xl font-semibold tracking-tight text-ink"
          >
            {t("app.name")}
          </Link>
          <nav className="hidden items-center gap-6 text-ink-2 md:flex">
            <a href="#urun" className="hover:text-ink">
              {t("site.nav.product")}
            </a>
            <a href="#yuzeyler" className="hover:text-ink">
              {t("site.nav.surfaces")}
            </a>
          </nav>
          <div className="ms-auto flex items-center gap-3">
            <Link href="/extranet" className="hidden text-ink-2 hover:text-ink sm:block">
              {t("site.nav.signIn")}
            </Link>
            <ButtonLink href="#iletisim" variant="primary">
              {t("site.nav.demo")}
            </ButtonLink>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {/* --- Hero -------------------------------------------------------- */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-20 pt-16 lg:pb-28 lg:pt-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.18fr)] lg:items-center">
            <div>
              <h1 className="max-w-[15ch] font-dense text-[clamp(2.4rem,5vw,3.9rem)] font-semibold leading-[0.98] tracking-[-0.02em] text-ink">
                {t("site.hero.title")}
              </h1>
              <p className="mt-6 max-w-[48ch] text-[length:calc(var(--font-ui)*1.15)] leading-relaxed text-ink-2">
                {t("site.hero.lead")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="#iletisim" variant="primary" size="lg">
                  {t("site.hero.cta")}
                </ButtonLink>
                <ButtonLink href="/extranet" size="lg">
                  {t("site.hero.ctaSecondary")}
                </ButtonLink>
              </div>

              {/* Ürünün kelime dağarcığı sayfanın ilk ekranında görünsün. */}
              <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-5">
                <span className="text-[length:var(--font-ui-sm)] text-ink-3">
                  {t("site.hero.sources")}
                </span>
                {SEARCH_SUPPLIERS.map((s) => (
                  <SupplierMark key={s.id} supplier={s} showName />
                ))}
              </div>
            </div>

            <LivePriceDemo />
          </div>
        </section>

        {/* --- Kısmi hata --------------------------------------------------- */}
        <section id="urun" className="border-t border-line bg-surface">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:py-24">
            <div>
              <h2 className="max-w-[16ch] font-dense text-[clamp(1.9rem,3.6vw,2.8rem)] font-semibold leading-[1.02] tracking-[-0.015em] text-ink">
                {t("site.race.title")}
              </h2>
              <p className="mt-5 max-w-[50ch] leading-relaxed text-ink-2">
                {t("site.race.lead")}
              </p>
              <p className="mt-5 border-s-2 border-ink ps-3 text-ink">
                {t("site.race.note")}
              </p>
            </div>
            <SupplierStripDemo />
          </div>
        </section>

        {/* --- İki ekran: sayfanın tek tonal olayı --------------------------- */}
        <section className="bg-inverse">
          <div className="mx-auto w-full max-w-6xl px-5 py-20 lg:py-28">
            <h2 className="max-w-[20ch] font-dense text-[clamp(2rem,4vw,3.1rem)] font-semibold leading-[1.02] tracking-[-0.015em] text-ink-inverse">
              {t("site.split.title")}
            </h2>
            <p className="mt-5 max-w-[58ch] leading-relaxed text-ink-inverse-2">
              {t("site.split.note")}
            </p>
            <div className="mt-12">
              <ViewSplit />
            </div>
          </div>
        </section>

        {/* --- Yüzeyler ----------------------------------------------------- */}
        <section id="yuzeyler" className="border-t border-line">
          <div className="mx-auto w-full max-w-6xl px-5 py-20 lg:py-24">
            <h2 className="font-dense text-[clamp(1.9rem,3.6vw,2.8rem)] font-semibold leading-[1.02] tracking-[-0.015em] text-ink">
              {t("site.surfaces.title")}
            </h2>
            <p className="mt-4 max-w-[56ch] text-ink-2">{t("site.surfaces.lead")}</p>
            <div className="mt-10">
              <SurfaceShowcase />
            </div>
          </div>
        </section>

        {/* --- İletişim ----------------------------------------------------- */}
        <section id="iletisim" className="border-t border-line bg-surface">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:py-24">
            <div>
              <h2 className="max-w-[16ch] font-dense text-[clamp(1.9rem,3.6vw,2.8rem)] font-semibold leading-[1.02] tracking-[-0.015em] text-ink">
                {t("site.close.title")}
              </h2>
              <p className="mt-5 max-w-[50ch] leading-relaxed text-ink-2">
                {t("site.close.lead")}
              </p>
            </div>
            <ContactLines />
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-baseline justify-between gap-4 px-5 py-8 text-[length:var(--font-ui-sm)] text-ink-3">
          <p>{t("site.footer.rights")}</p>
          <p>{t("site.footer.note")}</p>
          <a href="#yuzeyler" className="hover:text-ink">
            {t("site.nav.surfaces")}
          </a>
        </div>
      </footer>
    </div>
  );
}
