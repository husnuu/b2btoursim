"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { BoatStatusBadge } from "@/components/primitives/BoatStatusBadge";
import { useToast } from "@/components/primitives/Toast";
import { boatCompletionPct, type BoatDraft } from "@/lib/boat";
import { useBoatCatalog } from "@/lib/boat-store";
import { BasicsStep } from "./steps/BasicsStep";
import { TechnicalSpecsStep } from "./steps/TechnicalSpecsStep";
import { DescriptionStep } from "./steps/DescriptionStep";
import { MediaStep } from "./steps/MediaStep";
import { IncludesSafetyStep } from "./steps/IncludesSafetyStep";
import { CaptainStep } from "./steps/CaptainStep";
import { PricingStep } from "./steps/PricingStep";
import { BookingProcessStep } from "./steps/BookingProcessStep";
import { CancellationStep } from "./steps/CancellationStep";
import { CustomerInfoStep } from "./steps/CustomerInfoStep";
import { ExtrasContractStep } from "./steps/ExtrasContractStep";
import { SummaryStep } from "./steps/SummaryStep";

type GroupId = "detaylar" | "kaptanFiyat" | "rezervasyon";
type StepId =
  | "baslik-kategori"
  | "teknik-ozellikler"
  | "aciklama"
  | "fotograf-video"
  | "dahil-guvenlik"
  | "kaptan-secenegi"
  | "fiyatlandirma"
  | "rezervasyon-sureci"
  | "iptal-iade"
  | "musteri-bilgileri"
  | "ekstralar-sozlesme";

const GROUPS: { id: GroupId; label: string }[] = [
  { id: "detaylar", label: "Tekne Detayları" },
  { id: "kaptanFiyat", label: "Kaptan ve Fiyatlandırma" },
  { id: "rezervasyon", label: "Rezervasyon Bilgileri" },
];

const STEPS: { id: StepId; groupId: GroupId; label: string }[] = [
  { id: "baslik-kategori", groupId: "detaylar", label: "Başlık ve Kategori" },
  { id: "teknik-ozellikler", groupId: "detaylar", label: "Teknik Özellikler" },
  { id: "aciklama", groupId: "detaylar", label: "Açıklama ve Yanında Ne Getirmeli" },
  { id: "fotograf-video", groupId: "detaylar", label: "Fotoğraf / Video" },
  { id: "dahil-guvenlik", groupId: "detaylar", label: "Dahil Olanlar / Güvenlik" },
  { id: "kaptan-secenegi", groupId: "kaptanFiyat", label: "Kaptan Seçeneği" },
  { id: "fiyatlandirma", groupId: "kaptanFiyat", label: "Fiyatlandırma Modeli" },
  { id: "rezervasyon-sureci", groupId: "rezervasyon", label: "Rezervasyon Süreci" },
  { id: "iptal-iade", groupId: "rezervasyon", label: "İptal ve İade Politikası" },
  { id: "musteri-bilgileri", groupId: "rezervasyon", label: "Müşteriden İstenecek Bilgiler" },
  { id: "ekstralar-sozlesme", groupId: "rezervasyon", label: "Ekstralar ve Sözleşme" },
];

function StepPanel({ stepId, boat, onChange }: { stepId: StepId; boat: BoatDraft; onChange: (patch: Partial<BoatDraft>) => void }) {
  switch (stepId) {
    case "baslik-kategori":
      return <BasicsStep boat={boat} onChange={onChange} />;
    case "teknik-ozellikler":
      return <TechnicalSpecsStep boat={boat} onChange={onChange} />;
    case "aciklama":
      return <DescriptionStep boat={boat} onChange={onChange} />;
    case "fotograf-video":
      return <MediaStep boat={boat} onChange={onChange} />;
    case "dahil-guvenlik":
      return <IncludesSafetyStep boat={boat} onChange={onChange} />;
    case "kaptan-secenegi":
      return <CaptainStep boat={boat} onChange={onChange} />;
    case "fiyatlandirma":
      return <PricingStep boat={boat} onChange={onChange} />;
    case "rezervasyon-sureci":
      return <BookingProcessStep boat={boat} onChange={onChange} />;
    case "iptal-iade":
      return <CancellationStep boat={boat} onChange={onChange} />;
    case "musteri-bilgileri":
      return <CustomerInfoStep boat={boat} onChange={onChange} />;
    case "ekstralar-sozlesme":
      return <ExtrasContractStep boat={boat} onChange={onChange} />;
    default:
      return null;
  }
}

export function BoatWizard({ id }: { id: string }) {
  const router = useRouter();
  const { boats, updateBoat } = useBoatCatalog();
  const { notify } = useToast();
  const [stepId, setStepId] = useState<StepId>("baslik-kategori");
  const [summary, setSummary] = useState(false);

  const boat = boats.find((b) => b.id === id);

  if (!boat) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-start gap-2 px-[var(--pad-x)] py-16">
        <h1 className="text-lg font-medium text-ink">Bu tekne bulunamadı</h1>
        <p className="max-w-[52ch] text-ink-2">Kayıt silinmiş veya bağlantı geçersiz olabilir.</p>
        <Button type="button" variant="primary" className="mt-3" onClick={() => router.push("/extranet/tekneler")}>
          Tekneler&apos;e dön
        </Button>
      </div>
    );
  }

  const onChange = (patch: Partial<BoatDraft>) => updateBoat(boat.id, patch);
  const pct = boatCompletionPct(boat);
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
      <nav className="hidden w-60 shrink-0 overflow-y-auto border-e border-line bg-surface py-3 md:block">
        {GROUPS.map((group) => (
          <div key={group.id} className="mb-3">
            <p className="px-3 pb-1 text-[length:var(--font-ui-xs)] font-medium uppercase tracking-wide text-ink-3">{group.label}</p>
            <ul>
              {STEPS.filter((s) => s.groupId === group.id).map((step) => {
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
          </div>
        ))}
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
              {boat.title || "Yeni tekne"}
              <BoatStatusBadge status={boat.status} />
            </p>
            <p className="tnum text-[length:var(--font-ui-sm)] text-ink-3">%{pct} Tamamlandı</p>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <Button type="button" size="sm" onClick={() => notify("Kaydedildi.")}>
              Kaydet
            </Button>
            <Button type="button" size="sm" onClick={() => router.push("/extranet/tekneler")}>
              Kapat ✕
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-[var(--pad-x)] py-5">
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-4 text-lg font-medium text-ink">{summary ? "Tamamlandı" : activeStep?.label}</h1>
            {summary ? <SummaryStep boat={boat} onChange={onChange} /> : <StepPanel stepId={stepId} boat={boat} onChange={onChange} />}
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
