"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { missingRequiredFields, tourCompletionPct } from "@/lib/tour";
import { useTourCatalog } from "@/lib/tour-store";
import { canTransition } from "@/lib/tour-status";
import { useToast } from "@/components/primitives/Toast";
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
  const { setStatus } = useTourCatalog();
  const { notify } = useToast();

  const missing = missingRequiredFields(draft);
  const pct = tourCompletionPct(draft);
  const canGoLive = canTransition(draft.status, "aktif");
  const ready = missing.length === 0 && canGoLive;

  const publish = () => {
    if (!ready) return;
    setStatus(draft.id, "aktif");
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
            disabled={!ready}
            onClick={publish}
            className="self-start"
          >
            Yayınla
          </Button>
        </>
      )}
    </div>
  );
}
