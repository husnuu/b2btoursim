import type { Metadata } from "next";
import { ConfirmClient } from "@/components/auth/ConfirmClient";
import { safeNext } from "@/lib/auth/claims";

export const metadata: Metadata = { title: "Doğrulanıyor — Kontuar" };

/**
 * E-posta bağlantılarının indiği uç: davet, şifre sıfırlama.
 *
 * Supabase'in varsayılan şablonu token'ları URL'nin `#` parçasında
 * gönderir; parça sunucuya hiç ulaşmaz. Bu yüzden burası bir sayfa:
 * tarayıcı parçayı okur ve oturumu çerezlere yazar. `token_hash` ve
 * `code` biçimleri de desteklenir (sunucu eylemiyle) — e-posta şablonu
 * ne olursa olsun çalışır, Dashboard'da şablon değiştirmek gerekmez.
 */
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; code?: string; next?: string }>;
}) {
  const p = await searchParams;
  return (
    <ConfirmClient
      tokenHash={p.token_hash ?? null}
      type={p.type ?? null}
      code={p.code ?? null}
      next={safeNext(p.next, "/sifre-belirle")}
    />
  );
}
