import type { VillaStepProps } from "./shared";

/** 5.3 Müşteriden İstenilecek Bilgiler (Önerilen — Simetrik/Önerilen). */
export function CustomerInfoStep({ villa, onChange }: VillaStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={villa.collectEstimatedArrival} onChange={(e) => onChange({ collectEstimatedArrival: e.target.checked })} className="h-4 w-4 accent-[var(--action-primary)]" />
          <span className="text-[length:var(--font-ui)] text-ink">Tahmini Varış Saati topla</span>
        </label>
        <p className="ms-6 text-[length:var(--font-ui-sm)] text-ink-3">Check-in koordinasyonu için müşteriden istenir.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={villa.collectGuestBreakdown} onChange={(e) => onChange({ collectGuestBreakdown: e.target.checked })} className="h-4 w-4 accent-[var(--action-primary)]" />
          <span className="text-[length:var(--font-ui)] text-ink">Misafir Sayısı Dökümü topla</span>
        </label>
        <p className="ms-6 text-[length:var(--font-ui-sm)] text-ink-3">Yetişkin/çocuk sayısı — kapasite doğrulaması için.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={villa.collectSpecialRequests} onChange={(e) => onChange({ collectSpecialRequests: e.target.checked })} className="h-4 w-4 accent-[var(--action-primary)]" />
          <span className="text-[length:var(--font-ui)] text-ink">Özel İstekler topla</span>
        </label>
        <p className="ms-6 text-[length:var(--font-ui-sm)] text-ink-3">Serbest metin — kutlama, erişilebilirlik ihtiyacı vb.</p>
      </div>
    </div>
  );
}
