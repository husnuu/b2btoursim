"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AlertTriangle, Building2, CheckCircle2, Loader2, Store } from "lucide-react";
import { serviceOptions, type BusinessType } from "@/content/site";
import { validateApplication, type ApplicationInput, type FieldErrors } from "@/lib/landing/application";
import { buttonClass } from "@/components/landing/ui/primitives";

type Phase =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; reason: "not_configured" | "delivery_failed" | "network" };

const typeOptions: { value: BusinessType; title: string; body: string; icon: ReactNode }[] = [
  { value: "acente", title: "Seyahat Acentesi", body: "Ürün satın almak ve satmak istiyorum", icon: <Store className="size-5" /> },
  { value: "tedarikci", title: "Tedarikçi", body: "Ürünlerimi acentelere açmak istiyorum", icon: <Building2 className="size-5" /> },
];

const inputClass =
  "h-12 w-full rounded-xl border border-ink/20 bg-white px-4 text-[15px] text-ink placeholder:text-ink-3 transition focus:border-ink focus:ring-4 focus:ring-pop/50 focus:outline-none aria-[invalid=true]:border-red-500";

export function ApplicationForm({ preset, onDone }: { preset?: BusinessType; onDone: () => void }) {
  const [values, setValues] = useState<ApplicationInput>({
    company: "",
    contact: "",
    email: "",
    phone: "",
    type: preset ?? "",
    services: [],
    message: "",
    consent: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase.kind === "error") alertRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [phase]);

  const set = <K extends keyof ApplicationInput>(key: K, value: ApplicationInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found = validateApplication(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0];
      e.currentTarget.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
      return;
    }
    setPhase({ kind: "sending" });
    try {
      const res = await fetch("/api/basvuru", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) return setPhase({ kind: "sent" });
      const data = (await res.json().catch(() => ({}))) as { error?: string; fields?: FieldErrors };
      if (data.error === "validation" && data.fields) {
        setErrors(data.fields);
        return setPhase({ kind: "idle" });
      }
      setPhase({ kind: "error", reason: data.error === "not_configured" ? "not_configured" : "delivery_failed" });
    } catch {
      setPhase({ kind: "error", reason: "network" });
    }
  }

  if (phase.kind === "sent") {
    return (
      <div className="flex flex-col items-start gap-4 py-6" role="status">
        <span className="grid size-12 place-items-center rounded-full bg-pop text-ink">
          <CheckCircle2 className="size-6" />
        </span>
        <h2 id="basvuru-baslik" className="font-display text-3xl font-semibold">Başvurunuz bize ulaştı.</h2>
        <p className="text-ink-2">
          {values.company} için ilettiğiniz bilgileri inceleyip {values.email} adresi üzerinden sizinle iletişime geçeceğiz.
        </p>
        <button type="button" onClick={onDone} className={buttonClass("dark")}>Kapat</button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 pr-10">
        <h2 id="basvuru-baslik" className="font-display text-3xl font-semibold sm:text-[2.1rem]">
          Seyyah&apos;a başvurun
        </h2>
        <p className="text-ink-2">Bilgilerinizi bırakın, başvurunuzu değerlendirip sizinle iletişime geçelim.</p>
      </header>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-ink">İşletme türü</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {typeOptions.map((o, i) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/20 p-4 transition has-checked:border-ink has-checked:bg-pop-soft has-focus-visible:ring-4 has-focus-visible:ring-pop/50"
            >
              <input
                type="radio"
                name="type"
                value={o.value}
                checked={values.type === o.value}
                onChange={() => set("type", o.value)}
                data-field={i === 0 ? "type" : undefined}
                className="sr-only"
              />
              <span className="mt-0.5 text-ink">{o.icon}</span>
              <span>
                <span className="block font-medium text-ink">{o.title}</span>
                <span className="block text-sm text-ink-3">{o.body}</span>
              </span>
            </label>
          ))}
        </div>
        <FieldError msg={errors.type} />
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Firma adı" error={errors.company} id="f-company">
          <input id="f-company" data-field="company" autoComplete="organization" className={inputClass}
            value={values.company} onChange={(e) => set("company", e.target.value)} aria-invalid={!!errors.company} aria-describedby="f-company-err" />
        </Field>
        <Field label="Yetkili kişi" error={errors.contact} id="f-contact">
          <input id="f-contact" data-field="contact" autoComplete="name" className={inputClass}
            value={values.contact} onChange={(e) => set("contact", e.target.value)} aria-invalid={!!errors.contact} aria-describedby="f-contact-err" />
        </Field>
        <Field label="E-posta" error={errors.email} id="f-email">
          <input id="f-email" data-field="email" type="email" inputMode="email" autoComplete="email" className={inputClass}
            value={values.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} aria-describedby="f-email-err" />
        </Field>
        <Field label="Telefon" error={errors.phone} id="f-phone">
          <input id="f-phone" data-field="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+90 5xx xxx xx xx" className={inputClass}
            value={values.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={!!errors.phone} aria-describedby="f-phone-err" />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-medium text-ink">İlgilendiğiniz hizmetler</legend>
        <div className="flex flex-wrap gap-2">
          {serviceOptions.map((s, i) => (
            <label key={s}
              className="cursor-pointer rounded-full border border-ink/20 px-4 py-2 text-sm text-ink-2 transition select-none hover:border-ink/40 has-checked:border-ink has-checked:bg-ink has-checked:text-white has-focus-visible:ring-4 has-focus-visible:ring-pop/50">
              <input type="checkbox" className="sr-only" data-field={i === 0 ? "services" : undefined}
                checked={values.services.includes(s)}
                onChange={(e) => set("services", e.target.checked ? [...values.services, s] : values.services.filter((x) => x !== s))} />
              {s}
            </label>
          ))}
        </div>
        <FieldError msg={errors.services} />
      </fieldset>

      <Field label="Mesaj (opsiyonel)" error={errors.message} id="f-message">
        <textarea id="f-message" data-field="message" rows={3} maxLength={2000}
          className={`${inputClass} h-auto resize-y py-3`} value={values.message}
          onChange={(e) => set("message", e.target.value)} aria-describedby="f-message-err" />
      </Field>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-2">
          <input type="checkbox" data-field="consent" checked={values.consent} onChange={(e) => set("consent", e.target.checked)}
            className="mt-0.5 size-4.5 shrink-0 accent-ink" aria-invalid={!!errors.consent} />
          <span>
            Kişisel verilerimin başvurumun değerlendirilmesi amacıyla işlenmesine ilişkin{" "}
            <a href="/yasal/kvkk" target="_blank" className="font-medium text-ink underline underline-offset-2">KVKK aydınlatma metnini</a>{" "}
            okudum.
          </span>
        </label>
        <FieldError msg={errors.consent} />
      </div>

      {phase.kind === "error" && (
        <div ref={alertRef} role="alert" className="flex gap-3 rounded-2xl border border-amber/25 bg-amber-soft p-4 text-sm text-ink">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber" />
          <div>
            {phase.reason === "not_configured" ? (
              <>
                <p className="font-semibold">Başvurunuz gönderilemedi.</p>
                <p className="text-ink-2">
                  Online başvuru altyapımız henüz devreye alınmadı; girdiğiniz bilgiler kaydedilmedi. Çok yakında bu form üzerinden başvuru alabileceğiz.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">Bir sorun oluştu.</p>
                <p className="text-ink-2">Başvurunuz iletilemedi. Lütfen birkaç dakika sonra tekrar deneyin.</p>
              </>
            )}
          </div>
        </div>
      )}

      <button type="submit" disabled={phase.kind === "sending"} className={buttonClass("dark", "lg", "w-full sm:w-auto sm:self-start")}>
        {phase.kind === "sending" && <Loader2 className="size-4 animate-spin" />}
        {phase.kind === "sending" ? "Gönderiliyor…" : "Başvuruyu Gönder"}
      </button>
    </form>
  );
}

function Field({ label, error, id, children }: { label: string; error?: string; id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
      {children}
      <FieldError msg={error} id={`${id}-err`} />
    </div>
  );
}

function FieldError({ msg, id }: { msg?: string; id?: string }) {
  return (
    <p id={id} className="min-h-0 text-sm text-red-600" aria-live="polite">
      {msg}
    </p>
  );
}
