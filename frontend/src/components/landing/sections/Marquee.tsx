import { marqueeItems } from "@/content/site";
import { Spark } from "@/components/landing/ui/Glyphs";

/** Ürün kategorilerinin sonsuz kayan şeridi. */
export function Marquee() {
  const row = [...marqueeItems, ...marqueeItems];
  return (
    <div className="marquee-wrap relative overflow-hidden bg-ink py-6 text-white" aria-label="Ürün kategorileri">
      <ul className="marquee flex w-max items-center">
        {row.map((item, i) => (
          <li key={i} aria-hidden={i >= marqueeItems.length} className="flex items-center gap-8 pr-8">
            <span className="font-display text-[1.7rem] whitespace-nowrap sm:text-4xl">{item}</span>
            <Spark className="size-5 text-pop" />
          </li>
        ))}
      </ul>
    </div>
  );
}
