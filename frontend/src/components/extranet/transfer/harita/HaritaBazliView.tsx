"use client";

import { useState } from "react";
import { useTransferCatalog } from "@/lib/transfer-store";
import { ZonesLibrary } from "./ZonesLibrary";
import { ZonePriceEditor } from "./ZonePriceEditor";
import { ZoneBookingSearch } from "./ZoneBookingSearch";
import { PopularRoutesManager } from "../shared/PopularRoutesManager";
import { TimeMarginRules } from "../shared/TimeMarginRules";

const TABS = [
  { id: "alanlar", label: "Harita Alanları" },
  { id: "fiyatlandirma", label: "Harita Alanı Fiyatlandırma" },
  { id: "populer-rotalar", label: "Popüler Harita Rotaları" },
  { id: "saat-marjlari", label: "Saat Marjları" },
  { id: "rezervasyon", label: "Haritadan Rezervasyon" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Model B — Faz3, plan Varsayım 1'deki basitleştirilmiş simülasyonla. */
export function HaritaBazliView() {
  const { mapZones } = useTransferCatalog();
  const [tab, setTab] = useState<TabId>("alanlar");
  const locations = mapZones.map((z) => ({ id: z.id, name: z.name }));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-[var(--pad-x)] py-2.5">
        <h1 className="mb-1 font-dense text-base font-medium text-ink">Model B — Harita Bazlı Transfer</h1>
        <p className="mb-2 text-[length:var(--font-ui-sm)] text-ink-3">
          Faz3 · gerçek harita/geocoding altyapısı olmadan basitleştirilmiş simülasyon.
        </p>
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
          {tab === "alanlar" && <ZonesLibrary />}
          {tab === "fiyatlandirma" && <ZonePriceEditor />}
          {tab === "populer-rotalar" && (
            <PopularRoutesManager kind="zone" locations={locations} emptyLocationsHint="Önce Harita Alanları'na en az iki bölge ekleyin." />
          )}
          {tab === "saat-marjlari" && <TimeMarginRules scope="zone" locations={locations} />}
          {tab === "rezervasyon" && <ZoneBookingSearch />}
        </div>
      </div>
    </div>
  );
}
