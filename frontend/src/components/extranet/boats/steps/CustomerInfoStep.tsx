import type { BoatStepProps } from "./shared";

/** 5.3 Müşteriden İstenecek Bilgiler. */
export function CustomerInfoStep({ boat, onChange }: BoatStepProps) {
  const bareboatRelevant = boat.captainOption !== "kaptanli";

  return (
    <div className="flex flex-col gap-5">
      {bareboatRelevant && (
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={boat.requireCaptainLicense} onChange={(e) => onChange({ requireCaptainLicense: e.target.checked })} className="h-4 w-4 accent-[var(--action-primary)]" />
            <span className="text-[length:var(--font-ui)] text-ink">Kaptanlık Belgesi zorunlu (Bareboat)</span>
          </label>
          <p className="ms-6 text-[length:var(--font-ui-sm)] text-ink-3">Ehliyet/lisans numarası + belge fotoğrafı; tedarikçi onayı olmadan rezervasyon kesinleşmez.</p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={boat.collectPassengerList} onChange={(e) => onChange({ collectPassengerList: e.target.checked })} className="h-4 w-4 accent-[var(--action-primary)]" />
          <span className="text-[length:var(--font-ui)] text-ink">Yolcu Listesi topla</span>
        </label>
        <p className="ms-6 text-[length:var(--font-ui-sm)] text-ink-3">Kapasiteyi aşmamak ve liman otoritesine bildirim için ad-soyad listesi.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={boat.collectEmergencyContact} onChange={(e) => onChange({ collectEmergencyContact: e.target.checked })} className="h-4 w-4 accent-[var(--action-primary)]" />
          <span className="text-[length:var(--font-ui)] text-ink">Acil Durum İletişim Bilgisi topla</span>
        </label>
        <p className="ms-6 text-[length:var(--font-ui-sm)] text-ink-3">Deniz güvenliği için önerilir.</p>
      </div>
    </div>
  );
}
