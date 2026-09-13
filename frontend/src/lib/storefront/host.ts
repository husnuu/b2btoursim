/**
 * Vitrin kiracısı ADRESTEN çözülür — yolda önek yok, çerez yok.
 *
 *   firma-adi.localhost:3000      → slug "firma-adi"   (geliştirme; tarayıcı
 *                                   *.localhost'u kendisi 127.0.0.1'e çözer)
 *   firma-adi.kontuar.com         → slug "firma-adi"   (wildcard DNS)
 *   www.firmaninkendisitesi.com   → tenant_domain tablosundan arama
 *   localhost / app.kontuar.com   → vitrin değil (Extranet, Admin, tanıtım)
 *
 * Yol öneki (/m/slug) seçilmedi: B2C bileşenleri /magaza/... bağlantılarını
 * sabit yazıyor; alan adı tabanlı çözüm o bağlantılara dokunmaz ve
 * white-label için zaten alan adı gerekiyor.
 */
export type StorefrontHost =
  | { kind: "slug"; slug: string }
  | { kind: "custom"; hostname: string }
  | { kind: "none" };

const DEV_SUFFIX = ".localhost";

function rootDomain(): string {
  return (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "").trim().toLowerCase();
}

/** Uygulamanın kendi adresleri: bunlarda vitrin çözülmez. */
function isAppHost(hostname: string, root: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (!root) return false;
  return hostname === root || hostname === `www.${root}` || hostname === `app.${root}`;
}

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function parseStorefrontHost(hostHeader: string | null | undefined): StorefrontHost {
  const hostname = (hostHeader ?? "").split(":")[0].trim().toLowerCase();
  if (!hostname) return { kind: "none" };
  const root = rootDomain();
  if (isAppHost(hostname, root)) return { kind: "none" };

  for (const suffix of [DEV_SUFFIX, root ? `.${root}` : ""]) {
    if (!suffix || !hostname.endsWith(suffix)) continue;
    const label = hostname.slice(0, -suffix.length);
    // Yalnız tek seviye: a.b.localhost vitrin değil.
    if (label && !label.includes(".") && SLUG.test(label) && label !== "www" && label !== "app") {
      return { kind: "slug", slug: label };
    }
    return { kind: "none" };
  }

  return { kind: "custom", hostname };
}
