"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { VillaStatusBadge } from "@/components/primitives/VillaStatusBadge";
import { useToast } from "@/components/primitives/Toast";
import { villaCompletionPct, type VillaDraft } from "@/lib/villa";
import { useVillaCatalog } from "@/lib/villa-store";
import { BasicsStep } from "./steps/BasicsStep";
import { CategoryPricingStep } from "./steps/CategoryPricingStep";
import { LocationStep } from "./steps/LocationStep";
import { GalleryStep } from "./steps/GalleryStep";
import { GeneralInfoStep } from "./steps/GeneralInfoStep";
import { ConditionsStep } from "./steps/ConditionsStep";
import { CancellationStep } from "./steps/CancellationStep";
import { BookingProcessStep } from "./steps/BookingProcessStep";
import { CustomerInfoStep } from "./steps/CustomerInfoStep";
import { SummaryStep } from "./steps/SummaryStep";

type StepId =
  | "ad-aciklama"
  | "kategori-fiyat"
  | "lokasyon"
  | "galeri"
  | "genel-bilgiler"
  | "kosullar"
  | "iptal-iade"
  | "rezervasyon-sureci"
  | "musteri-bilgileri";

/**
 * Gözlemlenen ekranda sihirbaz Tur/Tekne'deki gibi ayrı grup sekmelerine
 * bölünmüyor — sol menüde "Villa Detayları" başlığı altında tek, düz bir
 * 9 adımlık liste (bkz. Bölüm 1, Şekil 1.1). Bu yüzden burada da gruplama
 * yok, tek düz nav.
 */
const STEPS: { id: StepId; label: string }[] = [
  { id: "ad-aciklama", label: "Villa Adı ve Açıklama" },
  { id: "kategori-fiyat", label: "Kategori ve Fiyat Ayarları" },
  { id: "lokasyon", label: "Lokasyon ve İletişim" },
  { id: "galeri", label: "Galeri" },
  { id: "genel-bilgiler", label: "Villa Genel Bilgileri" },
  { id: "kosullar", label: "Villa İle İlgili Koşullar" },
  { id: "iptal-iade", label: "İptal ve İade Politikası" },
  { id: "rezervasyon-sureci", label: "Rezervasyon Süreci" },
  { id: "musteri-bilgileri", label: "Müşteriden İstenilecek Bilgiler" },
];

function StepPanel({ stepId, villa, onChange }: { stepId: StepId; villa: VillaDraft; onChange: (patch: Partial<VillaDraft>) => void }) {
  switch (stepId) {
    case "ad-aciklama":
      return <BasicsStep villa={villa} onChange={onChange} />;
    case "kategori-fiyat":
      return <CategoryPricingStep villa={villa} onChange={onChange} />;
    case "lokasyon":
      return <LocationStep villa={villa} onChange={onChange} />;
    case "galeri":
      return <GalleryStep villa={villa} onChange={onChange} />;
    case "genel-bilgiler":
      return <GeneralInfoStep villa={villa} onChange={onChange} />;
    case "kosullar":
      return <ConditionsStep villa={villa} onChange={onChange} />;
    case "iptal-iade":
      return <CancellationStep villa={villa} onChange={onChange} />;
    case "rezervasyon-sureci":
      return <BookingProcessStep villa={villa} onChange={onChange} />;
    case "musteri-bilgileri":
      return <CustomerInfoStep villa={villa} onChange={onChange} />;
    default:
      return null;
  }
}

export function VillaWizard({ id }: { id: string }) {
  const router = useRouter();
  const { villas, updateVilla } = useVillaCatalog();
  const { notify } = useToast();
  const [stepId, setStepId] = useState<StepId>("ad-aciklama");
  const [summary, setSummary] = useState(false);

  const villa = villas.find((v) => v.id === id);

  if (!villa) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-start gap-2 px-[var(--pad-x)] py-16">
        <h1 className="text-lg font-medium text-ink">Bu villa bulunamadı</h1>
        <p className="max-w-[52ch] text-ink-2">Kayıt silinmiş veya bağlantı geçersiz olabilir.</p>
        <Button type="button" variant="primary" className="mt-3" onClick={() => router.push("/extranet/villalar")}>
          Villalar&apos;a dön
        </Button>
      </div>
    );
  }

  const onChange = (patch: Partial<VillaDraft>) => updateVilla(villa.id, patch);
  const pct = villaCompletionPct(villa);
  const index = STEPS.findIndex((s) => s.id === stepId);
  const activeStep = STEPS[index];

  const goTo = (next: StepId) => {
    setSummary(false);
    setStepId(next);
  };
  const goBack = () => {
    if (index > 0) goTo(STEPS[index - 1].id);
  };
  const goNext = () => {
    if (index < STEPS.length - 1) goTo(STEPS[index + 1].id);
    else setSummary(true);
  };

  return (
    <div className="flex h-[calc(100dvh-3rem)]">
      <nav className="hidden w-64 shrink-0 overflow-y-auto border-e border-line bg-surface py-3 md:block">
        <p className="px-3 pb-1 text-[length:var(--font-ui-xs)] font-medium uppercase tracking-wide text-ink-3">Villa Detayları</p>
        <ul>
          {STEPS.map((step) => {
            const active = !summary && step.id === stepId;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => goTo(step.id)}
                  aria-current={active ? "step" : undefined}
                  className={`flex w-full items-center gap-2 border-s-2 px-3 py-1.5 text-start text-[length:var(--font-ui-sm)] ${active ? "border-s-action bg-action-tint font-medium text-ink" : "border-s-transparent text-ink-2 hover:bg-sunken hover:text-ink"}`}
                >
                  {step.label}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 border-t border-line pt-2">
          <button
            type="button"
            onClick={() => setSummary(true)}
            aria-current={summary ? "step" : undefined}
            className={`flex w-full items-center gap-2 border-s-2 px-3 py-1.5 text-start text-[length:var(--font-ui-sm)] ${summary ? "border-s-action bg-action-tint font-medium text-ink" : "border-s-transparent text-ink-2 hover:bg-sunken hover:text-ink"}`}
          >
            Tamamlandı
          </button>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line px-[var(--pad-x)] py-2.5">
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-dense text-[length:var(--font-ui)] font-medium text-ink">
              {villa.title || "Yeni villa"}
              <VillaStatusBadge status={villa.status} />
            </p>
            <p className="tnum text-[length:var(--font-ui-sm)] text-ink-3">%{pct} Tamamlandı</p>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <Button type="button" size="sm" onClick={() => notify("Kaydedildi.")}>
              Kaydet
            </Button>
            <Button type="button" size="sm" onClick={() => router.push("/extranet/villalar")}>
              Kapat ✕
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-[var(--pad-x)] py-5">
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-4 text-lg font-medium text-ink">{summary ? "Tamamlandı" : activeStep?.label}</h1>
            {summary ? <SummaryStep villa={villa} onChange={onChange} /> : <StepPanel stepId={stepId} villa={villa} onChange={onChange} />}
          </div>
        </div>

        {!summary && (
          <footer className="flex items-center justify-between border-t border-line px-[var(--pad-x)] py-3">
            <Button type="button" onClick={goBack} disabled={index === 0}>
              Geri
            </Button>
            <Button type="button" variant="primary" onClick={goNext}>
              {index < STEPS.length - 1 ? "Kaydet & Devam Et" : "İncele ve Yayınla"}
            </Button>
          </footer>
        )}
      </div>
    </div>
  );
}
