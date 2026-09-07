import { Suspense } from "react";
import { StoreSearchResults } from "@/components/b2c/StoreSearchResults";

/** B2C arama sonuç sayfası — Sitemap Bölüm 3, /tur-arama (MVP). */
export default function TurAramaPage() {
  return (
    <Suspense fallback={null}>
      <StoreSearchResults />
    </Suspense>
  );
}
