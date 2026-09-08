import { TextAreaField } from "@/components/primitives/Field";
import type { CancellationTemplate } from "@/lib/tour";
import type { VillaStepProps } from "./shared";

/**
 * 5.1 İptal ve İade Politikası — Tur'daki `CancellationTemplate` tipi
 * yeniden kullanılır (Bölüm 7 Cross-Reference); villa yalnızca 3 seçenek
 * sunar (Genel/Katı/Özel — `esnek` villa'da yok).
 */
const OPTIONS: { value: CancellationTemplate; label: string; body: string }[] = [
  { value: "orta", label: "Genel", body: "Gezginler, tam para iadesi almak için check-in'den 24 saat öncesine kadar iptal edebilir; bu süreden sonra iade yapılmaz." },
  { value: "kati", label: "Katı", body: "Gezginler iptal durumu ne olursa olsun geri ödeme almaz." },
  { value: "ozel", label: "Özel", body: "Kısa ve özel bir iptal/iade politikası metni girin." },
];

export function CancellationStep({ villa, onChange }: VillaStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        {OPTIONS.map((option) => (
          <label key={option.value} className={`flex flex-col gap-0.5 rounded-[var(--radius)] border px-3 py-2 ${villa.cancellationTemplate === option.value ? "border-action bg-action-tint" : "border-line hover:border-ink-3"}`}>
            <span className="flex items-center gap-2">
              <input type="radio" name="cancellationTemplate" checked={villa.cancellationTemplate === option.value} onChange={() => onChange({ cancellationTemplate: option.value })} className="h-4 w-4 accent-[var(--action-primary)]" />
              <span className="text-[length:var(--font-ui)] font-medium text-ink">{option.label}</span>
            </span>
            <span className="ms-6 text-[length:var(--font-ui-sm)] text-ink-3">{option.body}</span>
          </label>
        ))}
      </div>

      {villa.cancellationTemplate === "ozel" && (
        <TextAreaField label="Özel iptal/iade politikası metni" rows={4} value={villa.customPolicyText} onChange={(e) => onChange({ customPolicyText: e.target.value })} />
      )}
    </div>
  );
}
