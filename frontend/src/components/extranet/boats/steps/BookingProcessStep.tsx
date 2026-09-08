import { SelectField } from "@/components/primitives/Field";
import type { PaymentMode } from "@/lib/tour";
import type { BoatStepProps } from "./shared";

/** 5.1 Rezervasyon Süreci — Transfer/Tur modüllerindeki ödeme modlarının bu modüle uygun alt kümesi. */
const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: "anindaTamOdeme", label: "Anında tam ödeme" },
  { value: "kaporaBakiye", label: "Kapora + bakiye" },
  { value: "cariHesap", label: "Cari hesaba yansıt (B2B)" },
];

export function BookingProcessStep({ boat, onChange }: BoatStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        {PAYMENT_MODES.map((mode) => (
          <label key={mode.value} className={`flex items-center gap-2 rounded-[var(--radius)] border px-3 py-2 ${boat.paymentMode === mode.value ? "border-action bg-action-tint" : "border-line hover:border-ink-3"}`}>
            <input type="radio" name="paymentMode" checked={boat.paymentMode === mode.value} onChange={() => onChange({ paymentMode: mode.value })} className="h-4 w-4 accent-[var(--action-primary)]" />
            <span className="text-[length:var(--font-ui)] text-ink">{mode.label}</span>
          </label>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="Depozito ne zaman bloke edilir" value={boat.depositBlockTiming} onChange={(e) => onChange({ depositBlockTiming: e.target.value as "onayAninda" | "checkinde" })}>
          <option value="onayAninda">Rezervasyon onayı anında</option>
          <option value="checkinde">Check-in sırasında</option>
        </SelectField>
        <SelectField label="Depozito ne zaman iade edilir" value={boat.depositRefundTiming} onChange={(e) => onChange({ depositRefundTiming: e.target.value as "checkoutSonrasi" | "hasarDegerlendirmesiSonrasi" })}>
          <option value="checkoutSonrasi">Check-out sonrası</option>
          <option value="hasarDegerlendirmesiSonrasi">Hasar değerlendirmesi sonrası</option>
        </SelectField>
      </div>
    </div>
  );
}
