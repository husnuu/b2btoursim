"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { t } from "@/lib/i18n";

/**
 * Bölüm 3.3: onay diyaloğu yerine geri alma.
 *
 * Geri alınabilir işlemler modal sormaz — işlem yapılır, burada "geri al"
 * sunulur. Modal yalnızca gerçekten geri alınamaz işlemlerde çıkar
 * (bkz. booking-status.needsConfirmation).
 */

type Toast = { id: number; message: string; onUndo?: () => void };

const Ctx = createContext<{
  notify: (message: string, onUndo?: () => void) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const notify = useCallback((message: string, onUndo?: () => void) => {
    const id = ++seq.current;
    setToasts((prev) => [...prev, { id, message, onUndo }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <ToastRow key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastRow({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 7000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className="pointer-events-auto flex items-center gap-4 rounded-[var(--radius)] border
                 border-ink/20 bg-inverse py-2 pe-2 ps-3.5 text-ink-inverse shadow-[var(--shadow-raised)]"
    >
      <p className="text-[length:var(--font-ui)]">{toast.message}</p>
      {toast.onUndo && (
        <button
          type="button"
          onClick={() => {
            toast.onUndo?.();
            onDismiss(toast.id);
          }}
          className="rounded-[2px] border border-ink-inverse/35 px-2 py-0.5
                     text-[length:var(--font-ui-sm)] font-medium
                     hover:bg-ink-inverse hover:text-ink"
        >
          {t("cart.undo")}
        </button>
      )}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label={t("common.close")}
        className="px-1 text-ink-inverse/60 hover:text-ink-inverse"
      >
        ✕
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast, ToastProvider içinde çağrılmalı");
  return ctx;
}
