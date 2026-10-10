"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, t } from "@/lib/i18n";
import { salePrice } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { notifySessionChange, writeSession } from "@/lib/session-store";
import type { MessageKey } from "@/lib/i18n";
import { toplam } from "@/lib/storefront/kalemler";
import { placeStorefrontOrder } from "@/lib/storefront/order";
import { Button, ButtonLink } from "@/components/primitives/Button";
import { EmptyState } from "@/components/primitives/States";
import { OzetKarti } from "./OzetKarti";

/**
 * Ödeme adımı (VITRIN.md §4.8): iki adımlı gösterge (Bilgiler → Onay), misafir
 * olarak devam, sağda yapışkan özet. Üçüncü adım yok: platform ödeme almaz.
 *
 * `mode = "order"`: kiracı vitrini — sipariş sunucuya yazılır, tutar sunucuda
 * hesaplanır. `mode = "demo"`: örnek vitrin, sahte kart alanları (kart verisi
 * bizim sisteme hiç girmez; gerçek entegrasyonda sağlayıcının iframe alanları).
 *
 * Doğrulama gönderimde; bir kez hata veren alan düzeltilirken anında yeniden
 * denetlenir. Hata metni label dışında, `aria-describedby` ile bağlı.
 */
export function StoreCheckout({ mode }: { mode: "order" | "demo" }) {
  const router = useRouter();
  const { lines, clear } = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [orderError, setOrderError] = useState<MessageKey | null>(null);

  if (lines.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <EmptyState
          title={t("b2c.cartEmpty")}
          body={t("b2c.cartEmptyBody")}
          action={
            <ButtonLink href="/magaza/tur-arama" variant="primary" size="lg">
              {t("b2c.browse")}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const rows = lines.map((l) => {
    const pax = l.pax.adults + l.pax.children;
    return { line: l, pax, tutar: toplam({ kind: "tur", birimFiyat: salePrice(l.net, l.marginPct), kisi: pax }) ?? 0 };
  });
  const retailTotal = rows.reduce((s, r) => s + r.tutar, 0);

  const validate = (f: typeof form): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!f.name.trim()) next.name = t("checkout.required");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) next.email = t("checkout.invalidEmail");
    return next;
  };
  const set = (patch: Partial<typeof form>) =>
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (Object.keys(errors).length) {
        const fresh = validate(next);
        setErrors((cur) => Object.fromEntries(Object.keys(cur).map((k) => [k, fresh[k]]).filter(([, msg]) => !!msg)));
      }
      return next;
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setOrderError(null);

    if (mode === "order") {
      const result = await placeStorefrontOrder({
        customer: { fullName: form.name, email: form.email, phone: form.phone },
        lines: lines.map((l) => ({
          slug: l.productId,
          // "-standart" seçeneği kalkış değil; gerçek kalkış kimliği uuid'dir.
          departureId: l.variantId.endsWith("-standart") ? null : l.variantId,
          adults: l.pax.adults,
          children: l.pax.children,
        })),
      });
      if (!result.ok) {
        setBusy(false);
        const key = `b2c.orderError.${result.error}` as MessageKey;
        setOrderError(result.error === "SOLD_OUT" || result.error === "TOUR_NOT_FOUND" ? key : "b2c.orderError.generic");
        return;
      }
      clear();
      router.push(`/magaza/onay/${result.ref}`);
      return;
    }

    const ref = `KNT-B${String(lines.length * 137 + 400).padStart(4, "0")}`;
    writeSession(`kontuar.storeorder.${ref}`, JSON.stringify({ ref, form, lines, total: retailTotal }));
    notifySessionChange();
    setTimeout(() => {
      clear();
      router.push(`/magaza/onay/${ref}`);
    }, 900);
  };

  return (
    <form onSubmit={submit} noValidate className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <Steps current={0} />
        <h1 className="mt-4 font-dense text-[clamp(1.8rem,3.8vw,2.7rem)] font-bold tracking-tight text-ink">{t("b2c.checkoutTitle")}</h1>

        <fieldset className="mt-6">
          <legend className="font-dense text-[21px] font-bold text-ink">{t("b2c.contact")}</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Text label={t("checkout.leadName")} value={form.name} error={errors.name} autoComplete="name" onChange={(v) => set({ name: v })} className="sm:col-span-2" />
            <Text label={t("checkout.leadEmail")} type="email" autoComplete="email" value={form.email} error={errors.email} onChange={(v) => set({ email: v })} />
            <Text label={t("checkout.leadPhone")} type="tel" autoComplete="tel" value={form.phone} onChange={(v) => set({ phone: v })} />
          </div>
        </fieldset>

        {mode === "order" ? (
          <p className="mt-8 rounded-[var(--radius)] border border-line bg-sunken px-4 py-3 text-[length:var(--font-ui)] text-ink-2">{t("b2c.orderNote")}</p>
        ) : (
          <fieldset className="mt-8">
            <legend className="font-dense text-[21px] font-bold text-ink">{t("b2c.payment")}</legend>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <Text label={t("b2c.cardNumber")} value="" onChange={() => {}} className="sm:col-span-3" placeholder="•••• •••• •••• ••••" />
              <Text label={t("b2c.cardHolder")} value="" onChange={() => {}} />
              <Text label={t("b2c.cardExpiry")} value="" onChange={() => {}} placeholder="AA/YY" />
              <Text label={t("b2c.cardCvc")} value="" onChange={() => {}} placeholder="•••" />
            </div>
            <p className="mt-3 text-[length:var(--font-ui-sm)] text-ink-2">{t("b2c.secureNote")}</p>
          </fieldset>
        )}
      </div>

      <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
        <OzetKarti satirlar={rows.map(({ line, pax, tutar }) => ({ id: line.id, title: line.title, sub: `${pax} ${t("b2c.unit.perPerson")}`, tutar }))} toplamTutar={retailTotal}>
          {orderError && (
            <p role="alert" className="mt-3 text-[length:var(--font-ui-sm)] text-danger">
              ✕ {t(orderError)}
            </p>
          )}
          <Button type="submit" variant="primary" size="lg" className="mt-4 w-full font-dense font-semibold" disabled={busy}>
            {mode === "order" ? (busy ? t("b2c.placingOrder") : t("b2c.placeOrder")) : busy ? t("b2c.paying") : t("b2c.payNow", { amount: formatMoney(retailTotal) })}
          </Button>
        </OzetKarti>
      </aside>
    </form>
  );
}

