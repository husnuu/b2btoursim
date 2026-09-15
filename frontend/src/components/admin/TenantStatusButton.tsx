"use client";

import { useState } from "react";
import { setTenantStatus } from "@/lib/admin/actions";
import { t } from "@/lib/i18n";
import { Button } from "@/components/primitives/Button";
import { useToast } from "@/components/primitives/Toast";

export function TenantStatusButton({ id, status }: { id: string; status: "trial" | "active" | "suspended" | "closed" }) {
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  const next = status === "active" ? "suspended" : "active";
  return (
    <Button
      variant={status === "active" ? "danger" : "primary"}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await setTenantStatus(id, next);
        setBusy(false);
        notify(res.ok ? "Güncellendi." : `Güncellenemedi (${res.error}).`);
      }}
    >
      {status === "active" ? t("admin.tenant.suspend") : t("admin.tenant.activate")}
    </Button>
  );
}
