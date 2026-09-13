"use client";

import { useActionState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { signIn, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/primitives/Button";
import { AuthShell, Field, FormError } from "./AuthShell";

/**
 * Giriş — Sitemap Bölüm 2, Kimlik Doğrulama (MVP).
 *
 * Form bir Server Action'a gider; şifre tarayıcıdan sunucuya bir kez
 * geçer, istemcide tutulmaz. Hata metni bir i18n anahtarıdır.
 */
export function SignInForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(signIn, {});
  const error: MessageKey | undefined = state.error ?? (linkError ? "auth.error.link" : undefined);

  return (
    <AuthShell title={t("auth.signInTitle")} lead={t("auth.signInLead")}>
      <form action={action} className="flex flex-col gap-4" noValidate>
        {next && <input type="hidden" name="next" value={next} />}
        <Field label={t("auth.email")} type="email" name="email" autoComplete="email" required />
        <Field
          label={t("auth.password")}
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />

        <FormError message={error ? t(error) : null} />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[length:var(--font-ui-sm)] text-ink-2">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="h-4 w-4 rounded-[2px] border-line-strong accent-[var(--action-primary)]"
            />
            {t("auth.remember")}
          </label>
          <Link
            href="/sifre-sifirlama"
            className="text-[length:var(--font-ui-sm)] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
          >
            {t("auth.forgot")}
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          {pending ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
      </form>
    </AuthShell>
  );
}
