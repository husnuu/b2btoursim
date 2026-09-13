import Link from "next/link";
import { AGENCY } from "@/data/mock";
import { t } from "@/lib/i18n";
import { defaultSiteConfig } from "@/lib/site/config";
import { getPublishedSite, getStorefrontData } from "@/lib/site/load";
import { getStorefrontProfile } from "@/lib/storefront/profile";
import { getStorefrontHost, getStorefrontTenant } from "@/lib/storefront/tenant";
import { StorefrontFrame } from "@/components/b2c/StorefrontFrame";
import { moduleNavLinks } from "@/components/b2c/StorefrontHome";

/**
 * B2C mağaza kabuğu. Kiracı ADRESTEN gelir; karakter (renk, çubuk, menü,
 * altbilgi) acentenin YAYINLADIĞI site yapısından. Kiracısız adreste
 * (localhost, tanıtım) örnek vitrin gösterilir ve bunu açıkça söyler.
 */
export default async function MagazaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = await getStorefrontHost();
  const tenant = await getStorefrontTenant();

  // Vitrin adresi ama kiracı yok: örnek vitrine DÜŞMEZ — yanlış acente
  // izlenimi verir. Ne olduğunu söyleyen düz bir sayfa.
  if (host.kind !== "none" && !tenant) {
    return (
      <main className="grid min-h-dvh place-items-center bg-paper px-4">
        <div className="max-w-md text-center">
          <h1 className="font-dense text-2xl font-semibold text-ink">{t("b2c.notFoundTitle")}</h1>
          <p className="mt-2 text-ink-2">{t("b2c.notFoundLead")}</p>
        </div>
      </main>
    );
  }

  if (!tenant) {
    const demo = defaultSiteConfig();
    demo.nav.showSignIn = true;
    return (
      <>
        <p className="border-b border-warning bg-warning-tint px-4 py-1.5 text-center text-[length:var(--font-ui-sm)] text-ink">
          {t("b2c.demoBanner")}{" "}
          <Link href="/" className="underline decoration-line-strong underline-offset-2">
            {t("b2c.backHome")}
          </Link>
        </p>
        <StorefrontFrame name={AGENCY.name} config={demo} profile={null} moduleLinks={[{ label: "Turlar", href: "/magaza/tur-arama" }]}>
          {children}
        </StorefrontFrame>
      </>
    );
  }

  const [config, profile] = await Promise.all([getPublishedSite(tenant.id), getStorefrontProfile(tenant.id)]);
  // Menü sekmeleri içeriğe göre: yayında tekne varsa "Tekne kiralama" sekmesi çıkar.
  const data = await getStorefrontData(tenant.id, config);
  const moduleLinks = moduleNavLinks(config, data, profile);

  return (
    <StorefrontFrame name={tenant.name} config={config} profile={profile} moduleLinks={moduleLinks}>
      {children}
    </StorefrontFrame>
  );
}
