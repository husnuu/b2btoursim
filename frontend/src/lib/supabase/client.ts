"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { publicSupabaseEnv } from "./env";

/** Tarayıcı istemcisi. Oturum çerezde; sunucuyla aynı oturumu paylaşır. */
export function createClient() {
  const { url, key } = publicSupabaseEnv();
  return createBrowserClient<Database>(url, key);
}
