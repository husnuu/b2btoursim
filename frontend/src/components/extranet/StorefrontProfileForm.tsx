"use client";

import { useActionState } from "react";
import { t } from "@/lib/i18n";
import { saveStorefrontProfile, type ProfileActionState } from "@/lib/storefront/profile-actions";
import { BRAND_PALETTE } from "@/lib/theme";
import { Button } from "@/components/primitives/Button";

const input =
  "h-9 rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 " +
  "text-[length:var(--font-ui)] text-ink outline-none placeholder:text-ink-3 focus:border-action";

export type StorefrontProfileValues = {
  about: string;
  contactEmail: string;
  contactPhone: string;
  phoneHours: string;
  address: string;
  tursabNo: string;
  brandId: string;
};

/** Vitrinde görünen bilgiler — acente yöneticisi düzenler. */
export function StorefrontProfileForm({
  initial,
  siteUrl,
}: {
  initial: StorefrontProfileValues;
  siteUrl: string;
}) {
  const [state, action, pending] = useActionState<ProfileActionState, FormData>(
    saveStorefrontProfile,
    {},
  );

  return (
    <form action={action} className="rounded-[var(--radius)] border border-line bg-surface p-4">
      <p className="text-[length:var(--font-ui-sm)] text-ink-2">
        {t("storefront.lead")}{" "}
        <a href={siteUrl} target="_blank" rel="noreferrer" className="text-ink underline decoration-line-strong underline-offset-2">
          {siteUrl}
        </a>
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("storefront.about")}</span>
          <textarea
            name="about"
            rows={3}
            defaultValue={initial.about}
            className="rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 py-2 text-[length:var(--font-ui)] text-ink outline-none focus:border-action"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("storefront.contactEmail")}</span>
          <input name="contactEmail" type="email" defaultValue={initial.contactEmail} className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("storefront.contactPhone")}</span>
          <input name="contactPhone" type="tel" defaultValue={initial.contactPhone} className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("storefront.phoneHours")}</span>
          <input name="phoneHours" defaultValue={initial.phoneHours} placeholder="Hafta içi 09.00 – 18.00" className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("storefront.tursabNo")}</span>
          <input name="tursabNo" defaultValue={initial.tursabNo} className={input} />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("storefront.address")}</span>
          <input name="address" defaultValue={initial.address} className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("storefront.brand")}</span>
          <select name="brand" defaultValue={initial.brandId} className={input}>
            {BRAND_PALETTE.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? t("storefront.saving") : t("storefront.save")}
        </Button>
        <p
          role="status"
          aria-live="polite"
          className={`text-[length:var(--font-ui-sm)] ${state.error ? "text-danger" : "text-success"} ${
            state.error || state.ok ? "" : "sr-only"
          }`}
        >
          {state.error ? `✕ ${t(state.error)}` : state.ok ? `✓ ${t("storefront.saved")}` : ""}
        </p>
      </div>
    </form>
  );
}
