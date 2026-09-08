import type { VehiclePricingModel } from "@/lib/transfer";
import type { VehicleStepProps } from "./shared";

const OPTIONS: { value: VehiclePricingModel; label: string; body: string }[] = [
  {
    value: "rotaBazli",
    label: "Transfer (rota bazlı)",
    body: "Fiyat, nokta-nokta tarifesinden, harita alanı tarifesinden veya kilometre formülünden gelir. Araç; nokta, harita ve popüler rota fiyat matrislerinde görünür.",
  },
  {
    value: "saatlikKiralama",
    label: "Saatlik kiralama",
    body: "Fiyat, aracın saatlik ücreti ile alış-bırakış arasındaki süreden hesaplanır. Rota ve kilometre fiyatlandırması uygulanmaz.",
  },
];

/** 1.2 adım 1 — Fiyatlandırma Şekli: formun geri kalanını belirleyen ilk karar. */
export function PricingShapeStep({ vehicle, onChange }: VehicleStepProps) {
  return (
    <div className="flex flex-col gap-2">
      {OPTIONS.map((option) => (
        <label
          key={option.value}
          className={`flex flex-col gap-0.5 rounded-[var(--radius)] border px-3 py-2 ${
            vehicle.pricingModel === option.value ? "border-action bg-action-tint" : "border-line hover:border-ink-3"
          }`}
        >
          <span className="flex items-center gap-2">
            <input
              type="radio"
              name="pricingModel"
              checked={vehicle.pricingModel === option.value}
              onChange={() => onChange({ pricingModel: option.value })}
              className="h-4 w-4 accent-[var(--action-primary)]"
            />
            <span className="text-[length:var(--font-ui)] font-medium text-ink">{option.label}</span>
          </span>
          <span className="ms-6 text-[length:var(--font-ui-sm)] text-ink-3">{option.body}</span>
        </label>
      ))}
    </div>
  );
}
