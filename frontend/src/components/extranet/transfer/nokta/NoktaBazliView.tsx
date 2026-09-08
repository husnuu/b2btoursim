"use client";

import { useState } from "react";
import { useTransferCatalog } from "@/lib/transfer-store";
import { PointsLibrary } from "./PointsLibrary";
import { PriceMatrixEditor } from "./PriceMatrixEditor";
import { PointBookingSearch } from "./PointBookingSearch";
import { PopularRoutesManager } from "../shared/PopularRoutesManager";
import { TimeMarginRules } from "../shared/TimeMarginRules";

const TABS = [
  { id: "noktalar", label: "Araç Noktaları" },
  { id: "fiyatlandirma", label: "Araç Nokta Fiyatlandırma" },
  { id: "populer-rotalar", label: "Araç Popüler Rotalar" },
  { id: "saat-marjlari", label: "Saat Marjları" },
  { id: "rezervasyon", label: "Nokta İle Rezervasyon" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function NoktaBazliView() {
  const { points } = useTransferCatalog();
  const [tab, setTab] = useState<TabId>("noktalar");
  const locations = points.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-[var(--pad-x)] py-2.5">
        <h1 className="mb-2 font-dense text-base font-medium text-ink">Model A — Nokta Bazlı Transfer</h1>
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full border px-3 py-1 text-[length:var(--font-ui-sm)] ${
                tab === t.id ? "border-action bg-action text-on-action" : "border-line-strong text-ink-2 hover:border-ink-3"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[var(--pad-x)] py-5">
        <div className="mx-auto max-w-2xl">
          {tab === "noktalar" && <PointsLibrary />}
          {tab === "fiyatlandirma" && <PriceMatrixEditor />}
          {tab === "populer-rotalar" && (
            <PopularRoutesManager
              kind="point"
              locations={locations}
              emptyLocationsHint="Önce Araç Noktaları'na en az iki nokta ekleyin."
            />
          )}
          {tab === "saat-marjlari" && <TimeMarginRules scope="point" locations={locations} />}
          {tab === "rezervasyon" && <PointBookingSearch />}
        </div>
      </div>
    </div>
  );
}
