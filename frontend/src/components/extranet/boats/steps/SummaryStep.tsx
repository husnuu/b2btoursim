"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { syncBoat } from "@/lib/boats/publish";
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
  const { updateBoat } = useBoatCatalog();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);

  const missing = missingBoatFields(boat);
  const pct = boatCompletionPct(boat);
  const canGoLive = canTransition(boat.status, "aktif");
  const ready = missing.length === 0 && canGoLive;

  // Yayın sunucuya yazılmadan "yayınlandı" denmez: vitrin tabloyu okur.
  const publish = async () => {
    if (!ready || busy) return;
    setBusy(true);
    const result = await syncBoat({ ...boat, status: "aktif" });
    setBusy(false);
    if (!result.ok) {
      notify(
        result.error === "23505"
          ? "Bu slug zaten kullanılıyor; başlık adımından değiştirin."
          : result.error === "23514"
            ? "Yayın için fiyat ve kaptan bilgisi eksik."
            : `Yayınlanamadı (${result.error}).`,
      );
      return;
    }
    updateBoat(boat.id, { status: "aktif" });
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
          <Button type="button" variant="primary" size="lg" disabled={!ready || busy} onClick={publish} className="self-start">
            {busy ? "Yayınlanıyor" : "Yayınla"}
          </Button>
        </>
      )}
    </div>
  );
}
