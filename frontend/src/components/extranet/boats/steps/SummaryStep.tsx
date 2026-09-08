"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { useToast } from "@/components/primitives/Toast";
import { boatCompletionPct, missingBoatFields } from "@/lib/boat";
import { canTransition } from "@/lib/boat-status";
import { useBoatCatalog } from "@/lib/boat-store";
import type { BoatStepProps } from "./shared";

const REQUIRED_LABELS: Record<string, string> = {
  title: "Başlık",
  slug: "Slug",
  category: "Kategori",
  capacity: "Kapasite (Yasal)",
  marina: "Konum (Ana Marina)",
  description: "Açıklama",
  images: "Fotoğraf (en az 3)",
  captainFee: "Kaptan Ücreti",
};

/** Tamamlandı — Tur'daki SummaryStep ile aynı desen. */
export function SummaryStep({ boat }: BoatStepProps) {
  const router = useRouter();
  const { setBoatStatus } = useBoatCatalog();
  const { notify } = useToast();

  const missing = missingBoatFields(boat);
  const pct = boatCompletionPct(boat);
  const canGoLive = canTransition(boat.status, "aktif");
  const ready = missing.length === 0 && canGoLive;

  const publish = () => {
    if (!ready) return;
    setBoatStatus(boat.id, "aktif");
    notify(`${boat.title || "Tekne"} yayınlandı.`);
    router.push("/extranet/tekneler");
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="tnum text-[length:var(--font-ui-sm)] text-ink-2">Tekne içeriği %{pct} tamamlandı</p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sunken">
          <div className="h-full bg-action transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[length:var(--font-ui-sm)] font-medium text-ink">Zorunlu alanlar</span>
        {Object.entries(REQUIRED_LABELS)
          .filter(([key]) => key !== "captainFee" || boat.captainOption !== "kaptansiz")
          .map(([key, label]) => {
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
          {boat.status === "aktif" ? "Bu tekne zaten yayında." : "Arşivlenmiş tekneler yeniden yayınlanamaz."}
        </p>
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
