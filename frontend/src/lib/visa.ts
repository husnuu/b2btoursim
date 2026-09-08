import type { Money, Uuid } from "./types";
import type { TransferOperationStatus } from "./transfer";

/**
 * Vize Modülü — "Vize Modülü Spesifikasyonu". Öncekilerden yapısal
 * olarak farklı: tek ürün değil, **iki bağımsız iş akışı**:
 *
 * (A) Vize Satışı — `VisaDraft`/`VisaBooking`: Tur/Villa gibi vitrin
 *     üzerinden satılan, rezervasyona dönüşen bir ürün.
 * (B) Vize Başvuru Süreci — `VisaApplicationForm`/`VisaApplication`:
 *     satıştan **tamamen bağımsız**, public link ile dağıtılan bir
 *     bilgi/belge toplama aracı. `VisaApplication`, bilinçli olarak
 *     `VisaBooking`'e bağlı DEĞİLDİR (Bölüm 7 Cross-Reference) — bu,
 *     ürünün kendi "satış ≠ başvuru süreci" ilkesini veri modelinde de
 *     korur.
 *
 * Not: Bu modülün deposu (`visa-store.tsx`) bilinçli olarak diğer
 * modüllerden farklı şekilde localStorage kullanır (bkz. o dosyadaki
 * yorum) — public link farklı bir sekmede açılabilmeli.
 */

/* --- A. Vize Satışı ------------------------------------------------------- */

export type VisaDraft = {
  id: Uuid;
  status: "taslak" | "aktif" | "pasif" | "arsivlendi";
  title: string;
  country: string;
  description: string;
  price: Money;
  currency: string;
  /** Faz2 — "10-15 iş günü" gibi tahmini işlem süresi aralığı. */
  processingDaysMin: number | null;
  processingDaysMax: number | null;
  /** Faz2 — bu vize tipi için standart belge listesi. */
  requiredDocuments: string[];
  createdAt: string;
  updatedAt: string;
};

export function emptyVisaDraft(id: Uuid, now: string): VisaDraft {
  return {
    id,
    status: "taslak",
    title: "",
    country: "",
    description: "",
    price: 0,
    currency: "TRY",
    processingDaysMin: null,
    processingDaysMax: null,
    requiredDocuments: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Belgede * işaretli alan gösterilmedi (bölüm "Simetrik/Önerilen"); Başlık minimum ortak payda. */
export function missingVisaFields(visa: VisaDraft): string[] {
  const missing: string[] = [];
  if (!visa.title.trim()) missing.push("title");
  return missing;
}

export function canPublishVisa(visa: VisaDraft): boolean {
  return missingVisaFields(visa).length === 0;
}

export function visaCompletionPct(visa: VisaDraft): number {
  const checks: [boolean, number][] = [
    [visa.title.trim().length > 0, 2],
    [visa.country.trim().length > 0, 1],
    [visa.description.trim().length > 0, 1],
    [visa.price > 0, 1],
    [visa.processingDaysMin !== null, 1],
    [visa.requiredDocuments.length > 0, 1],
  ];
  const total = checks.reduce((sum, [, w]) => sum + w, 0);
  const done = checks.reduce((sum, [ok, w]) => sum + (ok ? w : 0), 0);
  return Math.round((done / total) * 100);
}

/** Bölüm 6 (Önerilen) — yalnızca Vize Satışı tarafı için, Transfer'in operasyon iskeletiyle aynı tip. */
export type VisaBooking = {
  id: Uuid;
  visaId: Uuid;
  visaTitleSnapshot: string;
  customerName: string;
  price: Money;
  currency: string;
  operationStatus: TransferOperationStatus;
  createdAt: string;
};

/* --- B. Vize Başvuru Süreci ------------------------------------------------ */

export type VisaApplicationFieldType = "text" | "date" | "file" | "select";

export type VisaApplicationFormField = {
  id: Uuid;
  label: string;
  type: VisaApplicationFieldType;
  required: boolean;
  /** Yalnızca type="select" için. */
  options: string[];
};

export type VisaApplicationForm = {
  id: Uuid;
  name: string;
  description: string;
  /** Varsayılan "Açık" (Bölüm 4.2). */
  acceptingSubmissions: boolean;
  thankYouMessage: string;
  fields: VisaApplicationFormField[];
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_THANK_YOU = "Başvurunuz alındı. Ekibimiz en kısa sürede sizinle iletişime geçecektir.";

export function emptyApplicationForm(id: Uuid, now: string): VisaApplicationForm {
  return {
    id,
    name: "",
    description: "",
    acceptingSubmissions: true,
    thankYouMessage: "",
    fields: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Etkin teşekkür mesajı — boşsa standart mesaj kullanılır (Bölüm 4.2). */
export function effectiveThankYouMessage(form: VisaApplicationForm): string {
  return form.thankYouMessage.trim() || DEFAULT_THANK_YOU;
}

export function missingFormFields(form: VisaApplicationForm): string[] {
  const missing: string[] = [];
  if (!form.name.trim()) missing.push("name");
  return missing;
}

export type VisaApplicationStatus =
  | "yeni"
  | "inceleniyor"
  | "belgeBekleniyor"
  | "konsoloslugaIletildi"
  | "tamamlandi"
  | "reddedildi";

export type VisaApplicationNotification = { id: Uuid; message: string; sentAt: string };

export type VisaApplication = {
  id: Uuid;
  formId: Uuid;
  formNameSnapshot: string;
  applicantName: string;
  submittedAt: string;
  status: VisaApplicationStatus;
  answers: Record<string, string>;
  /** Faz2 — gerçek dosya depolama yok (bkz. Tour'un TourImage deseni), yalnızca ad. */
  documentNames: string[];
  /** Faz2 — durum değişikliği bildirim simülasyon kaydı. */
  notifications: VisaApplicationNotification[];
  /** Faz3 — ek belge talebi gönderildiyse zaman damgası. */
  extraDocRequestSentAt: string | null;
};

/** Bir başvuru formunun zorunlu alanlarının doldurulup doldurulmadığını kontrol eder. */
export function missingApplicationAnswers(form: VisaApplicationForm, answers: Record<string, string>): string[] {
  return form.fields.filter((field) => field.required && !(answers[field.id] ?? "").trim()).map((field) => field.id);
}
