import { Button } from "@/components/primitives/Button";
import { NumberField } from "@/components/primitives/Field";
import type { CancellationCutoff, CancellationTemplate } from "@/lib/tour";
import type { BoatStepProps } from "./shared";

const TEMPLATES: { id: CancellationTemplate; label: string; body: string }[] = [
  { id: "esnek", label: "Esnek", body: "Tur tarihinden 24 saat öncesine kadar ücretsiz iptal." },
  { id: "orta", label: "Orta", body: "Tur tarihinden 3 gün öncesine kadar ücretsiz iptal." },
  { id: "kati", label: "Katı", body: "Tur tarihinden 7 gün öncesine kadar ücretsiz iptal." },
  { id: "ozel", label: "Özel", body: "Kademeli kesinti tablosuyla kendi kuralınızı tanımlayın." },
];

/** 5.2 İptal ve İade Politikası — Tur'daki şablon+kademe deseni. */
export function CancellationStep({ boat, onChange }: BoatStepProps) {
  const addCutoff = () => {
    const cutoff: CancellationCutoff = { id: crypto.randomUUID(), daysBefore: 7, refundPct: 50 };
    onChange({ tieredCutoffs: [...boat.tieredCutoffs, cutoff] });
  };
  const updateCutoff = (id: string, patch: Partial<CancellationCutoff>) =>
    onChange({ tieredCutoffs: boat.tieredCutoffs.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const removeCutoff = (id: string) => onChange({ tieredCutoffs: boat.tieredCutoffs.filter((c) => c.id !== id) });

  return (
    <div className="flex flex-col gap-6">
      {boat.weatherCancellationEnabled && (
        <p className="rounded-[var(--radius)] border border-line-strong bg-sunken px-3 py-2 text-[length:var(--font-ui-sm)] text-ink-2">
          Hava Durumu İptal Kuralı açık: fırtına/kötü hava koşullarında bu politikanın bir istisnası olarak ücretsiz iptal/erteleme uygulanır (bkz. Fiyatlandırma adımı).
        </p>
      )}

      <div className="flex flex-col gap-2">
        {TEMPLATES.map((template) => (
          <label key={template.id} className={`flex flex-col gap-0.5 rounded-[var(--radius)] border px-3 py-2 ${boat.cancellationTemplate === template.id ? "border-action bg-action-tint" : "border-line hover:border-ink-3"}`}>
            <span className="flex items-center gap-2">
              <input type="radio" name="cancellationTemplate" checked={boat.cancellationTemplate === template.id} onChange={() => onChange({ cancellationTemplate: template.id })} className="h-4 w-4 accent-[var(--action-primary)]" />
              <span className="text-[length:var(--font-ui)] font-medium text-ink">{template.label}</span>
            </span>
            <span className="ms-6 text-[length:var(--font-ui-sm)] text-ink-3">{template.body}</span>
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">Zaman dilimli kesinti tablosu</span>
          <Button type="button" size="sm" onClick={addCutoff}>
            Kademe ekle
          </Button>
        </div>
        {boat.tieredCutoffs.map((cutoff) => (
          <div key={cutoff.id} className="grid items-end gap-2 sm:grid-cols-[8rem_8rem_auto]">
            <NumberField label="Gün önce" min={0} value={cutoff.daysBefore} onChange={(e) => updateCutoff(cutoff.id, { daysBefore: Number(e.target.value) })} />
            <NumberField label="İade %" min={0} max={100} value={cutoff.refundPct} onChange={(e) => updateCutoff(cutoff.id, { refundPct: Number(e.target.value) })} />
            <Button type="button" variant="danger" onClick={() => removeCutoff(cutoff.id)}>
              Kaldır
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
