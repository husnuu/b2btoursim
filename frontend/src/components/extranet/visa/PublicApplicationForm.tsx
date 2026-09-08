"use client";

import { useState } from "react";
import { effectiveThankYouMessage, missingApplicationAnswers } from "@/lib/visa";
import { useVisaCatalog } from "@/lib/visa-store";
import { Button } from "@/components/primitives/Button";
import { TextField } from "@/components/primitives/Field";

/**
 * `/basvuru/[formId]` — girişsiz, public başvuru sayfası (Bölüm 3:
 * "Public link ile dağıtım"). AppShell dışında; kendi minimal düzeni.
 * Bu ağaç kendi `VisaCatalogProvider`'ını kurar — localStorage
 * paylaşıldığı için extranet'teki veriyle aynı depoyu okur/yazar.
 */
export function PublicApplicationForm({ formId }: { formId: string }) {
  const { getForm, submitApplication } = useVisaCatalog();
  const form = getForm(formId);

  const [applicantName, setApplicantName] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [documentNames, setDocumentNames] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [attempted, setAttempted] = useState(false);

  if (!form) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-lg font-medium text-ink">Bu form bulunamadı</h1>
        <p className="text-ink-2">Bağlantı geçersiz olabilir; lütfen size iletilen linki kontrol edin.</p>
      </div>
    );
  }

  if (!form.acceptingSubmissions) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-lg font-medium text-ink">Başvuru alımı şu anda kapalı</h1>
        <p className="text-ink-2">Bu form üzerinden başvuru alımı geçici olarak durdurulmuştur.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-lg font-medium text-ink">Teşekkürler</h1>
        <p className="text-ink-2">{effectiveThankYouMessage(form)}</p>
      </div>
    );
  }

  const missing = missingApplicationAnswers(form, answers);
  const nameMissing = !applicantName.trim();

  const submit = () => {
    setAttempted(true);
    if (nameMissing || missing.length > 0) return;
    submitApplication({
      formId: form.id,
      formNameSnapshot: form.name,
      applicantName,
      submittedAt: new Date().toISOString(),
      status: "yeni",
      answers,
      documentNames: Object.values(documentNames).filter(Boolean),
      notifications: [],
      extraDocRequestSentAt: null,
    });
    setSubmitted(true);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-xl font-medium text-ink">{form.name}</h1>
        {form.description && <p className="mt-2 whitespace-pre-line text-ink-2">{form.description}</p>}
      </div>

      <div className="flex flex-col gap-4">
        <TextField label="Ad Soyad" required value={applicantName} onChange={(e) => setApplicantName(e.target.value)} error={attempted && nameMissing ? "Bu alan zorunlu." : undefined} />

        {form.fields.map((field) => (
          <div key={field.id}>
            {field.type === "select" ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">
                  {field.label}
                  {field.required && <span className="ms-0.5 text-danger">*</span>}
                </span>
                <select
                  value={answers[field.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                  className="h-9 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 text-[length:var(--font-ui)] text-ink outline-none focus:border-action"
                >
                  <option value="">Seçilmedi</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {attempted && field.required && missing.includes(field.id) && <span className="text-[length:var(--font-ui-sm)] text-danger">Bu alan zorunlu.</span>}
              </label>
            ) : field.type === "file" ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">
                  {field.label}
                  {field.required && <span className="ms-0.5 text-danger">*</span>}
                </span>
                <input
                  type="file"
                  onChange={(e) => {
                    const name = e.target.files?.[0]?.name ?? "";
                    setDocumentNames({ ...documentNames, [field.id]: name });
                    setAnswers({ ...answers, [field.id]: name });
                  }}
                  className="text-[length:var(--font-ui-sm)] text-ink-2 file:me-3 file:rounded-[var(--radius)] file:border file:border-line-strong file:bg-surface file:px-3 file:py-1.5 file:text-[length:var(--font-ui-sm)] file:text-ink hover:file:bg-sunken"
                />
                {attempted && field.required && missing.includes(field.id) && <span className="text-[length:var(--font-ui-sm)] text-danger">Bu alan zorunlu.</span>}
              </label>
            ) : (
              <TextField
                label={field.label}
                type={field.type === "date" ? "date" : "text"}
                required={field.required}
                value={answers[field.id] ?? ""}
                onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                error={attempted && field.required && missing.includes(field.id) ? "Bu alan zorunlu." : undefined}
              />
            )}
          </div>
        ))}
      </div>

      <Button type="button" variant="primary" size="lg" onClick={submit}>
        Başvuruyu Gönder
      </Button>
    </div>
  );
}
