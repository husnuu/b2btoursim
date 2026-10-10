import { Suspense } from "react";
import { TOUR_RESULTS } from "@/data/mock";
import { t } from "@/lib/i18n";
import { kartFromTour } from "@/lib/storefront/kart";
import { facetOptions, usefulFilters, textMatch, type FilterDef } from "@/lib/storefront/katalog";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { listPublishedTours } from "@/lib/storefront/tours";
import { Catalog } from "@/components/b2c/Catalog";
import { Breadcrumb } from "@/components/b2c/detail/DetailShell";

/**
 * Tur kataloğu (VITRIN.md §4.3). Veriye bağlı süzgeçler burada, sunucuda:
 * metin (`nereye`), tarih (`tarih`) ve kişi (`kisi`) turun ilan edilmiş
 * kalkış günlerine bakar. Facet, sıralama ve URL durumu `Catalog`'da.
 * Aynı üründen birden çok tedarikçi varsa müşteriye yalnız en ucuzu.
 */
export default async function TurAramaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) ?? "";
  const query = one("nereye").trim();
  const date = one("tarih");
  const pax = Math.max(1, Number(one("kisi")) || 1);

  const tenant = await getStorefrontTenant();
  const source = tenant ? await listPublishedTours(tenant.id) : TOUR_RESULTS;
  const margin = tenant ? 0 : 22;

  const cheapest = new Map<string, (typeof source)[number]>();
  for (const r of source) {
    const cur = cheapest.get(r.productId);
    if (!cur || r.net < cur.net) cheapest.set(r.productId, r);
  }
  const items = [...cheapest.values()]
    .filter((r) => {
      const days = r.departureDays;
      if (date && days && !days.some((d) => d.date === date)) return false;
      if (pax > 1 && days?.length) {
        const pool = date ? days.filter((d) => d.date === date) : days;
        if (!pool.some((d) => d.remaining >= pax)) return false;
      }
      return true;
    })
    .map((r) => kartFromTour(r, { retailMarginPct: margin }))
    .filter((k) => textMatch(k, query));

  const filters: FilterDef[] = usefulFilters([
    { id: "kategori", label: t("b2c.filter.kategori"), options: facetOptions(items, "kategori") },
    {
      id: "sure",
      label: t("b2c.filter.sure"),
      options: facetOptions(items, "sure", (v) => t(`b2c.filter.sure.${v}` as "b2c.filter.sure.yarimGun"), ["yarimGun", "tamGun", "cokGun"]),
    },
    { id: "dil", label: t("b2c.filter.dil"), options: facetOptions(items, "dil") },
    { id: "iptal", label: t("b2c.filter.iptal"), options: facetOptions(items, "iptal", () => t("b2c.filter.iptal.free")) },
  ]);

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-8">
      {tenant && <Breadcrumb items={[{ label: t("b2c.sectionTours") }]} />}
      <h1 className="tab-in mt-3 text-[2rem] font-extrabold tracking-tight text-ink sm:text-5xl">
        {t("b2c.searchTitle", { destination: query || t("b2c.searchAll") })}
      </h1>
      <div className="mt-8">
        <Suspense fallback={null}>
          <Catalog items={items} filters={filters} />
        </Suspense>
      </div>
    </div>
  );
}
