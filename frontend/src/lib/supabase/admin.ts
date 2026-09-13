import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { publicSupabaseEnv, secretSupabaseKey } from "./env";

/**
 * Yönetici istemcisi — RLS'i atlar. YALNIZ sunucuda, yalnız iki iş için:
 * kullanıcı daveti ve ilk kurulum. Veri okuma/yazma asla buradan
 * yapılmaz; onun yolu kullanıcının kendi oturumu + RLS'tir.
 *
 * Gizli anahtar yoksa null döner; çağıran kullanıcıya açık mesaj verir,
 * sessizce yayınlanabilir anahtara düşmez.
 */
export function createAdminClient() {
  const secret = secretSupabaseKey();
  if (!secret) return null;
  const { url } = publicSupabaseEnv();
  return createSupabaseClient<Database>(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
