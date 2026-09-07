"use client";

import { useEffect } from "react";
import { report } from "@/lib/report";
import { t } from "@/lib/i18n";
import { Button } from "@/components/primitives/Button";

/**
 * Segment hata sınırı.
 *
 * Yazı dili kuralı (Bölüm 6.3): hata özür dilemez, ne olduğunu ve ne
 * yapılacağını söyler. `digest` sunucu log'undaki kaydın kimliği — destek
 * hattı bu numarayla kaydı bulabilsin diye ekranda gösteriliyor.
 */
export default function Error({
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
    <div className="mx-auto flex max-w-md flex-col items-start gap-2 px-[var(--pad-x)] py-16">
      <span
        aria-hidden="true"
        className="mb-2 inline-block h-6 w-6 rounded-[2px] border-2 border-danger"
      />
      <h1 className="text-lg font-medium text-ink">{t("error.generic.title")}</h1>
      <p className="max-w-[52ch] text-ink-2">{t("error.generic.body")}</p>
      {error.digest && (
        <p className="tnum mt-1 text-[length:var(--font-ui-sm)] text-ink-3">
          {t("error.reference", { code: error.digest })}
        </p>
      )}
      <Button className="mt-3" variant="primary" onClick={() => retry()}>
        {t("error.retry")}
      </Button>
    </div>
  );
}
