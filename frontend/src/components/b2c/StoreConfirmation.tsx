"use client";

import { useMemo } from "react";
import { formatMoney, formatShortDate, formatTime, t } from "@/lib/i18n";
import type { CartLine } from "@/lib/types";
import { salePrice } from "@/lib/types";
import { useSessionValue } from "@/lib/session-store";
import { Button, ButtonLink } from "@/components/primitives/Button";
import { StatusBadge } from "@/components/primitives/StatusBadge";
import { EmptyState } from "@/components/primitives/States";

type Order = {
  ref: string;
  form: { name: string; email: string; phone: string };
  lines: CartLine[];
  total: number;
};

const RETAIL_MARGIN = 22;

export function StoreConfirmation({ orderRef }: { orderRef: string }) {
  const raw = useSessionValue(`kontuar.storeorder.${orderRef}`);
  const order = useMemo<Order | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Order;
    } catch {
      return null;
    }
  }, [raw]);

  if (!order) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <EmptyState
          title={t("error.generic.title")}
          body={t("error.generic.body")}
          action={
            <ButtonLink href="/magaza" variant="primary">
              {t("b2c.backHome")}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="flex items-center gap-3">
        <StatusBadge status="confirmed" />
        <h1 className="font-dense text-[clamp(1.8rem,3.4vw,2.4rem)] font-semibold tracking-tight text-ink">
          {t("b2c.confirmTitle")}
        </h1>
      </div>
      <p className="mt-3 max-w-[60ch] text-ink-2">
        {t("b2c.confirmBody", { email: order.form.email })}
      </p>

      <div className="mt-6 flex items-baseline gap-3 rounded-[var(--radius-lg)] border border-line-strong bg-surface px-5 py-4">
        <span className="text-[length:var(--font-ui-sm)] text-ink-2">
          {t("b2c.confirmRef")}
        </span>
        <span className="tnum font-dense text-xl font-semibold text-ink">
          {order.ref}
        </span>
      </div>

      <ul className="mt-8 border-t border-line">
        {order.lines.map((l) => {
          const pax = l.pax.adults + l.pax.children;
          return (
            <li
              key={l.id}
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line py-4"
            >
              <div className="min-w-0">
                <p className="text-[length:calc(var(--font-ui)*1.1)] text-ink">{l.title}</p>
                <p className="tnum mt-1 text-[length:var(--font-ui-sm)] text-ink-2">
                  {l.optionName} · {formatShortDate(l.startsAt)} {formatTime(l.startsAt)}
                </p>
              </div>
              <p className="tnum text-[length:calc(var(--font-ui)*1.1)] font-medium text-ink">
                {formatMoney(salePrice(l.net, RETAIL_MARGIN) * pax)}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-ink-2">{t("common.total")}</span>
        <span className="tnum text-2xl font-semibold text-ink">
          {formatMoney(order.total)}
        </span>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={() => window.print()}>{t("voucher.download")}</Button>
        <ButtonLink href="/magaza" variant="primary">
          {t("b2c.backHome")}
        </ButtonLink>
      </div>
    </div>
  );
}