/** Adım göstergesi: Bilgiler → Onay. Renk tek başına anlam taşımaz; numara ve metin var. */
function Steps({ current }: { current: 0 | 1 }) {
  const steps = [t("b2c.steps.info"), t("b2c.steps.confirm")];
  return (
    <nav aria-label={t("b2c.steps")}>
      <ol className="flex items-center gap-3 text-[length:var(--font-ui-sm)]">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-3">
            <span className={`flex items-center gap-2 ${i === current ? "text-ink" : "text-ink-3"}`} aria-current={i === current ? "step" : undefined}>
              <span className={`tnum grid h-6 w-6 place-items-center rounded-full font-dense text-[12.5px] font-bold ${i === current ? "bg-action text-on-action" : "border border-line-strong"}`}>{i + 1}</span>
              {s}
            </span>
            {i < steps.length - 1 && <span aria-hidden="true" className="h-px w-8 bg-line-strong" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Etiket + girdi + hata; hata `<label>` dışında, `aria-describedby` ile bağlı. */
function Text({
  label,
  value,
  onChange,
  type = "text",
  error,
  className = "",
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  className?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[length:var(--font-ui-sm)] text-ink-2">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`h-11 rounded-[var(--radius)] border bg-surface px-3 text-[length:var(--font-ui)] text-ink outline-none placeholder:text-ink-3 ${
          error ? "border-danger" : "border-line-strong focus:border-action"
        }`}
      />
      {error && <p id={errId} className="text-[length:var(--font-ui-sm)] text-danger">{error}</p>}
    </div>
  );
}
