/**
 * Supabase bağlantı bilgileri tek yerden okunur.
 *
 * Yayınlanabilir anahtar tarayıcıya gider — RLS bunu varsayar. Gizli
 * anahtar (`SUPABASE_SECRET_KEY`) yalnız sunucuda, yalnız davet ve
 * kurulum gibi yönetici işlemlerinde; `NEXT_PUBLIC_` öneki olmadığı için
 * paketlere hiçbir koşulda girmez.
 */
export function publicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY tanımlı değil (.env.local).",
    );
  }
  return { url, key };
}

/** Sunucu tarafı gizli anahtar; yoksa null — çağıran kullanıcıya söyler. */
export function secretSupabaseKey(): string | null {
  return process.env.SUPABASE_SECRET_KEY?.trim() || null;
}

/** Davet ve sıfırlama e-postalarındaki bağlantıların döneceği kök. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
