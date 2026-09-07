"use client";

import { useState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { Button } from "@/components/primitives/Button";
import { AuthShell, Field } from "./AuthShell";

/** Şifre sıfırlama — Sitemap Bölüm 2 (MVP). POST /auth/password-reset. */
export function ResetForm() {
  const [sent, setSent] = useState<string | null>(null);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSent(String(data.get("email") ?? ""));
  };

  if (sent) {
    return (
      <AuthShell
        title={t("auth.resetSentTitle")}
        lead={t("auth.resetSentBody", { email: sent })}
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
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field
          label={t("auth.email")}
          type="email"
          name="email"
          autoComplete="email"
          required
        />
        <Button type="submit" variant="primary" size="lg">
          {t("auth.resetSubmit")}
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
