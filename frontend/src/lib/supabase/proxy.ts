import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSession, homeForRole, parseAppClaims } from "@/lib/auth/claims";
import { publicSupabaseEnv } from "./env";

/** Oturum gerektiren ağaçlar. */
const PROTECTED = ["/extranet", "/admin", "/sifre-belirle", "/site-onizleme"];

/**
 * Her istekte oturumu yeniler ve iyimser yönlendirme yapar.
 *
 * Yetki kararı burada verilmez — proxy çerezi görür, çerez sahtelenebilir.
 * Gerçek karar RLS'te (veri) ve layout'ta (sayfa). Buradaki yönlendirme
 * kullanıcıyı doğru kapıya götürmek için: girişsizi girişe, girişliyi
 * paneline.
 */
export async function updateSession(request: NextRequest, requestHeaders?: Headers) {
  const forward = () => NextResponse.next({ request: { headers: requestHeaders ?? request.headers } });
  let response = forward();
  const { url, key } = publicSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = forward();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // createServerClient ile getClaims arasına kod girmez: token yenileme
  // burada olur, araya giren bir hata kullanıcıyı rastgele düşürür.
  const { data } = await supabase.auth.getClaims();
  const raw = data?.claims as Record<string, unknown> | undefined;
  // Kapı OTURUMA bakar, uygulama taleplerine değil: hook Dashboard'da
  // seçilmemişse oturum var ama talep yok — o durumda kullanıcı girişe
  // geri atılmamalı (sonsuz döngü), layout'taki kurulum uyarısına ulaşmalı.
  const session = hasSession(raw);
  const claims = parseAppClaims(raw);

  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!session && isProtected) {
    const to = request.nextUrl.clone();
    to.pathname = "/giris";
    to.search = "";
    to.searchParams.set("next", pathname + search);
    return NextResponse.redirect(to);
  }

  if (session) {
    // Girişli kullanıcı giriş sayfasına gelirse paneline gider.
    if (pathname === "/giris") {
      const to = request.nextUrl.clone();
      to.pathname = claims ? homeForRole(claims.role) : "/extranet";
      to.search = "";
      return NextResponse.redirect(to);
    }
    // Süper Admin yalnız platform yöneticisine (talepler varsa karar verilir;
    // yoksa layout kurulum uyarısını basar).
    if (claims && pathname.startsWith("/admin") && claims.role !== "platform_admin") {
      const to = request.nextUrl.clone();
      to.pathname = "/extranet";
      to.search = "";
      return NextResponse.redirect(to);
    }
  }

  return response;
}
