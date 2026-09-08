"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { TextAreaField, TextField } from "@/components/primitives/Field";
import { useToast } from "@/components/primitives/Toast";
import { generateFormFieldsFromDocument } from "@/lib/ai-mock";
import { useVisaCatalog } from "@/lib/visa-store";
import { ApplicationProcessBanner } from "./ApplicationProcessBanner";

/** 4. Başvuru Formları. */
export function ApplicationFormsView() {
  const router = useRouter();
  const { forms, createForm, updateForm, removeForm } = useVisaCatalog();
  const { notify } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", acceptingSubmissions: true, thankYouMessage: "" });
  const [aiOpen, setAiOpen] = useState(false);
  const [aiFileName, setAiFileName] = useState("");
  const [aiWorking, setAiWorking] = useState(false);

  const openCreateModal = () => {
    setDraft({ name: "", description: "", acceptingSubmissions: true, thankYouMessage: "" });
    setModalOpen(true);
  };

  const saveForm = () => {
    if (!draft.name.trim()) return;
    const created = createForm();
    updateForm(created.id, draft);
    setModalOpen(false);
    router.push(`/extranet/vize/basvuru-formlari/${created.id}`);
  };

  const generateWithAi = () => {
    if (!aiFileName.trim()) return;
    setAiWorking(true);
    setTimeout(() => {
      const fields = generateFormFieldsFromDocument(aiFileName).map((f) => ({ ...f, id: crypto.randomUUID() }));
      const created = createForm();
      updateForm(created.id, { name: `${aiFileName} — Otomatik Form`, fields });
      setAiWorking(false);
      setAiOpen(false);
      setAiFileName("");
      notify("Form, yüklenen belgeden otomatik oluşturuldu.");
      router.push(`/extranet/vize/basvuru-formlari/${created.id}`);
    }, 700);
  };

  const copyLink = async (formId: string) => {
    const url = `${window.location.origin}/basvuru/${formId}`;
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

      <div className="flex flex-wrap items-center gap-3 border-b border-line px-[var(--pad-x)] py-2.5">
        <h1 className="font-dense text-base font-medium text-ink">Başvuru Formları</h1>
        <div className="ms-auto flex gap-2">
          <Button type="button" size="sm" onClick={() => setAiOpen(true)}>
            Yapay Zekâ ile Form Oku
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={openCreateModal}>
            Form Oluştur
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {forms.length === 0 ? (
          <div className="mx-auto flex max-w-lg flex-col items-start gap-2 px-[var(--pad-x)] py-14">
            <h2 className="text-lg font-medium text-ink">Henüz bir başvuru formu yok</h2>
            <p className="max-w-[52ch] text-ink-2">
              İlk formunuzu oluşturun, alanlarını ve istediğiniz belgeleri tanımlayın, ardından
              linkini paylaşın.
            </p>
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="primary" onClick={openCreateModal}>
                Form Oluştur
              </Button>
              <Button type="button" onClick={() => setAiOpen(true)}>
                Yapay Zekâ ile Form Oku
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {forms.map((form) => (
              <div key={form.id} className="flex items-center justify-between gap-3 border-b border-line px-[var(--pad-x)] py-2.5">
                <div className="min-w-0">
                  <button type="button" onClick={() => router.push(`/extranet/vize/basvuru-formlari/${form.id}`)} className="truncate text-start text-[length:var(--font-ui)] text-ink hover:underline">
                    {form.name || "(Adsız form)"}
                  </button>
                  <p className="text-[length:var(--font-ui-sm)] text-ink-3">
                    {form.acceptingSubmissions ? "Başvuru alımı açık" : "Başvuru alımı kapalı"} · {form.fields.length} alan
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button type="button" size="sm" onClick={() => copyLink(form.id)}>
                    Linki kopyala
                  </Button>
                  <Button type="button" size="sm" onClick={() => router.push(`/extranet/vize/basvuru-formlari/${form.id}`)}>
                    Düzenle
                  </Button>
                  <Button type="button" size="sm" variant="danger" onClick={() => removeForm(form.id)}>
                    Sil
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-line-strong bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-dense text-lg font-medium text-ink">Form Oluştur</h2>
            <div className="mt-4 flex flex-col gap-3">
              <TextField label="Form Adı" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="ör. Schengen Vizesi Başvuru Formu" />
              <TextAreaField label="Açıklama" rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} hint="Neler isteniyor, ne kadar sürer, kimin doldurması gerekiyor." />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={draft.acceptingSubmissions} onChange={(e) => setDraft({ ...draft, acceptingSubmissions: e.target.checked })} className="h-4 w-4 accent-[var(--action-primary)]" />
                <span className="text-[length:var(--font-ui)] text-ink">Başvuru Alımı Açık</span>
              </label>
              <TextAreaField label="Teşekkür Mesajı" rows={3} value={draft.thankYouMessage} onChange={(e) => setDraft({ ...draft, thankYouMessage: e.target.value })} hint="Boş bırakılırsa standart bir mesaj kullanılır." />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" onClick={() => setModalOpen(false)}>
                Vazgeç
              </Button>
              <Button type="button" variant="primary" disabled={!draft.name.trim()} onClick={saveForm}>
                Kaydet
              </Button>
            </div>
          </div>
        </div>
      )}

      {aiOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onClick={() => setAiOpen(false)}>
          <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-line-strong bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-dense text-lg font-medium text-ink">Yapay Zekâ ile Form Oku</h2>
            <p className="mt-1 text-[length:var(--font-ui-sm)] text-ink-2">
              Var olan bir başvuru formu belgesinin adını girin; alanlar otomatik tanınıp dijital
              forma dönüştürülsün.
            </p>
            <div className="mt-4">
              <TextField label="Belge dosya adı" value={aiFileName} onChange={(e) => setAiFileName(e.target.value)} placeholder="ör. schengen-basvuru-formu.pdf" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" onClick={() => setAiOpen(false)}>
                Vazgeç
              </Button>
              <Button type="button" variant="primary" disabled={aiWorking || !aiFileName.trim()} onClick={generateWithAi}>
                {aiWorking ? "Okunuyor…" : "Formu Oluştur"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
