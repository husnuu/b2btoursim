"use client";

import { useEffect } from "react";
import { report } from "@/lib/report";
import { t } from "@/lib/i18n";
import { Button, ButtonLink } from "@/components/primitives/Button";

/**
 * Extranet hata sınırı.
 *
 * Kabuk (ray, bakiye, sepet) ayakta kalır; yalnızca içerik alanı düşer.
 * Operatör telefonda müşteriyle konuşurken tüm uygulamayı kaybetmesin,
 * sepetini kaybetmediğini görebilsin diye.
 */
export default function ExtranetError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    report({ kind: "client-error", message: error.message, stack: error.stack });
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-2 px-[var(--pad-x)] py-16">
      <h1 className="text-lg font-medium text-ink">{t("error.generic.title")}</h1>
      <p className="max-w-[52ch] text-ink-2">{t("error.generic.body")}</p>
      {error.digest && (
        <p className="tnum mt-1 text-[length:var(--font-ui-sm)] text-ink-3">
          {t("error.reference", { code: error.digest })}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <Button variant="primary" onClick={() => retry()}>
          {t("error.retry")}
        </Button>
        <ButtonLink href="/extranet/sepet">{t("cart.title")}</ButtonLink>
      </div>
    </div>
  );
}
