import type { NextConfig } from "next";

/**
 * Güvenlik başlıkları.
 *
 * Bu uygulama acente kimlik bilgileri ve yolcu verisi taşıyacak. Başlıklar
 * ucuz ama etkili bir taban savunması: clickjacking, MIME sniffing ve
 * referrer sızıntısını kapatır, tarayıcı API'lerini kısar.
 *
 * CSP şu an **Report-Only**. Gerçekten uygulamaya almadan önce raporları
 * toplayıp meşru kaynakları görmek gerekir; doğrudan enforce etmek üretimde
 * sayfayı kırar. Backend bağlandığında `connect-src` genişler ve başlık
 * `Content-Security-Policy` olarak açılır.
 */

const csp = [
  "default-src 'self'",
  // Next hidrasyon için satır içi script kullanır; nonce'a geçilene kadar
  // 'unsafe-inline' gerekiyor — bu yüzden henüz enforce edilmiyor.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    // Yalnız HTTPS üzerinden anlamlı; yerel geliştirmede tarayıcı yok sayar.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Sağlık ve telemetri uçları asla önbelleğe alınmaz.
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
