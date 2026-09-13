import { NextResponse, type NextRequest } from "next/server";
import { parseStorefrontHost } from "@/lib/storefront/host";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16: middleware'in yeni adı.
 *
 * İki iş: (1) vitrin kiracısını adresten çözüp isteğe başlık olarak
 * eklemek, (2) oturumu yenileyip kapı yönlendirmesi yapmak.
 *
 * Vitrin adresinde (`firma.localhost`, `firma.kontuar.com`, özel alan adı)
 * kök yol `/magaza`ya yeniden yazılır; adres çubuğu değişmez. Extranet ve
 * Admin o adreslerde de çalışır — operatörün kendi vitrininden panele
 * geçmesi doğal.
 */
export async function proxy(request: NextRequest) {
  const host = parseStorefrontHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  const requestHeaders = new Headers(request.headers);
  if (host.kind === "slug") requestHeaders.set("x-storefront-slug", host.slug);
  if (host.kind === "custom") requestHeaders.set("x-storefront-host", host.hostname);

  if (host.kind !== "none" && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/magaza";
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  return updateSession(request, requestHeaders);
}

export const config = {
  // Statik dosyalar, görseller ve sağlık ucu proxy'den geçmez.
  matcher: [
    "/((?!_next/static|_next/image|api/health|api/telemetry|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
