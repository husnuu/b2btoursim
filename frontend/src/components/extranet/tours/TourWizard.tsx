"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { SelectField } from "@/components/primitives/Field";
import { TourStatusBadge } from "@/components/primitives/TourStatusBadge";
import { useToast } from "@/components/primitives/Toast";
import { tourCompletionPct, type Difficulty, type TourDraft } from "@/lib/tour";
import { useTourCatalog } from "@/lib/tour-store";
import { t } from "@/lib/i18n";
import {
  WIZARD_GROUPS,
  WIZARD_STEPS,
  firstStepId,
  nextStepId,
  previousStepId,
  type WizardStepId,
} from "./wizardSteps";
import { BasicsStep } from "./steps/BasicsStep";
import { CategoryStep } from "./steps/CategoryStep";
import { ItineraryStep } from "./steps/ItineraryStep";
import { AccommodationStep } from "./steps/AccommodationStep";
import { DescriptionStep } from "./steps/DescriptionStep";
import { RichTextStep } from "./steps/RichTextStep";
import { MediaStep } from "./steps/MediaStep";
import { IncludesExcludesStep } from "./steps/IncludesExcludesStep";
import { MeetingPointStep } from "./steps/MeetingPointStep";
import { PricingStep, TaxOptionsStep } from "./steps/PricingStep";
import { PaymentModeStep, CancellationStep } from "./steps/BookingStep";
import { CustomerInfoStep } from "./steps/CustomerInfoStep";
import { SocialMediaStep } from "./steps/SocialMediaStep";
import { ExtrasStep } from "./steps/ExtrasStep";
import { ContractStep } from "./steps/ContractStep";
import { SummaryStep } from "./steps/SummaryStep";

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "kolay", label: "Kolay" },
  { value: "orta", label: "Orta" },
  { value: "zor", label: "Zor" },
  { value: "uzman", label: "Uzman" },
];

function DifficultyField({ draft, onChange }: { draft: TourDraft; onChange: (patch: Partial<TourDraft>) => void }) {
  return (
    <SelectField
      label="Zorluk Seviyesi"
      hint="Vitrinde rozet olarak gösterilir, arama filtresi olarak kullanılabilir."
      value={draft.difficulty ?? ""}
      onChange={(e) => onChange({ difficulty: (e.target.value || null) as Difficulty | null })}
    >
      <option value="">Seçilmedi</option>
      {DIFFICULTIES.map((d) => (
        <option key={d.value} value={d.value}>
          {d.label}
        </option>
      ))}
    </SelectField>
  );
}

function StepPanel({
  stepId,
  draft,
  onChange,
}: {
  stepId: WizardStepId;
  draft: TourDraft;
  onChange: (patch: Partial<TourDraft>) => void;
}) {
  switch (stepId) {
    case "baslik-ve-tur":
      return <BasicsStep draft={draft} onChange={onChange} />;
    case "kategori":
      return <CategoryStep draft={draft} onChange={onChange} />;
    case "tur-programi":
      return <ItineraryStep draft={draft} onChange={onChange} />;
    case "konaklama-programi":
      return <AccommodationStep draft={draft} onChange={onChange} />;
    case "aciklama":
      return <DescriptionStep draft={draft} onChange={onChange} />;
    case "fotograf-video":
      return <MediaStep draft={draft} onChange={onChange} />;
    case "dahil-olanlar":
      return <IncludesExcludesStep draft={draft} onChange={onChange} />;
    case "bilinmesi-gerekenler":
      return (
        <RichTextStep
          draft={draft}
          onChange={onChange}
          field="knowBeforeYouGo"
          label="Rezervasyon öncesi bilinmesi gerekenler"
          hint="Sağlık/uygunluk kısıtları, kıyafet kuralları, belge gereksinimleri."
          extra={<DifficultyField draft={draft} onChange={onChange} />}
        />
      );
    case "yaninda-ne-getirmeli":
      return (
        <RichTextStep
          draft={draft}
          onChange={onChange}
          field="whatToBring"
          label="Yanında ne getirmeli"
          hint="ör. güneş kremi, yürüyüş ayakkabısı, kimlik belgesi."
        />
      );
    case "bulusma-noktalari":
      return <MeetingPointStep draft={draft} onChange={onChange} />;
    case "fiyatlandirma":
      return <PricingStep draft={draft} onChange={onChange} />;
    case "ucretlendirme":
      return <TaxOptionsStep draft={draft} onChange={onChange} />;
    case "rezervasyon-odeme":
      return <PaymentModeStep draft={draft} onChange={onChange} />;
    case "iptal-iade":
      return <CancellationStep draft={draft} onChange={onChange} />;
    case "musteri-bilgi-formu":
      return <CustomerInfoStep draft={draft} onChange={onChange} />;
    case "sosyal-medya":
      return <SocialMediaStep draft={draft} onChange={onChange} />;
    case "tur-ekstralari":
      return <ExtrasStep draft={draft} onChange={onChange} />;
    case "sozlesme":
      return <ContractStep draft={draft} onChange={onChange} />;
    default:
      return null;
  }
}

