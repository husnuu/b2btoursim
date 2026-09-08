import { NumberField, SelectField, TextField } from "@/components/primitives/Field";
import type { CaptainOption } from "@/lib/boat";
import type { BoatStepProps } from "./shared";

const OPTIONS: { value: CaptainOption; label: string; body: string }[] = [
  { value: "kaptanli", label: "Kaptanlı", body: "Tekne, ehliyetli bir kaptanla birlikte kiralanır. Kaptan ücreti tekne fiyatına dahil edilmez, süreye göre ayrı gösterilir." },
  { value: "kaptansiz", label: "Kaptansız (Bareboat)", body: "Kiracı kendi kullanır; geçerli kaptanlık ehliyeti/belgesi ibrazı rezervasyon ön koşuludur." },
  { value: "herIkisi", label: "Her İkisi", body: "Tedarikçi her iki seçeneği de sunar; müşteri rezervasyon anında seçer, fiyat buna göre güncellenir." },
];

/** 4.1 Kaptan Seçeneği — fiyatlandırma adımındaki alan setini belirleyen ilk karar. */
export function CaptainStep({ boat, onChange }: BoatStepProps) {
  const needsCaptainFee = boat.captainOption !== "kaptansiz";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        {OPTIONS.map((option) => (
          <label key={option.value} className={`flex flex-col gap-0.5 rounded-[var(--radius)] border px-3 py-2 ${boat.captainOption === option.value ? "border-action bg-action-tint" : "border-line hover:border-ink-3"}`}>
            <span className="flex items-center gap-2">
              <input type="radio" name="captainOption" checked={boat.captainOption === option.value} onChange={() => onChange({ captainOption: option.value })} className="h-4 w-4 accent-[var(--action-primary)]" />
              <span className="text-[length:var(--font-ui)] font-medium text-ink">{option.label}</span>
            </span>
            <span className="ms-6 text-[length:var(--font-ui-sm)] text-ink-3">{option.body}</span>
          </label>
        ))}
      </div>

      {needsCaptainFee && (
        <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-line p-3">
          <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">
            Kaptan Ücreti<span className="ms-0.5 text-danger">*</span>
          </span>
          <div className="grid gap-3 sm:grid-cols-3">
            <NumberField
              label="Ücret"
              required
              min={0}
              value={(boat.captainFee ?? 0) / 100}
              onChange={(e) => onChange({ captainFee: Math.round(Number(e.target.value) * 100) })}
            />
            <SelectField label="Birim" value={boat.captainFeeUnit} onChange={(e) => onChange({ captainFeeUnit: e.target.value as "saatlik" | "gunluk" })}>
              <option value="saatlik">Saatlik</option>
              <option value="gunluk">Günlük</option>
            </SelectField>
            <SelectField label="Ödeme Yöntemi" value={boat.captainPaymentMethod} onChange={(e) => onChange({ captainPaymentMethod: e.target.value as "limandaNakit" | "platform" })}>
              <option value="limandaNakit">Limanda nakit</option>
              <option value="platform">Platform üzerinden tahsilat</option>
            </SelectField>
          </div>
          <TextField label="Kaptan Dili" value={boat.captainLanguage} onChange={(e) => onChange({ captainLanguage: e.target.value })} placeholder="ör. Türkçe, İngilizce" />
        </div>
      )}
    </div>
  );
}
