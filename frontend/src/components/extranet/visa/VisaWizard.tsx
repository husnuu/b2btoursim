"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { NumberField, SelectField, TextAreaField, TextField } from "@/components/primitives/Field";
import { VisaStatusBadge } from "@/components/primitives/VisaStatusBadge";
import { useToast } from "@/components/primitives/Toast";
import { missingVisaFields, visaCompletionPct, type VisaDraft } from "@/lib/visa";
import { canTransition } from "@/lib/visa-status";
import { useVisaCatalog } from "@/lib/visa-store";

const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];

/**
 * 2.2 Vize Oluştur Sihirbazı (Simetrik/Önerilen) — Tur/Villa'nın aynı
 * iskeleti, ama alan sayısı az olduğu için 2 adıma (Detaylar +
 * Tamamlandı) orantılı ölçeklendi.
 */
export function VisaWizard({ id }: { id: string }) {
  const router = useRouter();
  const { visas, updateVisa, setVisaStatus } = useVisaCatalog();
  const { notify } = useToast();
  const [summary, setSummary] = useState(false);
  const [newDoc, setNewDoc] = useState("");

  const visa = visas.find((v) => v.id === id);

  if (!visa) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-start gap-2 px-[var(--pad-x)] py-16">
        <h1 className="text-lg font-medium text-ink">Bu vize bulunamadı</h1>
        <p className="max-w-[52ch] text-ink-2">Kayıt silinmiş veya bağlantı geçersiz olabilir.</p>
        <Button type="button" variant="primary" className="mt-3" onClick={() => router.push("/extranet/vize")}>
          Vizeler&apos;e dön
        </Button>
      </div>
    );
  }

  const onChange = (patch: Partial<VisaDraft>) => updateVisa(visa.id, patch);
  const pct = visaCompletionPct(visa);
  const missing = missingVisaFields(visa);
  const canGoLive = canTransition(visa.status, "aktif");
  const ready = missing.length === 0 && canGoLive;

  const addDoc = () => {
    const value = newDoc.trim();
    if (!value) return;
    onChange({ requiredDocuments: [...visa.requiredDocuments, value] });
    setNewDoc("");
  };

  const publish = () => {
    if (!ready) return;
    setVisaStatus(visa.id, "aktif");
    notify(`${visa.title || "Vize"} yayınlandı.`);
    router.push("/extranet/vize");
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-line px-[var(--pad-x)] py-2.5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate font-dense text-[length:var(--font-ui)] font-medium text-ink">
            {visa.title || "Yeni vize"}
            <VisaStatusBadge status={visa.status} />
          </p>
          <p className="tnum text-[length:var(--font-ui-sm)] text-ink-3">%{pct} Tamamlandı</p>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <Button type="button" size="sm" onClick={() => setSummary(false)} disabled={!summary}>
            Detaylar
          </Button>
          <Button type="button" size="sm" onClick={() => setSummary(true)} disabled={summary}>
            Tamamlandı
          </Button>
          <Button type="button" size="sm" onClick={() => router.push("/extranet/vize")}>
            Kapat ✕
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-[var(--pad-x)] py-5">
        <div className="mx-auto max-w-2xl">
          {!summary ? (
            <div className="flex flex-col gap-5">
              <h1 className="text-lg font-medium text-ink">Başlık / Ülke, Açıklama, Fiyat</h1>
              <TextField label="Başlık / Ülke" required value={visa.title} onChange={(e) => onChange({ title: e.target.value })} placeholder='ör. "Schengen Vizesi"' />
              <TextField label="Ülke" value={visa.country} onChange={(e) => onChange({ country: e.target.value })} placeholder="ör. Fransa" />
              <TextAreaField label="Açıklama" rows={6} value={visa.description} onChange={(e) => onChange({ description: e.target.value })} />

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Para Birimi" value={visa.currency} onChange={(e) => onChange({ currency: e.target.value })}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </SelectField>
                <NumberField label="Fiyat (hizmet bedeli)" min={0} value={visa.price / 100} onChange={(e) => onChange({ price: Math.round(Number(e.target.value) * 100) })} hint="Konsolosluk resmi ücretinden ayrı, platform/acente hizmet bedeli." />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField label="Geçerlilik / İşlem Süresi (min gün)" min={0} value={visa.processingDaysMin ?? ""} onChange={(e) => onChange({ processingDaysMin: e.target.value === "" ? null : Number(e.target.value) })} />
                <NumberField label="Geçerlilik / İşlem Süresi (maks gün)" min={0} value={visa.processingDaysMax ?? ""} onChange={(e) => onChange({ processingDaysMax: e.target.value === "" ? null : Number(e.target.value) })} />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">Gerekli Belgeler Listesi</span>
                <div className="flex gap-2">
                  <input
                    value={newDoc}
                    onChange={(e) => setNewDoc(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addDoc();
                      }
                    }}
                    placeholder="ör. Pasaport fotokopisi"
                    className="h-9 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 text-[length:var(--font-ui)] text-ink outline-none placeholder:text-ink-3 focus:border-action"
                  />
                  <Button type="button" onClick={addDoc}>
                    Ekle
                  </Button>
                </div>
                {visa.requiredDocuments.length > 0 && (
                  <ul className="flex flex-col gap-1.5">
                    {visa.requiredDocuments.map((doc, index) => (
                      <li key={`${doc}-${index}`} className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-line px-2.5 py-1.5">
                        <span className="text-[length:var(--font-ui)] text-ink">{doc}</span>
                        <button
                          type="button"
                          onClick={() => onChange({ requiredDocuments: visa.requiredDocuments.filter((_, i) => i !== index) })}
                          aria-label={`${doc} kaldır`}
                          className="text-ink-3 hover:text-danger"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Button type="button" variant="primary" className="self-start" onClick={() => setSummary(true)}>
                Kaydet & Devam Et
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <h1 className="text-lg font-medium text-ink">Tamamlandı</h1>
              <div>
                <p className="tnum text-[length:var(--font-ui-sm)] text-ink-2">Vize içeriği %{pct} tamamlandı</p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sunken">
                  <div className="h-full bg-action transition-[width]" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-[length:var(--font-ui)]">
                <span aria-hidden="true" className={missing.includes("title") ? "text-danger" : "text-success"}>
                  {missing.includes("title") ? "✕" : "✓"}
                </span>
                <span className={missing.includes("title") ? "text-ink" : "text-ink-2"}>Başlık / Ülke</span>
              </div>

              {!canGoLive ? (
                <p className="text-[length:var(--font-ui-sm)] text-ink-3">{visa.status === "aktif" ? "Bu vize zaten yayında." : "Arşivlenmiş vizeler yeniden yayınlanamaz."}</p>
              ) : (
                <Button type="button" variant="primary" size="lg" disabled={!ready} onClick={publish} className="self-start">
                  Yayınla
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
