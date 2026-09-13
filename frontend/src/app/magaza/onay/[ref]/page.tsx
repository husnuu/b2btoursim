import { notFound } from "next/navigation";
import { formatMoney, formatShortDate, formatTime, t } from "@/lib/i18n";
import { getStorefrontOrder } from "@/lib/storefront/order-read";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { StoreConfirmation } from "@/components/b2c/StoreConfirmation";
import { ButtonLink } from "@/components/primitives/Button";
import { StatusBadge } from "@/components/primitives/StatusBadge";

/** Rezervasyon onay sayfası — Sitemap Bölüm 3 (MVP). */
export default async function OnayPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const tenant = await getStorefrontTenant();
  if (!tenant) return <StoreConfirmation orderRef={ref} />;

  const order = await getStorefrontOrder(tenant.id, ref);
  if (!order) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="flex items-center gap-3">
        <StatusBadge status="pending" />
        <h1 className="font-dense text-[clamp(1.8rem,3.4vw,2.4rem)] font-semibold tracking-tight text-ink">
          {t("b2c.orderTitle")}
        </h1>
      </div>
      <p className="mt-3 max-w-[60ch] text-ink-2">
        {t("b2c.orderBody", {
          name: order.customer.fullName.split(" ")[0],
          email: order.customer.email ?? "",
        })}
      </p>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2 rounded-[var(--radius-lg)] border border-line-strong bg-surface px-5 py-4">
        <span className="flex items-baseline gap-3">
          <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("b2c.confirmRef")}</span>
          <span className="tnum font-dense text-xl font-semibold text-ink">{order.ref}</span>
        </span>
        <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("b2c.orderStatusPending")}</span>
      </div>

      <ul className="mt-8 border-t border-line">
        {order.items.map((i, idx) => (
          <li
            key={idx}
            className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line py-4"
          >
            <div className="min-w-0">
              <p className="text-[length:calc(var(--font-ui)*1.1)] text-ink">{i.title}</p>
              <p className="tnum mt-1 text-[length:var(--font-ui-sm)] text-ink-2">
                {i.quantity} kişi
                {i.startsAt ? ` · ${formatShortDate(i.startsAt)} ${formatTime(i.startsAt)}` : ""}
              </p>
            </div>
            <p className="tnum text-[length:calc(var(--font-ui)*1.1)] font-medium text-ink">
              {formatMoney(i.unitPrice * i.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-ink-2">{t("common.total")}</span>
        <span className="tnum text-2xl font-semibold text-ink">{formatMoney(order.total)}</span>
      </div>

      <div className="mt-8">
        <ButtonLink href="/magaza" variant="primary">
          {t("b2c.backHome")}
        </ButtonLink>
      </div>
    </div>
  );
}
