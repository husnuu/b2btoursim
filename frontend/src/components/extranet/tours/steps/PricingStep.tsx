"use client";

import { NumberField, SelectField, TextField } from "@/components/primitives/Field";
import { Button } from "@/components/primitives/Button";
import { formatMoney } from "@/lib/i18n";
import type {
  AgeTier,
  AgeTierKey,
  DateBasedDiscount,
  SeasonalRule,
  TourDraft,
} from "@/lib/tour";
import type { StepProps } from "./shared";

const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];

const TIER_LABELS: Record<AgeTierKey, string> = {
  adult: "Yetişkin",
  child: "Çocuk",
  infant: "Bebek",
};

const PRICING_MODELS: { value: TourDraft["pricingModel"]; label: string; hint: string }[] = [
  { value: "kisiBasi", label: "Kişi Başı", hint: "Paylaşımlı turlar ve etkinlikler için." },
  { value: "grupBazli", label: "Grup Bazlı", hint: "Sabit bir grup büyüklüğüne tek fiyat." },
  { value: "konaklamaBazli", label: "Konaklama Bazlı", hint: "Konaklama Programı adımındaki planlara göre fiyatlama." },
];

/** 4.1 Fiyatlandırma Modeli ve Yaş Kademeleri. */
export function PricingStep({ draft, onChange }: StepProps) {
  const updateTier = (key: AgeTierKey, patch: Partial<AgeTier>) => {
    onChange({
      ageTiers: draft.ageTiers.map((tier) =>
        tier.key === key ? { ...tier, ...patch } : tier,
      ),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">
          Fiyatlandırma modeli
        </span>
        {PRICING_MODELS.map((model) => (
          <label
            key={model.value}
            className={`flex flex-col gap-0.5 rounded-[var(--radius)] border px-3 py-2 ${
              draft.pricingModel === model.value ? "border-action bg-action-tint" : "border-line hover:border-ink-3"
            }`}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="pricingModel"
                checked={draft.pricingModel === model.value}
                onChange={() => onChange({ pricingModel: model.value })}
                className="h-4 w-4 accent-[var(--action-primary)]"
              />
              <span className="text-[length:var(--font-ui)] font-medium text-ink">{model.label}</span>
            </span>
            <span className="ms-6 text-[length:var(--font-ui-sm)] text-ink-3">{model.hint}</span>
          </label>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Fiyat para birimi"
          value={draft.pricingCurrency}
          onChange={(e) => onChange({ pricingCurrency: e.target.value })}
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Alternatif gösterim para birimi"
          hint="Seçilirse fiyatlar parantez içinde de gösterilir; satış/ödemeyi etkilemez."
          value={draft.alternateDisplayCurrency ?? ""}
          onChange={(e) => onChange({ alternateDisplayCurrency: e.target.value || null })}
        >
          <option value="">Yok</option>
          {CURRENCIES.filter((c) => c !== draft.pricingCurrency).map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </SelectField>
      </div>

      {draft.pricingModel === "kisiBasi" && (
        <div className="flex flex-col gap-3">
          <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">
            Yaş kademesi tablosu
          </span>
          {draft.ageTiers.map((tier) => (
            <div
              key={tier.key}
              className="grid items-end gap-3 rounded-[var(--radius-lg)] border border-line p-3 sm:grid-cols-[auto_5rem_5rem_8rem]"
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={tier.enabled}
                  onChange={(e) => updateTier(tier.key, { enabled: e.target.checked })}
                  className="h-4 w-4 accent-[var(--action-primary)]"
                />
                <span className="text-[length:var(--font-ui)] text-ink">
                  {TIER_LABELS[tier.key]}
                </span>
              </label>
              <NumberField
                label="En az yaş"
                min={0}
                disabled={!tier.enabled}
                value={tier.minAge}
                onChange={(e) => updateTier(tier.key, { minAge: Number(e.target.value) })}
              />
              <NumberField
                label="En fazla yaş"
                min={0}
                disabled={!tier.enabled}
                value={tier.maxAge}
                onChange={(e) => updateTier(tier.key, { maxAge: Number(e.target.value) })}
              />
              <NumberField
                label="Birim fiyat"
                min={0}
                disabled={!tier.enabled}
                value={tier.price / 100}
                onChange={(e) =>
                  updateTier(tier.key, { price: Math.round(Number(e.target.value) * 100) })
                }
              />
            </div>
          ))}
          <p className="tnum text-[length:var(--font-ui-sm)] text-ink-3">
            Örnek etiket fiyatı:{" "}
            {formatMoney(
              draft.ageTiers.find((t) => t.key === "adult")?.price ?? 0,
              draft.pricingCurrency,
            )}
          </p>
        </div>
      )}

      {draft.pricingModel === "grupBazli" && (
        <div className="grid gap-3 rounded-[var(--radius-lg)] border border-line p-3 sm:grid-cols-3">
          <NumberField
            label="Min. grup büyüklüğü"
            min={1}
            value={draft.groupPricing?.minSize ?? 1}
            onChange={(e) =>
              onChange({
                groupPricing: {
                  minSize: Number(e.target.value),
                  maxSize: draft.groupPricing?.maxSize ?? 4,
                  price: draft.groupPricing?.price ?? 0,
                },
              })
            }
          />
          <NumberField
            label="Maks. grup büyüklüğü"
            min={1}
            value={draft.groupPricing?.maxSize ?? 4}
            onChange={(e) =>
              onChange({
                groupPricing: {
                  minSize: draft.groupPricing?.minSize ?? 1,
                  maxSize: Number(e.target.value),
                  price: draft.groupPricing?.price ?? 0,
                },
              })
            }
          />
          <NumberField
            label="Grup fiyatı"
            min={0}
            value={(draft.groupPricing?.price ?? 0) / 100}
            onChange={(e) =>
              onChange({
                groupPricing: {
                  minSize: draft.groupPricing?.minSize ?? 1,
                  maxSize: draft.groupPricing?.maxSize ?? 4,
                  price: Math.round(Number(e.target.value) * 100),
                },
              })
            }
          />
        </div>
      )}

      {draft.pricingModel === "konaklamaBazli" && (
        <div className="rounded-[var(--radius-lg)] border border-line p-3">
          {draft.accommodationPlans.length === 0 ? (
            <p className="text-[length:var(--font-ui-sm)] text-ink-3">
              Önce Konaklama Programı adımında en az bir plan tanımlayın.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {draft.accommodationPlans.map((plan) => (
                <li key={plan.id} className="flex items-center justify-between text-[length:var(--font-ui)] text-ink">
                  <span>{plan.name}</span>
                  <span className="tnum">{formatMoney(plan.price, draft.pricingCurrency)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

const emptySeasonalRule = (): SeasonalRule => ({
  id: crypto.randomUUID(),
  startDate: "",
  endDate: "",
  adjustmentPct: 0,
});

/** 4.2 Ücretlendirme Seçenekleri. */
export function TaxOptionsStep({ draft, onChange }: StepProps) {
  const updateDiscount = (patch: Partial<DateBasedDiscount>) => {
    const base: DateBasedDiscount = draft.dateBasedDiscount ?? {
      enabled: true,
      type: "earlyBird",
      daysThreshold: 14,
      discountPct: 10,
    };
    onChange({ dateBasedDiscount: { ...base, ...patch } });
  };

  const updateRule = (id: string, patch: Partial<SeasonalRule>) => {
    onChange({
      seasonalRules: draft.seasonalRules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={draft.taxIncludedInPrice}
          onChange={(e) => onChange({ taxIncludedInPrice: e.target.checked })}
          className="h-4 w-4 accent-[var(--action-primary)]"
        />
        <span className="text-[length:var(--font-ui)] text-ink">
          Vergi / hizmet bedeli fiyata dahil
        </span>
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">
            Sezonluk fiyat kuralları
          </span>
          <Button
            type="button"
            size="sm"
            onClick={() => onChange({ seasonalRules: [...draft.seasonalRules, emptySeasonalRule()] })}
          >
            Kural ekle
          </Button>
        </div>
        {draft.seasonalRules.map((rule) => (
          <div key={rule.id} className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_8rem_auto]">
            <TextField
              label="Başlangıç"
              type="date"
              value={rule.startDate}
              onChange={(e) => updateRule(rule.id, { startDate: e.target.value })}
            />
            <TextField
              label="Bitiş"
              type="date"
              value={rule.endDate}
              onChange={(e) => updateRule(rule.id, { endDate: e.target.value })}
            />
            <NumberField
              label="Ayarlama %"
              value={rule.adjustmentPct}
              onChange={(e) => updateRule(rule.id, { adjustmentPct: Number(e.target.value) })}
            />
            <Button
              type="button"
              variant="danger"
              onClick={() => onChange({ seasonalRules: draft.seasonalRules.filter((r) => r.id !== rule.id) })}
            >
              Kaldır
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-line p-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.dateBasedDiscount?.enabled ?? false}
            onChange={(e) => updateDiscount({ enabled: e.target.checked })}
            className="h-4 w-4 accent-[var(--action-primary)]"
          />
          <span className="text-[length:var(--font-ui)] text-ink">
            Erken rezervasyon / son dakika indirimi
          </span>
        </label>
        {draft.dateBasedDiscount?.enabled && (
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField
              label="Tip"
              value={draft.dateBasedDiscount.type}
              onChange={(e) => updateDiscount({ type: e.target.value as DateBasedDiscount["type"] })}
            >
              <option value="earlyBird">Erken rezervasyon</option>
              <option value="lastMinute">Son dakika</option>
            </SelectField>
            <NumberField
              label="Gün eşiği"
              min={0}
              value={draft.dateBasedDiscount.daysThreshold}
              onChange={(e) => updateDiscount({ daysThreshold: Number(e.target.value) })}
            />
            <NumberField
              label="İndirim %"
              min={0}
              max={100}
              value={draft.dateBasedDiscount.discountPct}
              onChange={(e) => updateDiscount({ discountPct: Number(e.target.value) })}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-line p-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.tieredGroupDiscount?.enabled ?? false}
            onChange={(e) =>
              onChange({
                tieredGroupDiscount: {
                  enabled: e.target.checked,
                  minSize: draft.tieredGroupDiscount?.minSize ?? 10,
                  discountPct: draft.tieredGroupDiscount?.discountPct ?? 10,
                },
              })
            }
            className="h-4 w-4 accent-[var(--action-primary)]"
          />
          <span className="text-[length:var(--font-ui)] text-ink">Kademeli grup indirimi</span>
        </label>
        {draft.tieredGroupDiscount?.enabled && (
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField
              label="Kişi sayısı eşiği"
              min={1}
              value={draft.tieredGroupDiscount.minSize}
              onChange={(e) =>
                onChange({
                  tieredGroupDiscount: { ...draft.tieredGroupDiscount!, minSize: Number(e.target.value) },
                })
              }
            />
            <NumberField
              label="İndirim %"
              min={0}
              max={100}
              value={draft.tieredGroupDiscount.discountPct}
              onChange={(e) =>
                onChange({
                  tieredGroupDiscount: { ...draft.tieredGroupDiscount!, discountPct: Number(e.target.value) },
                })
              }
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-line p-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.agencyNetPricing?.enabled ?? false}
            onChange={(e) =>
              onChange({
                agencyNetPricing: {
                  enabled: e.target.checked,
                  netPrice: draft.agencyNetPricing?.netPrice ?? 0,
                  markupPct: draft.agencyNetPricing?.markupPct ?? 15,
                },
              })
            }
            className="h-4 w-4 accent-[var(--action-primary)]"
          />
          <span className="text-[length:var(--font-ui)] text-ink">
            Acente özel net fiyat / markup
          </span>
        </label>
        {draft.agencyNetPricing?.enabled && (
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField
              label="Net fiyat"
              min={0}
              value={draft.agencyNetPricing.netPrice / 100}
              onChange={(e) =>
                onChange({
                  agencyNetPricing: {
                    ...draft.agencyNetPricing!,
                    netPrice: Math.round(Number(e.target.value) * 100),
                  },
                })
              }
            />
            <NumberField
              label="Kâr marjı %"
              min={0}
              value={draft.agencyNetPricing.markupPct}
              onChange={(e) =>
                onChange({
                  agencyNetPricing: { ...draft.agencyNetPricing!, markupPct: Number(e.target.value) },
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
