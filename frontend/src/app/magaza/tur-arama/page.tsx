import { Suspense } from "react";
import { TOUR_RESULTS } from "@/data/mock";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { listPublishedTours } from "@/lib/storefront/tours";
import { StoreSearchResults } from "@/components/b2c/StoreSearchResults";

/** B2C arama sonuç sayfası — Sitemap Bölüm 3, /tur-arama (MVP). */
export default async function TurAramaPage() {
  const tenant = await getStorefrontTenant();
  const source = tenant ? await listPublishedTours(tenant.id) : TOUR_RESULTS;
  return (
    <Suspense fallback={null}>
      <StoreSearchResults source={source} retailMarginPct={tenant ? 0 : 22} />
    </Suspense>
  );
}
