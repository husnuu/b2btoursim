"use client";

import { useState } from "react";
import { selectFxSource } from "@/lib/admin/actions";
import type { FxSourceRow } from "@/lib/admin/load";
import { formatDate, t } from "@/lib/i18n";
import { useToast } from "@/components/primitives/Toast";

/** Kur kaynağı seçimi: tek seçim, sunucuda yazılır. */
export function FxSourcePicker({ sources }: { sources: FxSourceRow[] }) {
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  return (
    <fieldset className="mt-3 flex flex-col gap-2">
      <legend className="sr-only">{t("admin.currencies.source")}</legend>
      {sources.map((f) => (
        <label key={f.id} className="flex items-center gap-3">
          <input
            type="radio"
            name="fx"
            checked={f.isSelected}
            disabled={busy}
            onChange={async () => {
              setBusy(true);
              const res = await selectFxSource(f.id);
              setBusy(false);
              if (!res.ok) notify(`Seçilemedi (${res.error}).`);
            }}
            className="h-4 w-4 accent-[var(--action-primary)]"
          />
          <span className="flex-1 text-[length:var(--font-ui)] text-ink">{f.name}</span>
          <span className="tnum text-[length:var(--font-ui-sm)] text-ink-3">{f.updatedAt ? formatDate(f.updatedAt) : "—"}</span>
        </label>
      ))}
    </fieldset>
  );
}
