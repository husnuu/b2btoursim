"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import type {
  VisaApplication,
  VisaApplicationForm,
  VisaBooking,
  VisaDraft,
} from "./visa";
import { emptyApplicationForm, emptyVisaDraft } from "./visa";
import { notifyLocalChange, readLocal, useLocalValue, writeLocal } from "./local-store";
import { syncVisa } from "./visas/publish";
import { deleteVisaForm, sendVisaExtraDocRequest, setVisaApplicationStatus, syncVisaForm } from "./visas/forms-actions";

/**
 * Vize kataloğu: ÜRÜNLERİN KAYNAĞI VERİTABANI (`listTenantVisas` →
 * `initialVisas`), tarayıcı yalnız kaydedilmemiş düzenlemeleri tutar —
 * `boat-store.tsx` ile aynı kalıp. Kimlikler UUID; Kaydet / Yayınla /
 * durum / sil `syncVisa` ile `visa_product` tablosuna yazar.
 *
 * Başvuru formları da tabloda (`listTenantForms` / `syncVisaForm`,
 * düzenleme gecikmeli yazılır); başvurular tablodan gelir, durum değişimi
 * sunucu eylemiyle yazılır ve yerelde iyimser gösterilir. Public başvuru
 * sayfası artık bu depoyu kullanmaz (bkz. `visas/public.ts`).
 */

const KEY = "kontuar.vize.v1";

