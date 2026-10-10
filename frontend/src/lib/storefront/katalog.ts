import type { KartUrun } from "./kart";

/**
 * Katalog filtreleri (VITRIN.md §4.3). Tanım sunucuda kurulur (seçenekler ve
 * sayılar kartlardan türer), istemci `Catalog` URL'deki seçimi uygular.
 */
export type FilterOption = { value: string; label: string; count: number };
export type FilterDef = { id: string; label: string; options: FilterOption[] };

export type SortKey = "onerilen" | "fiyat" | "ad";

function values(v: KartUrun["facets"][string] | undefined): string[] {
  if (v === undefined || v === null || v === "") return [];
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "boolean") return v ? ["1"] : [];
  return [String(v)];
}

/** Bir facet'in kartlarda görülen değerleri, sayılarıyla. */
export function facetOptions(
  items: KartUrun[],
  facet: string,
  labelOf: (value: string) => string = (v) => v,
  order?: string[],
): FilterOption[] {
  const counts = new Map<string, number>();
  for (const it of items) for (const v of values(it.facets[facet])) counts.set(v, (counts.get(v) ?? 0) + 1);
  const list = [...counts.entries()].map(([value, count]) => ({ value, label: labelOf(value), count }));
  if (order) list.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
  else list.sort((a, b) => a.label.localeCompare(b.label, "tr"));
  return list;
}

/** Yalnız iki ya da daha çok seçeneği olan filtreler anlamlıdır. */
export function usefulFilters(defs: FilterDef[]): FilterDef[] {
  return defs.filter((d) => d.options.length >= 2);
}

export function matches(item: KartUrun, selected: Record<string, string[]>): boolean {
  for (const [facet, wanted] of Object.entries(selected)) {
    if (!wanted.length) continue;
    const have = values(item.facets[facet]);
    if (!wanted.some((w) => have.includes(w))) return false;
  }
  return true;
}

export function sortItems(items: KartUrun[], key: SortKey): KartUrun[] {
  const list = [...items];
  if (key === "fiyat") list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  if (key === "ad") list.sort((a, b) => a.title.localeCompare(b.title, "tr"));
  return list;
}

/** URL'den seçim: `?kategori=a,b&iptal=1`. */
export function readSelection(params: URLSearchParams, defs: FilterDef[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const d of defs) {
    const raw = params.get(d.id);
    if (raw) out[d.id] = raw.split(",").filter(Boolean);
  }
  return out;
}

export function readSort(params: URLSearchParams): SortKey {
  const v = params.get("sirala");
  return v === "fiyat" || v === "ad" ? v : "onerilen";
}

/** Metin araması: başlık ve alt başlıkta, Türkçe küçük harf. */
export function textMatch(item: KartUrun, needle: string): boolean {
  const n = needle.trim().toLocaleLowerCase("tr");
  if (!n) return true;
  return `${item.title} ${item.subtitle}`.toLocaleLowerCase("tr").includes(n);
}
