"use client";

import { useEffect, useRef } from "react";
import { t } from "@/lib/i18n";
import { Button } from "./Button";

/**
 * Onay diyaloğu.
 *
 * Bölüm 3.3: bu bileşen yalnızca **geri alınamaz** işlemler için kullanılır.
 * Geri alınabilir her şey onay sormadan yapılır ve Toast üzerinden geri
 * alınır. Modal'ı her yere serpiştirmek operatörü yavaşlatır.
 *
 * Odak tuzağı native <dialog> ile geliyor; Esc kapatıyor.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  tone = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        // Dışına tıklama kapatır; kutunun içi tıklamayı yutar.
        if (e.target === ref.current) onCancel();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[var(--radius-lg)] border
                 border-line-strong bg-surface p-0 text-ink backdrop:bg-ink/40"
    >
      <div className="p-5">
        <h2 className="font-dense text-lg font-medium text-ink">{title}</h2>
        <p className="mt-2 text-ink-2">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
