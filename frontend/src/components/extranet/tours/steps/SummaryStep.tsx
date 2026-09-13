"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { missingRequiredFields, tourCompletionPct } from "@/lib/tour";
import { useTourCatalog } from "@/lib/tour-store";
import { canTransition } from "@/lib/tour-status";
import { useToast } from "@/components/primitives/Toast";
import { syncTour } from "@/lib/tours/publish";
import { useState } from "react";
import type { StepProps } from "./shared";

const REQUIRED_LABELS: Record<string, string> = {
  title: "Başlık",
  slug: "Slug",
  description: "Açıklama",
  itinerary: "Gidilecek Yerler",
};

/** 5.7 Tamamlandı — özet, zorunlu alan kontrolü, Yayınla. */
export function SummaryStep({ draft }: StepProps) {
  const router = useRouter();
  const { updateTour } = useTourCatalog();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);

  const missing = missingRequiredFields(draft);
  const pct = tourCompletionPct(draft);
  const canGoLive = canTransition(draft.status, "aktif");
  const ready = missing.length === 0 && canGoLive;

  // Yayın sunucuya yazılmadan "yayınlandı" denmez: vitrin tabloyu okur.
  const publish = async () => {
    if (!ready || busy) return;
    setBusy(true);
    const result = await syncTour({ ...draft, status: "aktif" });
    setBusy(false);
    if (!result.ok) {
      notify(
        result.error === "23505"
          ? "Bu slug zaten kullanılıyor; başlık adımından değiştirin."
          : `Yayınlanamadı (${result.error}). Tekrar deneyin.`,
      );
      return;
    }
    updateTour(draft.id, { status: "aktif" });
    notify(`${draft.title || "Tur"} yayınlandı.`);
    router.push("/extranet/turlar");
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="tnum text-[length:var(--font-ui-sm)] text-ink-2">
          Tur içeriği %{pct} tamamlandı
        </p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sunken">
          <div
            className="h-full bg-action transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">
          Zorunlu alanlar
        </span>
        {Object.entries(REQUIRED_LABELS).map(([key, label]) => {
          const ok = !missing.includes(key);
          return (
            <div key={key} className="flex items-center gap-2 text-[length:var(--font-ui)]">
              <span aria-hidden="true" className={ok ? "text-success" : "text-danger"}>
                {ok ? "✓" : "✕"}
              </span>
              <span className={ok ? "text-ink-2" : "text-ink"}>{label}</span>
            </div>
          );
        })}
      </div>

      {!canGoLive ? (
        <p className="text-[length:var(--font-ui-sm)] text-ink-3">
          {draft.status === "aktif"
            ? "Bu tur zaten yayında."
            : "Arşivlenmiş turlar yeniden yayınlanamaz."}
        </p>
      ) : (
        <>
          {!ready && (
            <p className="text-[length:var(--font-ui-sm)] text-danger">
              Yayınlamadan önce eksik zorunlu alanları tamamlayın.
            </p>
          )}
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={!ready || busy}
            onClick={publish}
            className="self-start"
          >
            {busy ? "Yayınlanıyor" : "Yayınla"}
          </Button>
        </>
      )}
    </div>
  );
}
