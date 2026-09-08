"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { useToast } from "@/components/primitives/Toast";
import { missingVillaFields, villaCompletionPct } from "@/lib/villa";
import { canTransition } from "@/lib/villa-status";
import { useVillaCatalog } from "@/lib/villa-store";
import type { VillaStepProps } from "./shared";

const REQUIRED_LABELS: Record<string, string> = {
  title: "Başlık",
  slug: "Slug",
  regions: "Bölgeler",
  capacity: "Kapasite",
};

/** 5.4 Tamamlandı (Önerilen) — Tur/Tekne'deki SummaryStep ile aynı desen. */
export function SummaryStep({ villa }: VillaStepProps) {
  const router = useRouter();
  const { setVillaStatus } = useVillaCatalog();
  const { notify } = useToast();

  const missing = missingVillaFields(villa);
  const pct = villaCompletionPct(villa);
  const canGoLive = canTransition(villa.status, "aktif");
  const ready = missing.length === 0 && canGoLive;

  const publish = () => {
    if (!ready) return;
    setVillaStatus(villa.id, "aktif");
    notify(`${villa.title || "Villa"} yayınlandı.`);
    router.push("/extranet/villalar");
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="tnum text-[length:var(--font-ui-sm)] text-ink-2">Villa içeriği %{pct} tamamlandı</p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sunken">
          <div className="h-full bg-action transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">Zorunlu alanlar</span>
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
        {villa.images.length < 5 && (
          <p className="text-[length:var(--font-ui-sm)] text-warning">
            Önerilen: en az 5 fotoğraf ({villa.images.length} yüklendi) — yayınlamayı engellemez.
          </p>
        )}
      </div>

      {!canGoLive ? (
        <p className="text-[length:var(--font-ui-sm)] text-ink-3">{villa.status === "aktif" ? "Bu villa zaten yayında." : "Arşivlenmiş villalar yeniden yayınlanamaz."}</p>
      ) : (
        <>
          {!ready && <p className="text-[length:var(--font-ui-sm)] text-danger">Yayınlamadan önce eksik zorunlu alanları tamamlayın.</p>}
          <Button type="button" variant="primary" size="lg" disabled={!ready} onClick={publish} className="self-start">
            Yayınla
          </Button>
        </>
      )}
    </div>
  );
}
