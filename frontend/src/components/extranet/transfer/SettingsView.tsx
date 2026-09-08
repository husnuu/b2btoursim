"use client";

import { SelectField } from "@/components/primitives/Field";
import { useToast } from "@/components/primitives/Toast";
import { useTransferCatalog } from "@/lib/transfer-store";
import type { BookingApprovalMode, TransferSettings } from "@/lib/transfer";

const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];

const TEMPLATES: { id: TransferSettings["cancellationTemplate"]; label: string }[] = [
  { id: "esnek", label: "Esnek" },
  { id: "orta", label: "Orta" },
  { id: "kati", label: "Katı" },
  { id: "ozel", label: "Özel" },
];

/** Bölüm 6 — Transfer Ayarları. */
export function SettingsView() {
  const { settings, updateSettings } = useTransferCatalog();
  const { notify } = useToast();

  const save = (patch: Partial<TransferSettings>) => {
    updateSettings(patch);
    notify("Kaydedildi.");
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-[var(--pad-x)] py-5">
      <h1 className="font-dense text-base font-medium text-ink">Transfer Ayarları</h1>

      <SelectField
        label="Varsayılan para birimi"
        hint="Transfer modülü genelinde kullanılacak varsayılan satış para birimi."
        value={settings.defaultCurrency}
        onChange={(e) => save({ defaultCurrency: e.target.value })}
      >
        {CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </SelectField>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.tabVisibility.noktaIleAracKiralama}
          onChange={(e) => save({ tabVisibility: { noktaIleAracKiralama: e.target.checked } })}
          className="h-4 w-4 accent-[var(--action-primary)]"
        />
        <span className="text-[length:var(--font-ui)] text-ink">
          B2C vitrininde &quot;Nokta ile Araç Kiralama&quot; sekmesini göster
        </span>
      </label>
      <p className="-mt-3 text-[length:var(--font-ui-sm)] text-ink-3">
        Sekme açılmadan noktalar sitede görünmez; kendiliğinden açılmaz.
      </p>

      <SelectField
        label="Rezervasyon onay modu"
        value={settings.bookingApprovalMode}
        onChange={(e) => save({ bookingApprovalMode: e.target.value as BookingApprovalMode })}
      >
        <option value="otomatik">Otomatik onay</option>
        <option value="manuel">Manuel operasyon onayı</option>
      </SelectField>

      <div className="flex flex-col gap-2">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">İptal politikası (transfer geneli)</span>
        {TEMPLATES.map((template) => (
          <label
            key={template.id}
            className={`flex items-center gap-2 rounded-[var(--radius)] border px-3 py-2 ${
              settings.cancellationTemplate === template.id ? "border-action bg-action-tint" : "border-line hover:border-ink-3"
            }`}
          >
            <input
              type="radio"
              name="cancellationTemplate"
              checked={settings.cancellationTemplate === template.id}
              onChange={() => save({ cancellationTemplate: template.id })}
              className="h-4 w-4 accent-[var(--action-primary)]"
            />
            <span className="text-[length:var(--font-ui)] text-ink">{template.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
