import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { publicSupabaseEnv } from "./env";

/**
 * Sunucu istemcisi — Server Component, Server Action ve Route Handler.
 *
 * Her istekte yeni istemci: Fluid Compute örnekleri istekler arasında
 * paylaşıldığı için modül düzeyinde tutulan bir istemci iki kullanıcının
 * oturumunu karıştırırdı.
 */
export async function createClient() {
  const { url, key } = publicSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component içinden çağrıldı: çerez yazılamaz. Oturum
          // yenilemesini proxy yaptığı için sorun değil.
        }
      },
    },
  });
}
