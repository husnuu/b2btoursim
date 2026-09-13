"use server";

import { revalidatePath } from "next/cache";
import { getSessionState } from "@/lib/auth/session";
import type { MessageKey } from "@/lib/i18n";
import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import { BRAND_PALETTE } from "@/lib/theme";

export type ProfileActionState = { error?: MessageKey; ok?: boolean };

function field(fd: FormData, name: string): string {
  const v = fd.get(name);
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Vitrin bilgilerini ve marka rengini kaydeder. Yalnız acente yöneticisi
 * (ya da platform yöneticisi); RLS kiracıyı zaten süzer, rol kontrolü
 * burada — görünürlük yetki değildir.
 */
export async function saveStorefrontProfile(
  _prev: ProfileActionState,
  fd: FormData,
): Promise<ProfileActionState> {
  const session = await getSessionState();
  if (session.kind !== "ready") return { error: "auth.error.generic" };
  const { role, tenantId } = session.claims;
  if (role !== "agency_admin" && role !== "platform_admin") {
    return { error: "storefront.error.forbidden" };
  }

  const brandId = field(fd, "brand");
  const brand = BRAND_PALETTE.find((b) => b.id === brandId);
  if (!brand) return { error: "storefront.error.brand" };

  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ error: profileError }, { error: brandingError }] = await Promise.all([
    supabase.from("tenant_profile").upsert(
      {
        tenant_id: tenantId,
        about: field(fd, "about"),
        contact_email: field(fd, "contactEmail") || null,
        contact_phone: field(fd, "contactPhone") || null,
        phone_hours: field(fd, "phoneHours") || null,
        address: field(fd, "address") || null,
        tursab_no: field(fd, "tursabNo") || null,
        updated_at: now,
      },
      { onConflict: "tenant_id" },
    ),
    supabase.from("tenant_branding").upsert(
      { tenant_id: tenantId, brand_color: brand.hex, updated_at: now },
      { onConflict: "tenant_id" },
    ),
  ]);

  if (profileError || brandingError) {
    log.warn("storefront.profile.saveFailed", {
      tenantId,
      code: profileError?.code ?? brandingError?.code,
    });
    return { error: "auth.error.generic" };
  }

  revalidatePath("/extranet/ayarlar");
  return { ok: true };
}