export function TourWizard({ id }: { id: string }) {
  const router = useRouter();
  const { tours, updateTour } = useTourCatalog();
  const { notify } = useToast();
  const [activeStepId, setActiveStepId] = useState<WizardStepId>(firstStepId());
  const [summary, setSummary] = useState(false);

  const draft = tours.find((tour) => tour.id === id);

  if (!draft) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-start gap-2 px-[var(--pad-x)] py-16">
        <h1 className="text-lg font-medium text-ink">Bu tur bulunamadı</h1>
        <p className="max-w-[52ch] text-ink-2">
          Taslak silinmiş veya bağlantı geçersiz olabilir.
        </p>
        <Button
          type="button"
          variant="primary"
          className="mt-3"
          onClick={() => router.push("/extranet/turlar")}
        >
          Tüm Turlar&apos;a dön
        </Button>
      </div>
    );
  }

  const onChange = (patch: Partial<TourDraft>) => updateTour(draft.id, patch);
  const pct = tourCompletionPct(draft);
  const activeStep = WIZARD_STEPS.find((step) => step.id === activeStepId);

  const goTo = (stepId: WizardStepId) => {
    setSummary(false);
    setActiveStepId(stepId);
  };

  const goBack = () => {
    const prev = previousStepId(activeStepId);
    if (prev) goTo(prev);
  };

  const goNext = () => {
    const next = nextStepId(activeStepId);
    if (next) {
      goTo(next);
    } else {
      setSummary(true);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-3rem)]">
      <nav
        aria-label="Sihirbaz adımları"
        className="hidden w-60 shrink-0 overflow-y-auto border-e border-line bg-surface py-3 md:block"
      >
        {WIZARD_GROUPS.map((group) => (
          <div key={group.id} className="mb-3">
            <p className="px-3 pb-1 text-[length:var(--font-ui-xs)] font-medium uppercase tracking-wide text-ink-3">
              {t(group.labelKey)}
            </p>
            <ul>
              {WIZARD_STEPS.filter((step) => step.groupId === group.id).map((step) => {
                const active = !summary && step.id === activeStepId;
                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() => goTo(step.id)}
                      aria-current={active ? "step" : undefined}
                      className={`flex w-full items-center gap-2 border-s-2 px-3 py-1.5 text-start text-[length:var(--font-ui-sm)] ${
                        active
                          ? "border-s-action bg-action-tint font-medium text-ink"
                          : "border-s-transparent text-ink-2 hover:bg-sunken hover:text-ink"
                      }`}
                    >
                      {t(step.labelKey)}
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
            className={`flex w-full items-center gap-2 border-s-2 px-3 py-1.5 text-start text-[length:var(--font-ui-sm)] ${
              summary
                ? "border-s-action bg-action-tint font-medium text-ink"
                : "border-s-transparent text-ink-2 hover:bg-sunken hover:text-ink"
            }`}
          >
            Tamamlandı
          </button>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line px-[var(--pad-x)] py-2.5">
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-dense text-[length:var(--font-ui)] font-medium text-ink">
              {draft.title || "Yeni tur"}
              <TourStatusBadge status={draft.status} />
            </p>
            <p className="tnum text-[length:var(--font-ui-sm)] text-ink-3">
              %{pct} Tamamlandı
            </p>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <Button type="button" size="sm" onClick={() => notify("Kaydedildi.")}>
              Kaydet
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => router.push("/extranet/turlar")}
              aria-label="Kapat"
            >
              Kapat ✕
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-[var(--pad-x)] py-5">
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-4 text-lg font-medium text-ink">
              {summary ? "Tamamlandı" : activeStep ? t(activeStep.labelKey) : ""}
            </h1>
            {summary ? (
              <SummaryStep draft={draft} onChange={onChange} />
            ) : (
              <StepPanel stepId={activeStepId} draft={draft} onChange={onChange} />
            )}
          </div>
        </div>

        {!summary && (
          <footer className="flex items-center justify-between border-t border-line px-[var(--pad-x)] py-3">
            <Button type="button" onClick={goBack} disabled={!previousStepId(activeStepId)}>
              Geri
            </Button>
            <Button type="button" variant="primary" onClick={goNext}>
              {nextStepId(activeStepId) ? "Kaydet & Devam Et" : "İncele ve Yayınla"}
            </Button>
          </footer>
        )}
      </div>
    </div>
  );
}
