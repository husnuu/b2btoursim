import "server-only";

import { cache } from "react";
import { createStorefrontClient } from "./tenant";

export type StorefrontProfile = {
  about: string;
  contactEmail: string | null;
  contactPhone: string | null;
  phoneHours: string | null;
  address: string | null;
  tursabNo: string | null;
};

/** Vitrinde görünen acente bilgileri; yoksa boş profil (alanlar gizlenir). */
export const getStorefrontProfile = cache(async (tenantId: string): Promise<StorefrontProfile> => {
  const db = createStorefrontClient();
  const { data } = await db
    .from("tenant_profile")
    .select("about, contact_email, contact_phone, phone_hours, address, tursab_no")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return {
    about: data?.about ?? "",
    contactEmail: data?.contact_email ?? null,
    contactPhone: data?.contact_phone ?? null,
    phoneHours: data?.phone_hours ?? null,
    address: data?.address ?? null,
    tursabNo: data?.tursab_no ?? null,
  };
});
