import { NumberField } from "@/components/primitives/Field";
import type { VillaBookingMethod } from "@/lib/villa";
import type { VillaStepProps } from "./shared";

const METHODS: { value: VillaBookingMethod; label: string; body: string }[] = [
  { value: "talepTopla", label: "Talep Topla", body: "Müşteri sadece kişi bilgilerini girip talepte bulunur; tedarikçi onaylar ya da reddeder — ödeme alınmaz." },
  { value: "onlineOdemeIleAl", label: "Online Ödeme ile Rezervasyon Al", body: "Müşteri doğrudan tam ödeme ile anında rezervasyon yapar." },
  { value: "belirliOranOdeme", label: "Belirli Oranda Online Ödeme Al", body: "Müşteri toplam tutar üzerinden tedarikçinin belirleyeceği %'lik payı online öder (kapora modeli)." },
  { value: "belirliOranOdemeYuvarla", label: "Belirli Oranda Online Ödeme Al ve Kalanı Yuvarla", body: "Kapora modeliyle aynı, ek olarak geri kalan tutar tam sayıya yuvarlanır." },
];

/** 5.2 Rezervasyon Süreci — en az bir Müşteri Rezervasyon Yöntemi zorunlu. */
export function BookingProcessStep({ villa, onChange }: VillaStepProps) {
  const toggleMethod = (value: VillaBookingMethod) =>
    onChange({ bookingMethods: villa.bookingMethods.includes(value) ? villa.bookingMethods.filter((m) => m !== value) : [...villa.bookingMethods, value] });

  return (
    <div className="flex flex-col gap-5">
      <NumberField
        label="Rezervasyon Almayı Durdurma Süresi (gün)"
        min={0}
        value={villa.bookingCutoffDays}
        onChange={(e) => onChange({ bookingCutoffDays: Number(e.target.value) })}
        hint="En yakın aktif tarihten önceki süreyi hesaplar; check-in'den 0 gün önce anlık kapama demektir."
        className="max-w-xs"
      />

      <div className="flex flex-col gap-2">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">
          Müşteri Rezervasyon Yöntemi<span className="ms-0.5 text-danger">*</span>
        </span>
        <p className="text-[length:var(--font-ui-sm)] text-ink-3">En az biri zorunlu; birden fazlası birlikte açılabilir.</p>
        {METHODS.map((method) => {
          const on = villa.bookingMethods.includes(method.value);
          return (
            <label key={method.value} className={`flex flex-col gap-0.5 rounded-[var(--radius)] border px-3 py-2 ${on ? "border-action bg-action-tint" : "border-line hover:border-ink-3"}`}>
              <span className="flex items-center gap-2">
                <input type="checkbox" checked={on} onChange={() => toggleMethod(method.value)} className="h-4 w-4 accent-[var(--action-primary)]" />
                <span className="text-[length:var(--font-ui)] font-medium text-ink">{method.label}</span>
              </span>
              <span className="ms-6 text-[length:var(--font-ui-sm)] text-ink-3">{method.body}</span>
            </label>
          );
        })}
      </div>

      <NumberField
        label="Minimum Konaklama Süresi (gece)"
        min={1}
        value={villa.minNights}
        onChange={(e) => onChange({ minNights: Number(e.target.value) })}
        hint="Faz3 — sezona göre değişen minimum gece kısıtı; Operasyon'da rezervasyon anında kontrol edilir."
        className="max-w-xs"
      />
    </div>
  );
}
