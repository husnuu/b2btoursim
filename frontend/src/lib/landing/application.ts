import { serviceOptions, type BusinessType } from "@/content/site";

export type ApplicationInput = {
  company: string;
  contact: string;
  email: string;
  phone: string;
  type: BusinessType | "";
  services: string[];
  message: string;
  consent: boolean;
};

export type FieldErrors = Partial<Record<keyof ApplicationInput, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Ülke kodu, boşluk, tire ve parantez serbest; en az 10 rakam
const PHONE_DIGITS = /\d/g;

/** İstemci ve sunucuda aynı kurallar çalışır. */
export function validateApplication(input: ApplicationInput): FieldErrors {
  const errors: FieldErrors = {};
  if (input.company.trim().length < 2) errors.company = "Firma adını girin.";
  if (input.contact.trim().length < 2) errors.contact = "Yetkili kişinin adını girin.";
  if (!EMAIL.test(input.email.trim())) errors.email = "Geçerli bir e-posta adresi girin.";
  if ((input.phone.match(PHONE_DIGITS) ?? []).length < 10) errors.phone = "Geçerli bir telefon numarası girin.";
  if (input.type !== "acente" && input.type !== "tedarikci") errors.type = "İşletme türünü seçin.";
  if (input.services.length === 0) errors.services = "En az bir hizmet seçin.";
  if (input.services.some((s) => !(serviceOptions as readonly string[]).includes(s)))
    errors.services = "Geçersiz hizmet seçimi.";
  if (input.message.length > 2000) errors.message = "Mesaj en fazla 2000 karakter olabilir.";
  if (!input.consent) errors.consent = "Devam etmek için aydınlatma metnini onaylayın.";
  return errors;
}

export function normalizeApplication(raw: unknown): ApplicationInput {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 2000) : "");
  return {
    company: str(r.company),
    contact: str(r.contact),
    email: str(r.email),
    phone: str(r.phone),
    type: r.type === "acente" || r.type === "tedarikci" ? r.type : "",
    services: Array.isArray(r.services) ? r.services.filter((s): s is string => typeof s === "string").slice(0, 20) : [],
    message: str(r.message),
    consent: r.consent === true,
  };
}
