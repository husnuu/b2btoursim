import { report } from "@/lib/report";

/**
 * İstemci tarafı hata yakalama — uygulama etkileşimli olmadan önce kurulur.
 *
 * React ağacının içindeki hatalar error.tsx sınırlarına düşer; buradaki iki
 * dinleyici onların dışında kalanları yakalar: olay işleyicilerinden kaçan
 * hatalar, yakalanmamış promise reddi, üçüncü parti script hataları.
 */

try {
  window.addEventListener("error", (event) => {
    report({
      kind: "client-error",
      message: event.message || "bilinmeyen hata",
      stack: event.error instanceof Error ? event.error.stack : undefined,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const r = event.reason;
    report({
      kind: "unhandled-rejection",
      message: r instanceof Error ? r.message : String(r),
      stack: r instanceof Error ? r.stack : undefined,
    });
  });
} catch {
  /* ölçüm kurulumu başarısız olsa da uygulama çalışır */
}
