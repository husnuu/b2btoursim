"use client";

import { useActionState } from "react";
import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { inviteUser, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/primitives/Button";

const ROLES: { value: string; label: MessageKey }[] = [
  { value: "sales", label: "role.sales" },
  { value: "accounting", label: "role.accounting" },
  { value: "agency_admin", label: "role.agency_admin" },
];

const input =
  "h-9 rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 " +
  "text-[length:var(--font-ui)] text-ink outline-none placeholder:text-ink-3 focus:border-action";

/** Davet formu — acente yöneticisi ekibini buradan ekler; açık kayıt yok. */
export function InviteUserForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(inviteUser, {});

  return (
    <form
      action={action}
      noValidate
      className="grid gap-3 rounded-[var(--radius)] border border-line bg-surface p-4 sm:grid-cols-[1fr_1fr_11rem_auto] sm:items-end"
    >
      <label className="flex flex-col gap-1">
        <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("users.invite.fullName")}</span>
        <input name="fullName" required autoComplete="off" className={input} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("users.col.email")}</span>
        <input name="email" type="email" required autoComplete="off" className={input} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[length:var(--font-ui-sm)] text-ink-2">{t("users.col.role")}</span>
        <select name="role" defaultValue="sales" className={input}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {t(r.label)}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? t("users.invite.sending") : t("users.invite.submit")}
      </Button>

      <p
        role="status"
        aria-live="polite"
        className={`sm:col-span-4 text-[length:var(--font-ui-sm)] ${
          state.error ? "text-danger" : "text-success"
        } ${state.error || state.ok ? "" : "sr-only"}`}
      >
        {state.error
          ? `✕ ${t(state.error)}`
          : state.ok
            ? `✓ ${t("users.invite.sent", { email: state.value ?? "" })}`
            : ""}
      </p>
    </form>
  );
}
