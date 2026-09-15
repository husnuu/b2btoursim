"use client";

import { useState } from "react";
import { setSupplierStatus } from "@/lib/admin/actions";
import { t } from "@/lib/i18n";
import { Button } from "@/components/primitives/Button";
import { useToast } from "@/components/primitives/Toast";

export function SupplierStatusButton({ id, status }: { id: string; status: "sandbox" | "active" | "degraded" | "disabled" }) {
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await setSupplierStatus(id, status === "disabled" ? "active" : "disabled");
        setBusy(false);
        notify(res.ok ? "Güncellendi." : `Güncellenemedi (${res.error}).`);
      }}
    >
      {status === "disabled" ? t("admin.tenant.activate") : t("admin.tenant.suspend")}
    </Button>
  );
}
