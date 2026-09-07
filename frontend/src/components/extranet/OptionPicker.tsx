"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatTime, t } from "@/lib/i18n";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { useToast } from "@/components/primitives/Toast";
import { PriceTriad } from "@/components/primitives/PriceTriad";
import { Button } from "@/components/primitives/Button";

/**
 * Ürün detayda seçenek tablosu. Sonuç listesiyle aynı fiyat üçlüsünü
 * kullanır: acente marjı burada da satır üzerinde değiştirebilir ve
 * sepete o marjla ekler.
 */
export function OptionPicker({ product }: { product: Product }) {
  const router = useRouter();
  const cart = useCart();
  const { notify } = useToast();
  const [margins, setMargins] = useState<Record<string, number>>({});
  const [pax] = useState({ adults: 2, children: 0 });
  const seq = useRef(0);

  const add = (optionId: string) => {
    const option = product.variants.find((v) => v.id === optionId)!;
    const marginPct = margins[optionId] ?? 20;
    const line = {
      id: `${product.id}-${optionId}-${++seq.current}`,
      productId: product.id,
      variantId: option.id,
      title: product.title,
      supplier: product.supplier,
      optionName: option.name,
      startsAt: option.startsAt,
      pax,
      net: option.basePrice,
      marginPct,
    };
    cart.add(line);
    // Geri alınabilir işlem: onay sormaz, geri alma sunar.
    notify(t("cart.added", { product: option.name }), () => cart.remove(line.id));
    router.push("/extranet/sepet");
  };

  return (
    <table className="w-full border-collapse font-dense">
      <colgroup>
        <col />
        <col className="w-20" />
        <col className="w-28" />
        <col className="w-[19rem]" />
        <col className="w-32" />
      </colgroup>
      <thead>
        <tr className="border-b border-line-strong text-[length:var(--font-ui-xs)] text-ink-3">
          <th scope="col" className="py-1.5 text-start font-normal">
            {t("product.optionCol.name")}
          </th>
          <th scope="col" className="px-2 py-1.5 text-start font-normal">
            {t("product.optionCol.time")}
          </th>
          <th scope="col" className="px-2 py-1.5 text-start font-normal">
            {t("product.optionCol.availability")}
          </th>
          <th scope="col" className="py-1.5 pe-2 text-end font-normal">
            <div className="flex items-baseline justify-end gap-3">
              <span className="w-[6.5rem] text-end">{t("results.col.net")}</span>
              <span className="w-[3.75rem] text-end">{t("results.col.margin")}</span>
              <span className="w-[7rem] text-end">{t("results.col.sale")}</span>
            </div>
          </th>
          <th scope="col" className="p-0" />
        </tr>
      </thead>
      <tbody>
        {product.variants.map((o) => (
          <tr key={o.id} className="h-11 border-b border-line hover:bg-action-tint">
            <td className="pe-3 text-[length:var(--font-ui)] text-ink">{o.name}</td>
            <td className="tnum px-2 text-[length:var(--font-ui)] text-ink-2">
              {formatTime(o.startsAt)}
            </td>
            <td className="tnum px-2 text-[length:var(--font-ui-sm)] text-ink-2">
              {t("product.remaining", { count: o.quantityAvailable })}
            </td>
            <td className="pe-2">
              <PriceTriad
                net={o.basePrice}
                marginPct={margins[o.id] ?? 20}
                onMarginChange={(pct) =>
                  setMargins((prev) => ({ ...prev, [o.id]: pct }))
                }
              />
            </td>
            <td className="ps-3 text-end">
              <Button size="sm" variant="secondary" onClick={() => add(o.id)}>
                {t("product.addToCart")}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
