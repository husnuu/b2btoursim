"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { SelectField, TextAreaField, TextField } from "@/components/primitives/Field";
import { useToast } from "@/components/primitives/Toast";
import type { VisaApplicationFieldType, VisaApplicationFormField } from "@/lib/visa";
import { useVisaCatalog } from "@/lib/visa-store";
import { ApplicationProcessBanner } from "./ApplicationProcessBanner";

const TYPE_LABELS: Record<VisaApplicationFieldType, string> = {
  text: "Metin",
  date: "Tarih",
  file: "Belge Yükle",
  select: "Açılır Liste",
};

/**
 * 4.2 tasarım notu (Faz2) — form alan tasarımcısı. Tur'un
 * `CustomerInfoStep` deseniyle aynı ruhta: alan tanımı ekle/kaldır.
 */
export function FormEditView({ formId }: { formId: string }) {
  const router = useRouter();
  const { forms, updateForm } = useVisaCatalog();
  const { notify } = useToast();

  const form = forms.find((f) => f.id === formId);

  const [newField, setNewField] = useState<{ label: string; type: VisaApplicationFieldType; required: boolean; optionsText: string }>({
    label: "",
    type: "text",
    required: true,
    optionsText: "",
  });

  if (!form) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-start gap-2 px-[var(--pad-x)] py-16">
        <h1 className="text-lg font-medium text-ink">Bu form bulunamadı</h1>
        <Button type="button" variant="primary" className="mt-3" onClick={() => router.push("/extranet/vize/basvuru-formlari")}>
          Başvuru Formları&apos;na dön
        </Button>
      </div>
    );
  }

  const addField = () => {
    if (!newField.label.trim()) return;
    const field: VisaApplicationFormField = {
      id: crypto.randomUUID(),
      label: newField.label,
      type: newField.type,
      required: newField.required,
      options: newField.type === "select" ? newField.optionsText.split(",").map((o) => o.trim()).filter(Boolean) : [],
    };
    updateForm(form.id, { fields: [...form.fields, field] });
    setNewField({ label: "", type: "text", required: true, optionsText: "" });
  };

  const removeField = (id: string) => updateForm(form.id, { fields: form.fields.filter((f) => f.id !== id) });

  const copyLink = async () => {
    const url = `${window.location.origin}/basvuru/${form.id}`;
    try {
      await navigator.clipboard.writeText(url);
      notify("Public link panoya kopyalandı.");
    } catch {
      notify(url);
    }
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      <ApplicationProcessBanner />

      <header className="flex items-center gap-3 border-b border-line px-[var(--pad-x)] py-2.5">
        <p className="font-dense text-[length:var(--font-ui)] font-medium text-ink">{form.name || "(Adsız form)"}</p>
        <div className="ms-auto flex gap-2">
          <Button type="button" size="sm" onClick={copyLink}>
            Linki kopyala
          </Button>
          <Button type="button" size="sm" onClick={() => router.push("/extranet/vize/basvuru-formlari")}>
            Kapat ✕
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-[var(--pad-x)] py-5">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="font-dense text-base font-medium text-ink">Form Meta Bilgileri</h2>
            <TextField label="Form Adı" required value={form.name} onChange={(e) => updateForm(form.id, { name: e.target.value })} />
            <TextAreaField label="Açıklama" rows={3} value={form.description} onChange={(e) => updateForm(form.id, { description: e.target.value })} />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.acceptingSubmissions} onChange={(e) => updateForm(form.id, { acceptingSubmissions: e.target.checked })} className="h-4 w-4 accent-[var(--action-primary)]" />
              <span className="text-[length:var(--font-ui)] text-ink">Başvuru Alımı Açık</span>
            </label>
            <TextAreaField label="Teşekkür Mesajı" rows={3} value={form.thankYouMessage} onChange={(e) => updateForm(form.id, { thankYouMessage: e.target.value })} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-dense text-base font-medium text-ink">Form Alanları (Faz2)</h2>
            {form.fields.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {form.fields.map((field) => (
                  <li key={field.id} className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-line px-3 py-2">
                    <span className="text-[length:var(--font-ui)] text-ink">
                      {field.label}
                      <span className="ms-2 text-[length:var(--font-ui-sm)] text-ink-3">
                        {TYPE_LABELS[field.type]}
                        {field.required ? " · zorunlu" : ""}
                        {field.options.length > 0 ? ` · ${field.options.join(", ")}` : ""}
                      </span>
                    </span>
                    <Button type="button" size="sm" variant="danger" onClick={() => removeField(field.id)}>
                      Kaldır
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="grid gap-3 rounded-[var(--radius-lg)] border border-line p-3 sm:grid-cols-2">
              <TextField label="Alan adı" value={newField.label} onChange={(e) => setNewField({ ...newField, label: e.target.value })} placeholder="ör. Pasaport Numarası" />
              <SelectField label="Alan tipi" value={newField.type} onChange={(e) => setNewField({ ...newField, type: e.target.value as VisaApplicationFieldType })}>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectField>
              {newField.type === "select" && (
                <TextField label="Seçenekler (virgülle ayırın)" value={newField.optionsText} onChange={(e) => setNewField({ ...newField, optionsText: e.target.value })} className="sm:col-span-2" />
              )}
              <label className="flex items-center gap-2 self-end pb-2">
                <input type="checkbox" checked={newField.required} onChange={(e) => setNewField({ ...newField, required: e.target.checked })} className="h-4 w-4 accent-[var(--action-primary)]" />
                <span className="text-[length:var(--font-ui)] text-ink">Zorunlu</span>
              </label>
              <Button type="button" variant="primary" className="self-start sm:col-span-2" onClick={addField}>
                Alan tanımı ekle
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
