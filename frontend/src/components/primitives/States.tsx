import type { ReactNode } from "react";
import { Button } from "./Button";

/**
 * Boş ekran bir davettir, bilgilendirme değil (Bölüm 6.3).
 * Hata özür dilemez; ne olduğunu ve ne yapılacağını söyler.
 */

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-2 px-[var(--pad-x)] py-14">
      {/* Boş listeyi anlatan tek görsel işaret: çizilmemiş satırlar. */}
      <div aria-hidden="true" className="mb-3 flex w-28 flex-col gap-1.5">
        <span className="h-px w-full bg-line-strong" />
        <span className="h-px w-full bg-line" />
        <span className="h-px w-2/3 bg-line" />
      </div>
      <h2 className="text-lg font-medium text-ink">{title}</h2>
      <p className="max-w-[52ch] text-ink-2">{body}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  body,
  retryLabel,
  onRetry,
}: {
  title: string;
  body: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-start gap-2 px-[var(--pad-x)] py-14"
    >
      <span
        aria-hidden="true"
        className="mb-2 inline-block h-6 w-6 rounded-[2px] border-2 border-danger"
      />
      <h2 className="text-lg font-medium text-ink">{title}</h2>
      <p className="max-w-[52ch] text-ink-2">{body}</p>
      <Button className="mt-3" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}
