"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import type { BusinessType } from "@/content/site";
import { ApplicationForm } from "./ApplicationForm";

type Ctx = { open: (type?: BusinessType) => void };
const ApplicationContext = createContext<Ctx | null>(null);

export function useApplication() {
  const ctx = useContext(ApplicationContext);
  if (!ctx) throw new Error("useApplication must be used inside <ApplicationProvider>");
  return ctx;
}

export function ApplicationProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [preset, setPreset] = useState<BusinessType | undefined>();
  // Her açılışta formu sıfırlamak için anahtar
  const [session, setSession] = useState(0);

  const open = useCallback((type?: BusinessType) => {
    setPreset(type);
    setSession((s) => s + 1);
    ref.current?.showModal();
  }, []);

  const close = useCallback(() => ref.current?.close(), []);

  return (
    <ApplicationContext.Provider value={{ open }}>
      {children}
      <dialog
        ref={ref}
        aria-labelledby="basvuru-baslik"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-2xl overflow-y-auto rounded-3xl bg-white p-0 text-ink shadow-[var(--shadow-photo)] backdrop:bg-transparent sm:max-h-[calc(100dvh-4rem)]"
      >
        <div className="relative p-6 sm:p-9">
          <button
            type="button"
            onClick={close}
            aria-label="Formu kapat"
            className="absolute top-4 right-4 grid size-10 place-items-center rounded-full text-ink-3 transition hover:bg-mist hover:text-ink"
          >
            <X className="size-5" />
          </button>
          <ApplicationForm key={session} preset={preset} onDone={close} />
        </div>
      </dialog>
    </ApplicationContext.Provider>
  );
}
