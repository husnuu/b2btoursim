import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { publicSupabaseEnv } from "@/lib/supabase/env";
import { parseStorefrontHost } from "./host";

export type StorefrontTenant = {
  id: string;
  name: string;
  slug: string;
  brandColor: string | null;
  logoPath: string | null;
};

/**
 * Vitrin istemcisi HER ZAMAN anonimdir — çerez okumaz.
 *
 * Aksi halde Extranet'te oturumu açık bir operatör başka bir acentenin
 * vitrinini açınca sorgu `authenticated` rolüyle gider, kiracı izolasyonu
 * politikası o kiracıyı gizler ve vitrin "bulunamadı" der. Vitrin müşteri
 * gözüdür; kim baktığından bağımsız aynı şeyi göstermeli.
 */
export function createStorefrontClient() {
  const { url, key } = publicSupabaseEnv();
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function findTenant(host: ReturnType<typeof parseStorefrontHost>): Promise<StorefrontTenant | null> {
  if (host.kind === "none") return null;
  const db = createStorefrontClient();

  let slug: string | null = null;
  if (host.kind === "slug") {
    slug = host.slug;
  } else {
    const { data } = await db
      .from("tenant_domain")
      .select("tenant:tenant(slug)")
      .eq("hostname", host.hostname)
      .maybeSingle();
    slug = data?.tenant?.slug ?? null;
  }
  if (!slug) return null;

  const { data: t } = await db
    .from("tenant")
    .select("id, name, slug, tenant_branding(brand_color, logo_path)")
    .eq("slug", slug)
    .maybeSingle();
  if (!t) return null;

  const branding = Array.isArray(t.tenant_branding) ? t.tenant_branding[0] : t.tenant_branding;
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    brandColor: branding?.brand_color ?? null,
    logoPath: branding?.logo_path ?? null,
  };
}

/** Adresin türü: vitrin adresi mi, uygulamanın kendi adresi mi. */
export const getStorefrontHost = cache(async () => {
  const h = await headers();
  return parseStorefrontHost(h.get("x-forwarded-host") ?? h.get("host"));
});

/** İstek başına bir kez: layout ve sayfalar aynı sonucu paylaşır. */
export const getStorefrontTenant = cache(async (): Promise<StorefrontTenant | null> => {
  return findTenant(await getStorefrontHost());
});
