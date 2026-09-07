"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import { Button } from "@/components/primitives/Button";
import { AuthShell, Field } from "./AuthShell";

/**
 * Giriş — Sitemap Bölüm 2, Kimlik Doğrulama (MVP).
 *
 * Gerçek kimlik doğrulama yok: POST /auth/login bağlanana kadar form
 * doğrudan Extranet'e geçiyor. Bu prototip sınırı ekranda yazılı, çünkü
 * "giriş yapıldı" izlenimi vermek yanlış olur.
 */
export function SignInForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => router.push("/extranet"), 500);
  };

  return (
    <AuthShell
      title={t("auth.signInTitle")}
      lead={t("auth.signInLead")}
      footer={
        <p className="rounded-[var(--radius)] border border-line bg-sunken px-3 py-2 text-[length:var(--font-ui-sm)] text-ink-2">
          {t("auth.demoHint")}
        </p>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field
          label={t("auth.email")}
          type="email"
          name="email"
          autoComplete="email"
          required
          defaultValue="deniz.acar@anadoluseyahat.example"
        />
        <Field
          label={t("auth.password")}
          type="password"
          name="password"
          autoComplete="current-password"
          required
          defaultValue="prototip"
        />

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

        <Button type="submit" variant="primary" size="lg" disabled={busy}>
          {busy ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
      </form>
    </AuthShell>
  );
}
