"use client";

import { useActionState } from "react";
import { t } from "@/lib/i18n";
import { setPassword, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/primitives/Button";
import { AuthShell, Field, FormError } from "./AuthShell";

/**
 * Şifre belirleme — davet kabulü ve sıfırlama aynı ekrana iner.
 * Buraya gelen kullanıcının e-posta bağlantısıyla açılmış bir oturumu
 * vardır; proxy oturumsuzu girişe gönderir.
 */
export function SetPasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(setPassword, {});

  return (
    <AuthShell title={t("auth.setPasswordTitle")} lead={t("auth.setPasswordLead")}>
      <form action={action} className="flex flex-col gap-4" noValidate>
        <Field
          label={t("auth.newPassword")}
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={10}
        />
        <Field
          label={t("auth.confirmPassword")}
          type="password"
          name="confirm"
          autoComplete="new-password"
          required
          minLength={10}
        />
        <FormError message={state.error ? t(state.error) : null} />
        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          {pending ? t("auth.saving") : t("auth.setPasswordSubmit")}
        </Button>
      </form>
    </AuthShell>
  );
}
