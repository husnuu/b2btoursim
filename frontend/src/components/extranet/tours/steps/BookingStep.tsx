import { Button } from "@/components/primitives/Button";
import { NumberField } from "@/components/primitives/Field";
import type { CancellationCutoff, CancellationTemplate, PaymentMode } from "@/lib/tour";
import type { StepProps } from "./shared";

const PAYMENT_MODES: { id: PaymentMode; label: string; hint: string }[] = [
  { id: "anindaTamOdeme", label: "Anında tam ödeme", hint: "Tutarın tamamı kart/online ödeme ile anında tahsil edilir." },
  { id: "kaporaBakiye", label: "Kapora + bakiye", hint: "Sabit tutar veya yüzde kapora alınır; kalan bakiye belirli bir tarihe kadar tahsil edilir." },
  { id: "sadeceRezervasyon", label: "Sadece rezervasyon (ödemesiz onay)", hint: "Kart bilgisi alınır ancak tahsilat yapılmaz." },
  { id: "cariHesap", label: "Cari hesaba yansıt (B2B)", hint: "Acente bakiyesinden/kredi limitinden düşülür." },
  { id: "yerindeOdeme", label: "Yerinde ödeme (Pay on arrival)", hint: "Tahsilat tur/hizmet sırasında rehber/operatör tarafından yapılır." },
  { id: "havaleEft", label: "Havale/EFT ile manuel onay", hint: "Müşteri havale yapar, dekont yüklenir, operasyon ekibi manuel onaylar." },
];

/** 5.1 Rezervasyon Süreci ve Ödeme Modu. */
export function PaymentModeStep({ draft, onChange }: StepProps) {
  return (
    <div className="flex flex-col gap-2">
      {PAYMENT_MODES.map((mode) => (
        <label
          key={mode.id}
          className={`flex flex-col gap-0.5 rounded-[var(--radius)] border px-3 py-2 ${
            draft.paymentMode === mode.id ? "border-action bg-action-tint" : "border-line hover:border-ink-3"
          }`}
        >
          <span className="flex items-center gap-2">
            <input
              type="radio"
              name="paymentMode"
              checked={draft.paymentMode === mode.id}
              onChange={() => onChange({ paymentMode: mode.id })}
              className="h-4 w-4 accent-[var(--action-primary)]"
            />
            <span className="text-[length:var(--font-ui)] font-medium text-ink">{mode.label}</span>
          </span>
          <span className="ms-6 text-[length:var(--font-ui-sm)] text-ink-3">{mode.hint}</span>
        </label>
      ))}
    </div>
  );
}

const TEMPLATES: { id: CancellationTemplate; label: string; body: string }[] = [
  { id: "esnek", label: "Esnek", body: "Tur tarihinden 24 saat öncesine kadar ücretsiz iptal." },
  { id: "orta", label: "Orta", body: "Tur tarihinden 3 gün öncesine kadar ücretsiz iptal." },
  { id: "kati", label: "Katı", body: "Tur tarihinden 7 gün öncesine kadar ücretsiz iptal." },
  { id: "ozel", label: "Özel", body: "Aşağıdaki serbest metinle kendi kuralınızı tanımlayın." },
];

/** 5.2 İptal ve İade Politikası. */
export function CancellationStep({ draft, onChange }: StepProps) {
  const addCutoff = () => {
    const cutoff: CancellationCutoff = { id: crypto.randomUUID(), daysBefore: 7, refundPct: 50 };
    onChange({ tieredCutoffs: [...draft.tieredCutoffs, cutoff] });
  };

  const updateCutoff = (id: string, patch: Partial<CancellationCutoff>) => {
    onChange({
      tieredCutoffs: draft.tieredCutoffs.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const removeCutoff = (id: string) => {
    onChange({ tieredCutoffs: draft.tieredCutoffs.filter((c) => c.id !== id) });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {TEMPLATES.map((template) => (
          <label
            key={template.id}
            className={`flex flex-col gap-0.5 rounded-[var(--radius)] border px-3 py-2 ${
              draft.cancellationTemplate === template.id
                ? "border-action bg-action-tint"
                : "border-line hover:border-ink-3"
            }`}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="cancellationTemplate"
                checked={draft.cancellationTemplate === template.id}
                onChange={() => onChange({ cancellationTemplate: template.id })}
                className="h-4 w-4 accent-[var(--action-primary)]"
              />
              <span className="text-[length:var(--font-ui)] font-medium text-ink">
                {template.label}
              </span>
            </span>
            <span className="ms-6 text-[length:var(--font-ui-sm)] text-ink-3">
              {template.body}
            </span>
          </label>
        ))}
      </div>

      {draft.cancellationTemplate === "ozel" && (
        <textarea
          value={draft.customPolicyText}
          onChange={(e) => onChange({ customPolicyText: e.target.value })}
          rows={4}
          placeholder="Özel iptal/iade kuralınızı yazın."
          className="w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 py-2
                     text-[length:var(--font-ui)] text-ink outline-none placeholder:text-ink-3 focus:border-action"
        />
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">
            Zaman dilimli kesinti tablosu
          </span>
          <Button type="button" size="sm" onClick={addCutoff}>
            Kademe ekle
          </Button>
        </div>
        <p className="text-[length:var(--font-ui-sm)] text-ink-3">
          &quot;Tur tarihinden X gün öncesine kadar %Y iade&quot; kademeleri.
        </p>
        {draft.tieredCutoffs.map((cutoff) => (
          <div key={cutoff.id} className="grid items-end gap-2 sm:grid-cols-[8rem_8rem_auto]">
            <NumberField
              label="Gün önce"
              min={0}
              value={cutoff.daysBefore}
              onChange={(e) => updateCutoff(cutoff.id, { daysBefore: Number(e.target.value) })}
            />
            <NumberField
              label="İade %"
              min={0}
              max={100}
              value={cutoff.refundPct}
              onChange={(e) => updateCutoff(cutoff.id, { refundPct: Number(e.target.value) })}
            />
            <Button type="button" variant="danger" onClick={() => removeCutoff(cutoff.id)}>
              Kaldır
            </Button>
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={draft.noShowNoRefund}
          onChange={(e) => onChange({ noShowNoRefund: e.target.checked })}
          className="h-4 w-4 accent-[var(--action-primary)]"
        />
        <span className="text-[length:var(--font-ui)] text-ink">
          Katılımcı gelmezse (no-show) iade yapılmaz
        </span>
      </label>

      <p className="text-[length:var(--font-ui-sm)] text-ink-3">
        Otomatik iade tetikleme, gerçek bir ödeme/rezervasyon altyapısı
        bağlandığında bu politika limitleri üzerinden çalışacak şekilde
        eklenecektir; bu prototipte manuel işlem gerekir.
      </p>
    </div>
  );
}
