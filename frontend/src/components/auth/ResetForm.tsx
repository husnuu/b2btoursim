"use client";

import { useActionState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { requestPasswordReset, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/primitives/Button";
import { AuthShell, Field, FormError } from "./AuthShell";

/** Şifre sıfırlama — Sitemap Bölüm 2 (MVP). Var olmayan adres için de aynı ekran: hesap keşfi yok. */
export function ResetForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(requestPasswordReset, {});

  if (state.ok && state.value) {
    return (
      <AuthShell
        title={t("auth.resetSentTitle")}
        lead={t("auth.resetSentBody", { email: state.value })}
      >
        <Link
          href="/giris"
          className="text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
        >
          {t("auth.backToSignIn")}
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("auth.resetTitle")} lead={t("auth.resetLead")}>
      <form action={action} className="flex flex-col gap-4" noValidate>
        <Field label={t("auth.email")} type="email" name="email" autoComplete="email" required />
        <FormError message={state.error ? t(state.error) : null} />
        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          {pending ? t("auth.saving") : t("auth.resetSubmit")}
        </Button>
        <Link
          href="/giris"
          className="text-center text-[length:var(--font-ui-sm)] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
        >
          {t("auth.backToSignIn")}
        </Link>
      </form>
    </AuthShell>
  );
}