type Store = {
  visas: VisaDraft[];
  /** Tarayıcıda silinen ama sunucu listesinde (yenilenene dek) duran kimlikler. */
  removedVisaIds?: string[];
  removedFormIds?: string[];
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
  saveVisa: (id: string) => Promise<{ ok: true; visaId: string } | { ok: false; error: string }>;
  removeVisa: (id: string) => void;
  restoreVisa: (visa: VisaDraft, index: number) => void;
  duplicateVisa: (id: string) => VisaDraft | null;

  createBooking: (booking: Omit<VisaBooking, "id" | "createdAt">) => VisaBooking;
  setBookingOperationStatus: (id: string, status: VisaBooking["operationStatus"]) => void;

  createForm: () => VisaApplicationForm;
  updateForm: (id: string, patch: Partial<VisaApplicationForm>) => void;
  removeForm: (id: string) => void;
  getForm: (id: string) => VisaApplicationForm | undefined;

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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** DB listesi + tarayıcı düzenlemeleri; aynı kimlikte tarayıcı kazanır. */
function mergeById<T extends { id: string }>(fromDb: T[], local: T[], removed: string[] = []): T[] {
  const byId = new Map<string, T>();
  for (const v of fromDb) if (!removed.includes(v.id)) byId.set(v.id, v);
  for (const v of local) byId.set(v.id, v);
  return [...byId.values()];
}
const byUpdated = <T extends { updatedAt: string }>(a: T, b: T) => b.updatedAt.localeCompare(a.updatedAt);

const FORM_SYNC_DELAY_MS = 800;

export function VisaCatalogProvider({
  initialVisas = [],
  initialForms = [],
  initialApplications = [],
  children,
}: {
  initialVisas?: VisaDraft[];
  initialForms?: VisaApplicationForm[];
  initialApplications?: VisaApplication[];
  children: React.ReactNode;
}) {
  const raw = useLocalValue(KEY);
  const store = useMemo(() => {
    const local = parse(raw);
    return {
      ...local,
      visas: mergeById(initialVisas, local.visas, local.removedVisaIds).sort(byUpdated),
      forms: mergeById(initialForms, local.forms.filter((f) => UUID.test(f.id)), local.removedFormIds).sort(byUpdated),
      // Başvurular tablodan; yerel kopya yalnız iyimser durum yaması.
      applications: mergeById(initialApplications, local.applications.filter((a) => UUID.test(a.id) && initialApplications.some((x) => x.id === a.id))).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    };
  }, [raw, initialVisas, initialForms, initialApplications]);
  const formTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const commit = useCallback((next: Store) => {
    writeLocal(KEY, JSON.stringify(next));
    notifyLocalChange();
  }, []);

  // Eski "vize-xxx" / "form-xxx" kimlikli kayıtlar bir kez UUID'ye taşınır ve tabloya yazılır.
  useEffect(() => {
    const current = parse(readRaw());
    const legacyVisas = current.visas.some((v) => !UUID.test(v.id));
    const legacyForms = current.forms.some((f) => !UUID.test(f.id));
    if (!legacyVisas && !legacyForms) return;
    const idMap = new Map<string, string>();
    const visas = current.visas.map((v) => {
      if (UUID.test(v.id)) return v;
      const id = crypto.randomUUID();
      idMap.set(v.id, id);
      return { ...v, id };
    });
    const bookings = current.bookings.map((b) => (idMap.has(b.visaId) ? { ...b, visaId: idMap.get(b.visaId)! } : b));
    const forms = current.forms.map((f) => (UUID.test(f.id) ? f : { ...f, id: crypto.randomUUID(), fields: f.fields.map((x) => (UUID.test(x.id) ? x : { ...x, id: crypto.randomUUID() })) }));
    commit({ ...current, visas, bookings, forms });
    if (legacyVisas) for (const v of visas) void syncVisa(v);
    if (legacyForms) for (const f of forms) void syncVisaForm(f);
  }, [commit]);

  const updateLibraryEntry = useCallback(
    <K extends ArrayKey>(key: K, id: string, patch: Partial<Store[K][number]>) => {
      const current = parse(readRaw());
      commit({ ...current, [key]: current[key].map((item) => (item.id === id ? { ...item, ...patch } : item)) });
    },
    [commit],
  );

  const createVisa = useCallback(() => {
    const now = new Date().toISOString();
    const visa = emptyVisaDraft(crypto.randomUUID(), now);
    const current = parse(readRaw());
    commit({ ...current, visas: [visa, ...current.visas] });
    void syncVisa(visa);
    return visa;
  }, [commit]);

  const updateVisa = useCallback(
    (id: string, patch: Partial<VisaDraft>) => {
      const current = parse(readRaw());
      // Yalnız DB'den gelen ürün önce tarayıcıya kopyalanır, sonra yamalanır.
      if (!current.visas.some((v) => v.id === id)) {
        const fromDb = initialVisas.find((v) => v.id === id);
        if (fromDb) commit({ ...current, visas: [fromDb, ...current.visas] });
      }
      updateLibraryEntry("visas", id, { ...patch, updatedAt: new Date().toISOString() });
    },
    [updateLibraryEntry, commit, initialVisas],
  );
  const setVisaStatus = useCallback(
    (id: string, status: VisaDraft["status"]) => {
      updateVisa(id, { status });
      const visa = parse(readRaw()).visas.find((v) => v.id === id);
      if (visa) void syncVisa(visa);
    },
    [updateVisa],
  );
  const saveVisa = useCallback(async (id: string) => {
    const visa = parse(readRaw()).visas.find((v) => v.id === id);
    if (!visa) return { ok: false as const, error: "missing" };
    return syncVisa(visa);
  }, []);
  const removeVisa = useCallback(
    (id: string) => {
      const current = parse(readRaw());
      const visa = current.visas.find((v) => v.id === id) ?? initialVisas.find((v) => v.id === id);
      commit({
        ...current,
        visas: current.visas.filter((v) => v.id !== id),
        removedVisaIds: [...(current.removedVisaIds ?? []), id],
      });
      // Sunucudaki kopya silinmez, arşivlenir.
      if (visa) void syncVisa({ ...visa, status: "arsivlendi" });
    },
    [commit, initialVisas],
  );
  const restoreVisa = useCallback(
    (visa: VisaDraft, index: number) => {
      const current = parse(readRaw());
      const next = [...current.visas];
      next.splice(Math.min(index, next.length), 0, visa);
      commit({ ...current, visas: next, removedVisaIds: (current.removedVisaIds ?? []).filter((x) => x !== visa.id) });
      void syncVisa(visa);
    },
    [commit],
  );
  const duplicateVisa = useCallback(
    (id: string) => {
      const current = parse(readRaw());
      const source = current.visas.find((v) => v.id === id) ?? initialVisas.find((v) => v.id === id);
      if (!source) return null;
      const now = new Date().toISOString();
      const copy: VisaDraft = { ...source, id: crypto.randomUUID(), status: "taslak", title: `${source.title} (kopya)`, createdAt: now, updatedAt: now };
      commit({ ...current, visas: [copy, ...current.visas] });
      void syncVisa(copy);
      return copy;
    },
    [commit, initialVisas],
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

  /** Form düzenlemesi tuş başına yerel; tabloya gecikmeli yazılır. */
  const scheduleFormSync = useCallback((id: string) => {
    const timers = formTimers.current;
    const t = timers.get(id);
    if (t) clearTimeout(t);
    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id);
        const form = parse(readRaw()).forms.find((f) => f.id === id);
        if (form) void syncVisaForm(form);
      }, FORM_SYNC_DELAY_MS),
    );
  }, []);

  const createForm = useCallback(() => {
    const now = new Date().toISOString();
    const form = emptyApplicationForm(crypto.randomUUID(), now);
    const current = parse(readRaw());
    commit({ ...current, forms: [form, ...current.forms] });
    void syncVisaForm(form);
    return form;
  }, [commit]);
  const updateForm = useCallback(
    (id: string, patch: Partial<VisaApplicationForm>) => {
      const current = parse(readRaw());
      if (!current.forms.some((f) => f.id === id)) {
        const fromDb = initialForms.find((f) => f.id === id);
        if (fromDb) commit({ ...current, forms: [fromDb, ...current.forms] });
      }
      updateLibraryEntry("forms", id, { ...patch, updatedAt: new Date().toISOString() });
      scheduleFormSync(id);
    },
    [updateLibraryEntry, commit, initialForms, scheduleFormSync],
  );
  const removeForm = useCallback(
    (id: string) => {
      const current = parse(readRaw());
      commit({ ...current, forms: current.forms.filter((f) => f.id !== id), removedFormIds: [...(current.removedFormIds ?? []), id] });
      void deleteVisaForm(id);
    },
    [commit],
  );
  const getForm = useCallback((id: string) => store.forms.find((f) => f.id === id), [store.forms]);

  const patchApplication = useCallback(
    (id: string, fn: (a: VisaApplication) => VisaApplication) => {
      const current = parse(readRaw());
      const base = current.applications.find((a) => a.id === id) ?? initialApplications.find((a) => a.id === id);
      if (!base) return;
      const next = fn(base);
      commit({ ...current, applications: [next, ...current.applications.filter((a) => a.id !== id)] });
    },
    [commit, initialApplications],
  );
  const setApplicationStatus = useCallback(
    (id: string, status: VisaApplication["status"], notifyMessage?: string) => {
      patchApplication(id, (a) => ({
        ...a,
        status,
        notifications: notifyMessage ? [...a.notifications, { id: crypto.randomUUID(), message: notifyMessage, sentAt: new Date().toISOString() }] : a.notifications,
      }));
      void setVisaApplicationStatus(id, status, notifyMessage);
    },
    [patchApplication],
  );
  const sendExtraDocRequest = useCallback(
    (id: string) => {
      patchApplication(id, (a) => ({ ...a, extraDocRequestSentAt: new Date().toISOString() }));
      void sendVisaExtraDocRequest(id);
    },
    [patchApplication],
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
      saveVisa,
      removeVisa,
      restoreVisa,
      duplicateVisa,
      createBooking,
      setBookingOperationStatus,
      createForm,
      updateForm,
      removeForm,
      getForm,
      setApplicationStatus,
      sendExtraDocRequest,
    }),
    [
      store,
      createVisa,
      updateVisa,
      setVisaStatus,
      saveVisa,
      removeVisa,
      restoreVisa,
      duplicateVisa,
      createBooking,
      setBookingOperationStatus,
      createForm,
      updateForm,
      removeForm,
      getForm,
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
