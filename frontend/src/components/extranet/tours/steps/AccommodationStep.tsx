"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { NumberField, TextField } from "@/components/primitives/Field";
import { formatMoney } from "@/lib/i18n";
import type { AccommodationPlan } from "@/lib/tour";
import type { StepProps } from "./shared";

/**
 * 3.4 Konaklama Programı — birden fazla otelde konaklanan çok günlük
 * turlar için opsiyonel. Tek otelli turlarda boş geçilebilir.
 */
export function AccommodationStep({ draft, onChange }: StepProps) {
  const [nightCount, setNightCount] = useState(2);

  const addPlan = () => {
    const plan: AccommodationPlan = {
      id: crypto.randomUUID(),
      name: `Plan ${draft.accommodationPlans.length + 1}`,
      nights: Array.from({ length: Math.max(1, nightCount) }, (_, i) => ({
        night: i + 1,
        accommodationName: "",
      })),
      price: 0,
    };
    onChange({ accommodationPlans: [...draft.accommodationPlans, plan] });
  };

  const updatePlan = (id: string, patch: Partial<AccommodationPlan>) => {
    onChange({
      accommodationPlans: draft.accommodationPlans.map((plan) =>
        plan.id === id ? { ...plan, ...patch } : plan,
      ),
    });
  };

  const updateNight = (planId: string, night: number, accommodationName: string) => {
    onChange({
      accommodationPlans: draft.accommodationPlans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              nights: plan.nights.map((n) =>
                n.night === night ? { ...n, accommodationName } : n,
              ),
            }
          : plan,
      ),
    });
  };

  const removePlan = (id: string) => {
    onChange({ accommodationPlans: draft.accommodationPlans.filter((plan) => plan.id !== id) });
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[length:var(--font-ui-sm)] text-ink-3">
        Tek otelli turlarda bu adımı boş bırakabilirsiniz. Bir plan
        tanımlarsanız, Fiyatlandırma adımında &quot;Konaklama Bazlı&quot; model
        seçilerek bu planlara özel fiyat girilebilir.
      </p>

      <div className="flex items-end gap-2">
        <NumberField
          label="Gece sayısı"
          min={1}
          value={nightCount}
          onChange={(e) => setNightCount(Number(e.target.value))}
          className="w-32"
        />
        <Button type="button" onClick={addPlan}>
          Plan ekle
        </Button>
      </div>

      {draft.accommodationPlans.map((plan) => (
        <div key={plan.id} className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line p-3">
          <div className="flex items-end gap-2">
            <TextField
              label="Plan adı"
              value={plan.name}
              onChange={(e) => updatePlan(plan.id, { name: e.target.value })}
            />
            <NumberField
              label="Plan fiyatı"
              min={0}
              value={plan.price / 100}
              onChange={(e) => updatePlan(plan.id, { price: Math.round(Number(e.target.value) * 100) })}
              className="w-32"
            />
            <Button type="button" variant="danger" onClick={() => removePlan(plan.id)}>
              Planı kaldır
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {plan.nights.map((night) => (
              <div key={night.night} className="flex items-center gap-2">
                <span className="tnum w-16 shrink-0 text-[length:var(--font-ui-sm)] text-ink-3">
                  {night.night}. gece
                </span>
                <input
                  value={night.accommodationName}
                  onChange={(e) => updateNight(plan.id, night.night, e.target.value)}
                  placeholder="Otel adı / konaklama tipi"
                  className="h-8 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5
                             text-[length:var(--font-ui-sm)] text-ink outline-none placeholder:text-ink-3 focus:border-action"
                />
              </div>
            ))}
          </div>
          <p className="tnum text-[length:var(--font-ui-sm)] text-ink-3">
            {formatMoney(plan.price)}
          </p>
        </div>
      ))}
    </div>
  );
}
