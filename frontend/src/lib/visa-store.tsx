"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type {
  VisaApplication,
  VisaApplicationForm,
  VisaBooking,
  VisaDraft,
} from "./visa";
import { emptyApplicationForm, emptyVisaDraft } from "./visa";
import { notifyLocalChange, readLocal, useLocalValue, writeLocal } from "./local-store";

/**
 * Vize kataloğu — bkz. `local-store.ts`: bu modül bilinçli olarak diğer
 * modüllerden farklı şekilde **localStorage** kullanır (sessionStorage
 * değil), çünkü public başvuru linki başka bir sekmede açılıp gönderilir.
 */

const KEY = "kontuar.vize.v1";

type Store = {
  visas: VisaDraft[];
  bookings: VisaBooking[];
  forms: VisaApplicationForm[];
  applications: VisaApplication[];
};

type ArrayKey = "visas" | "bookings" | "forms" | "applications";

const SEED: Store = { visas: [], bookings: [], forms: [], applications: [] };

type VisaCatalogContext = {
  visas: VisaDraft[];
  bookings: VisaBooking[];
  forms: VisaApplicationForm[];
  applications: VisaApplication[];

  createVisa: () => VisaDraft;
  updateVisa: (id: string, patch: Partial<VisaDraft>) => void;
  setVisaStatus: (id: string, status: VisaDraft["status"]) => void;
  removeVisa: (id: string) => void;
  restoreVisa: (visa: VisaDraft, index: number) => void;
  duplicateVisa: (id: string) => VisaDraft | null;

  createBooking: (booking: Omit<VisaBooking, "id" | "createdAt">) => VisaBooking;
  setBookingOperationStatus: (id: string, status: VisaBooking["operationStatus"]) => void;

  createForm: () => VisaApplicationForm;
  updateForm: (id: string, patch: Partial<VisaApplicationForm>) => void;
  removeForm: (id: string) => void;
  getForm: (id: string) => VisaApplicationForm | undefined;

  /** Public sayfa (`/basvuru/[formId]`) tarafından çağrılır — bkz. plan. */
  submitApplication: (application: Omit<VisaApplication, "id">) => VisaApplication;
  setApplicationStatus: (id: string, status: VisaApplication["status"], notifyMessage?: string) => void;
  sendExtraDocRequest: (id: string) => void;
};

const Ctx = createContext<VisaCatalogContext | null>(null);

function parse(raw: string | null): Store {
  if (!raw) return SEED;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.visas) && Array.isArray(parsed.forms)) {
      return parsed as Store;
    }
    return SEED;
  } catch {
    return SEED;
  }
}

