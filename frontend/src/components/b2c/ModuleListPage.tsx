import { Suspense } from "react";
import { notFound } from "next/navigation";
import { t } from "@/lib/i18n";
import { getPublishedSite, getStorefrontData, type ModuleKind } from "@/lib/site/load";
import type { KartUrun } from "@/lib/storefront/kart";
import { facetOptions, textMatch, usefulFilters, type FilterDef } from "@/lib/storefront/katalog";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { Catalog } from "./Catalog";
import { Breadcrumb } from "./detail/DetailShell";

type Params = Record<string, string | string[] | undefined>;

/**
 * Modül liste sayfası (Tekneler, Villalar, Transferler, Vize): breadcrumb +
 * bölüm başlığı/alt metni (site tasarımından) + katalog iskeleti.
 *
 * Kahramandaki aramanın parametrelerini okur (VITRIN.md §4.2): `kisi`
 * kapasiteyi süzer, metin başlığa bakar; tarih ve saat detaydaki talep
 * kutusuna taşınır (kart bağlantısına eklenir), listeyi süzmez — müsaitlik
 * sunucuda, talep anında denetlenir.
 */
export async function ModuleListPage({
  kind,
  fallbackTitle,
  searchParams,
}: {
  kind: ModuleKind;
  fallbackTitle: string;
  searchParams?: Promise<Params>;
}) {
  const tenant = await getStorefrontTenant();
  if (!tenant) notFound();
  const sp = (await searchParams) ?? {};
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) ?? "";
  const kisi = Number(one("kisi")) || 0;
  const query = (one("nereye") || one("ulke") || one("q")).trim();
  const carry = new URLSearchParams();
  for (const k of ["tarih", "saat", "giris", "cikis", "kisi", "nereden", "nereye"]) if (one(k)) carry.set(k, one(k));
  const qs = carry.toString();

  const config = await getPublishedSite(tenant.id);
  const section = config.sections.find((s) => s.kind === kind);
  const data = await getStorefrontData(tenant.id, {
    ...config,
    sections: [{ ...(section ?? { id: kind, kind, title: fallbackTitle, lead: "", limit: 24, body: "" }), enabled: true }],
  });

  const capacityFacet = kind === "boats" ? "kapasite" : kind === "villas" ? "kisi" : kind === "transfers" ? "koltuk" : null;
  const items: KartUrun[] = (data.modules[kind] ?? [])
    .filter((it) => !kisi || !capacityFacet || Number(it.facets[capacityFacet] ?? 0) >= kisi)
    .filter((it) => !query || kind === "visa" ? textMatch(it, query) : textMatch(it, query))
    .map((it) => (qs ? { ...it, href: `${it.href}?${qs}` } : it));

  const filters: FilterDef[] = usefulFilters(filterDefs(kind, items));
  const title = section?.title ?? fallbackTitle;

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-8">
      <Breadcrumb items={[{ label: title }]} />
      <div className="mt-3">
        <h1 className="tab-in text-[2rem] font-extrabold tracking-tight text-ink sm:text-5xl">{title}</h1>
        {section?.lead && <p className="mt-3 max-w-[60ch] text-lg text-ink-2">{section.lead}</p>}
      </div>
      <div className="mt-8">
        <Suspense fallback={null}>
          <Catalog items={items} filters={filters} />
        </Suspense>
      </div>
    </div>
  );
}

function filterDefs(kind: ModuleKind, items: KartUrun[]): FilterDef[] {
  switch (kind) {
    case "boats":
      return [
        {
          id: "kaptan",
          label: t("b2c.filter.kaptan"),
          options: facetOptions(items, "kaptan", (v) => t(`b2c.filter.kaptan.${v}` as "b2c.filter.kaptan.kaptanli"), ["kaptanli", "kaptansiz", "herIkisi"]),
        },
      ];
    case "villas":
      return [{ id: "bolge", label: t("b2c.filter.bolge"), options: facetOptions(items, "bolge") }];
    case "transfers":
      return [
        { id: "tip", label: t("b2c.filter.tip"), options: facetOptions(items, "tip", (v) => t(`b2c.filter.tip.${v}` as "b2c.filter.tip.private"), ["private", "shuttle"]) },
      ];
    case "visa":
      return [{ id: "ulke", label: t("b2c.filter.ulke"), options: facetOptions(items, "ulke") }];
  }
}
