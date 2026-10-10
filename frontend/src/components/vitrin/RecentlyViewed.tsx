"use client";

import { useEffect, useState } from "react";
import { useVitrin } from "./VitrinProvider";
import { Carousel } from "./Carousel";
import { ProductCard } from "./ProductCard";

const KEY = "seyyah-vitrin-son-bakilanlar";

const read = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
};

/** Ürün sayfası açıldığında listeye ekler (yalnızca bu tarayıcıda). */
export function TrackView({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify([slug, ...read().filter((s) => s !== slug)].slice(0, 8)));
    } catch {}
  }, [slug]);
  return null;
}

/** Ziyaretçi daha önce ürün açtıysa görünür; yoksa hiç render edilmez. */
export function RecentlyViewed({ exclude, title = "Son baktıklarınız" }: { exclude?: string; title?: string }) {
  const { products } = useVitrin();
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tarayıcı deposundan ilk okuma
    setSlugs(read().filter((s) => s !== exclude));
  }, [exclude]);
  const list = slugs.map((s) => products.find((p) => p.slug === s)).filter((p): p is NonNullable<typeof p> => !!p);
  if (!list.length) return null;
  return (
    <section aria-label={title} className="tab-in">
      <h2 className="mb-6 text-[1.6rem] font-extrabold tracking-tight sm:text-[2.2rem]">{title}</h2>
      <Carousel label={title}>{list.map((p) => <ProductCard key={p.slug} p={p} />)}</Carousel>
    </section>
  );
}
