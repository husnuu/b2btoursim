"use client";

import { useState, useTransition } from "react";
import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { updateUserRole } from "@/lib/auth/actions";
import type { UserRole } from "@/lib/types";

const OPTIONS: { value: UserRole; label: MessageKey }[] = [
  { value: "agency_admin", label: "role.agency_admin" },
  { value: "sales", label: "role.sales" },
  { value: "accounting", label: "role.accounting" },
];

/** Satır içi rol değişimi: onay sormaz, sonucu satırda gösterir. */
export function RoleSelect({
  userId,
  role,
  name,
  disabled,
}: {
  userId: string;
  role: UserRole;
  name: string;
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState<MessageKey | null>(null);

  return (
    <span className="flex items-center gap-2">
      <select
        defaultValue={role}
        disabled={disabled || pending}
        aria-label={`${name} ${t("users.col.role")}`}
        onChange={(e) => {
          const next = e.target.value as UserRole;
          start(async () => {
            const res = await updateUserRole(userId, next);
            setNote(res.error ?? "users.roleSaved");
          });
        }}
        className="h-7 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-1.5
                   text-[length:var(--font-ui-sm)] text-ink outline-none focus:border-action disabled:opacity-60"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {t(o.label)}
          </option>
        ))}
      </select>
      {note && (
        <span className="whitespace-nowrap text-[length:var(--font-ui-xs)] text-ink-3" role="status">
          {t(note)}
        </span>
      )}
    </span>
  );
}