function readRaw(): string | null {
  return readLocal(KEY);
}

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}${seq}`;
}

export function VisaCatalogProvider({ children }: { children: React.ReactNode }) {
  const raw = useLocalValue(KEY);
  const store = useMemo(() => parse(raw), [raw]);

  const commit = useCallback((next: Store) => {
    writeLocal(KEY, JSON.stringify(next));
    notifyLocalChange();
  }, []);

  const updateLibraryEntry = useCallback(
    <K extends ArrayKey>(key: K, id: string, patch: Partial<Store[K][number]>) => {
      const current = parse(readRaw());
      commit({ ...current, [key]: current[key].map((item) => (item.id === id ? { ...item, ...patch } : item)) });
    },
    [commit],
  );

  const removeLibraryEntry = useCallback(
    <K extends ArrayKey>(key: K, id: string) => {
      const current = parse(readRaw());
      commit({ ...current, [key]: current[key].filter((item) => item.id !== id) });
    },
    [commit],
  );

  const createVisa = useCallback(() => {
    const now = new Date().toISOString();
    const visa = emptyVisaDraft(nextId("vize"), now);
    const current = parse(readRaw());
    commit({ ...current, visas: [visa, ...current.visas] });
    return visa;
  }, [commit]);

  const updateVisa = useCallback(
    (id: string, patch: Partial<VisaDraft>) => updateLibraryEntry("visas", id, { ...patch, updatedAt: new Date().toISOString() }),
    [updateLibraryEntry],
  );
  const setVisaStatus = useCallback((id: string, status: VisaDraft["status"]) => updateVisa(id, { status }), [updateVisa]);
  const removeVisa = useCallback((id: string) => removeLibraryEntry("visas", id), [removeLibraryEntry]);
  const restoreVisa = useCallback(
    (visa: VisaDraft, index: number) => {
      const current = parse(readRaw());
      const next = [...current.visas];
      next.splice(Math.min(index, next.length), 0, visa);
      commit({ ...current, visas: next });
    },
    [commit],
  );
  const duplicateVisa = useCallback(
    (id: string) => {
      const current = parse(readRaw());
      const source = current.visas.find((v) => v.id === id);
      if (!source) return null;
      const now = new Date().toISOString();
      const copy: VisaDraft = { ...source, id: nextId("vize"), title: `${source.title} (kopya)`, createdAt: now, updatedAt: now };
      commit({ ...current, visas: [copy, ...current.visas] });
      return copy;
    },
    [commit],
  );

  const createBooking = useCallback(
    (booking: Omit<VisaBooking, "id" | "createdAt">) => {
      const current = parse(readRaw());
      const created: VisaBooking = { ...booking, id: nextId("vrez"), createdAt: new Date().toISOString() };
      commit({ ...current, bookings: [created, ...current.bookings] });
      return created;
    },
    [commit],
  );
  const setBookingOperationStatus = useCallback(
    (id: string, status: VisaBooking["operationStatus"]) => updateLibraryEntry("bookings", id, { operationStatus: status }),
    [updateLibraryEntry],
  );

  const createForm = useCallback(() => {
    const now = new Date().toISOString();
    const form = emptyApplicationForm(nextId("form"), now);
    const current = parse(readRaw());
    commit({ ...current, forms: [form, ...current.forms] });
    return form;
  }, [commit]);
  const updateForm = useCallback(
    (id: string, patch: Partial<VisaApplicationForm>) => updateLibraryEntry("forms", id, { ...patch, updatedAt: new Date().toISOString() }),
    [updateLibraryEntry],
  );
  const removeForm = useCallback((id: string) => removeLibraryEntry("forms", id), [removeLibraryEntry]);
  const getForm = useCallback((id: string) => store.forms.find((f) => f.id === id), [store.forms]);

  const submitApplication = useCallback(
    (application: Omit<VisaApplication, "id">) => {
      const current = parse(readRaw());
      const created: VisaApplication = { ...application, id: nextId("basv") };
      commit({ ...current, applications: [created, ...current.applications] });
      return created;
    },
    [commit],
  );
  const setApplicationStatus = useCallback(
    (id: string, status: VisaApplication["status"], notifyMessage?: string) => {
      const current = parse(readRaw());
      commit({
        ...current,
        applications: current.applications.map((a) =>
          a.id === id
            ? {
                ...a,
                status,
                notifications: notifyMessage
                  ? [...a.notifications, { id: nextId("bildirim"), message: notifyMessage, sentAt: new Date().toISOString() }]
                  : a.notifications,
              }
            : a,
        ),
      });
    },
    [commit],
  );
  const sendExtraDocRequest = useCallback(
    (id: string) => updateLibraryEntry("applications", id, { extraDocRequestSentAt: new Date().toISOString() }),
    [updateLibraryEntry],
  );

  const value = useMemo<VisaCatalogContext>(
    () => ({
      visas: store.visas,
      bookings: store.bookings,
      forms: store.forms,
      applications: store.applications,
      createVisa,
      updateVisa,
      setVisaStatus,
      removeVisa,
      restoreVisa,
      duplicateVisa,
      createBooking,
      setBookingOperationStatus,
      createForm,
      updateForm,
      removeForm,
      getForm,
      submitApplication,
      setApplicationStatus,
      sendExtraDocRequest,
    }),
    [
      store,
      createVisa,
      updateVisa,
      setVisaStatus,
      removeVisa,
      restoreVisa,
      duplicateVisa,
      createBooking,
      setBookingOperationStatus,
      createForm,
      updateForm,
      removeForm,
      getForm,
      submitApplication,
      setApplicationStatus,
      sendExtraDocRequest,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVisaCatalog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVisaCatalog, VisaCatalogProvider içinde çağrılmalı");
  return ctx;
}
