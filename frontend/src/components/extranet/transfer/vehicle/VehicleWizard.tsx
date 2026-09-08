"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { TransferVehicleStatusBadge } from "@/components/primitives/TransferVehicleStatusBadge";
import { useToast } from "@/components/primitives/Toast";
import { missingVehicleFields, type Vehicle } from "@/lib/transfer";
import { useTransferCatalog } from "@/lib/transfer-store";
import { PricingShapeStep } from "./steps/PricingShapeStep";
import { BasicsStep } from "./steps/BasicsStep";
import { FeaturesExtrasStep } from "./steps/FeaturesExtrasStep";
import { VehicleMediaStep } from "./steps/VehicleMediaStep";

const STEPS = [
  { id: "sekil", label: "Fiyatlandırma Şekli" },
  { id: "temel", label: "Başlık, Açıklama, Kapasite" },
  { id: "ozellik", label: "Özellikler ve Ekstralar" },
  { id: "medya", label: "Fotoğraf / Video" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function completionPct(vehicle: Vehicle): number {
  const checks = [
    vehicle.title.trim().length > 0,
    vehicle.description.trim().length > 0,
    vehicle.featureIds.length > 0 || vehicle.extraLinks.length > 0,
    vehicle.images.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function VehicleWizard({ id }: { id: string }) {
  const router = useRouter();
  const { vehicles, updateVehicle, setVehicleStatus } = useTransferCatalog();
  const { notify } = useToast();
  const [stepId, setStepId] = useState<StepId>("sekil");

  const vehicle = vehicles.find((v) => v.id === id);

  if (!vehicle) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-start gap-2 px-[var(--pad-x)] py-16">
        <h1 className="text-lg font-medium text-ink">Bu araç bulunamadı</h1>
        <p className="max-w-[52ch] text-ink-2">Kayıt silinmiş veya bağlantı geçersiz olabilir.</p>
        <Button type="button" variant="primary" className="mt-3" onClick={() => router.push("/extranet/transfer/araclar")}>
          Araçlar&apos;a dön
        </Button>
      </div>
    );
  }

  const onChange = (patch: Partial<Vehicle>) => updateVehicle(vehicle.id, patch);
  const pct = completionPct(vehicle);
  const index = STEPS.findIndex((s) => s.id === stepId);
  const missing = missingVehicleFields(vehicle);

  const finish = () => {
    if (missing.length > 0) return;
    if (vehicle.status !== "aktif") setVehicleStatus(vehicle.id, "aktif");
    notify(`${vehicle.title || "Araç"} kaydedildi.`);
    router.push("/extranet/transfer/araclar");
  };

  return (
    <div className="flex h-[calc(100dvh-3rem)]">
      <nav className="hidden w-56 shrink-0 overflow-y-auto border-e border-line bg-surface py-3 md:block">
        <p className="px-3 pb-1 text-[length:var(--font-ui-xs)] font-medium uppercase tracking-wide text-ink-3">
          Araç Oluşturma
        </p>
        <ul>
          {STEPS.map((step) => (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => setStepId(step.id)}
                aria-current={step.id === stepId ? "step" : undefined}
                className={`flex w-full items-center gap-2 border-s-2 px-3 py-1.5 text-start text-[length:var(--font-ui-sm)] ${
                  step.id === stepId
                    ? "border-s-action bg-action-tint font-medium text-ink"
                    : "border-s-transparent text-ink-2 hover:bg-sunken hover:text-ink"
                }`}
              >
                {step.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line px-[var(--pad-x)] py-2.5">
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-dense text-[length:var(--font-ui)] font-medium text-ink">
              {vehicle.title || "Yeni araç"}
              <TransferVehicleStatusBadge status={vehicle.status} />
            </p>
            <p className="tnum text-[length:var(--font-ui-sm)] text-ink-3">%{pct} Tamamlandı</p>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <Button type="button" size="sm" onClick={() => notify("Kaydedildi.")}>
              Kaydet
            </Button>
            <Button type="button" size="sm" onClick={() => router.push("/extranet/transfer/araclar")}>
              Kapat ✕
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-[var(--pad-x)] py-5">
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-4 text-lg font-medium text-ink">{STEPS[index].label}</h1>
            {stepId === "sekil" && <PricingShapeStep vehicle={vehicle} onChange={onChange} />}
            {stepId === "temel" && <BasicsStep vehicle={vehicle} onChange={onChange} />}
            {stepId === "ozellik" && <FeaturesExtrasStep vehicle={vehicle} onChange={onChange} />}
            {stepId === "medya" && <VehicleMediaStep vehicle={vehicle} onChange={onChange} />}
          </div>
        </div>

        <footer className="flex items-center justify-between border-t border-line px-[var(--pad-x)] py-3">
          <Button
            type="button"
            onClick={() => setStepId(STEPS[Math.max(0, index - 1)].id)}
            disabled={index === 0}
          >
            Geri
          </Button>
          {index < STEPS.length - 1 ? (
            <Button type="button" variant="primary" onClick={() => setStepId(STEPS[index + 1].id)}>
              Kaydet & Devam Et
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              {missing.length > 0 && (
                <span className="text-[length:var(--font-ui-sm)] text-danger">Araç Başlığı gerekli.</span>
              )}
              <Button type="button" variant="primary" size="lg" disabled={missing.length > 0} onClick={finish}>
                Kaydet ve Bitir
              </Button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
