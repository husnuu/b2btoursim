"use client";

import { usePathname, useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

/**
 * Arama widget'ı sekmeleri — Sitemap Bölüm 5.2, ortak bileşen (MVP).
 *
 * Transfer ve uçuş Faz 2; sekmeler görünür ama devre dışı ve nedeni yazılı.
 * Yol haritasını gizlemek yerine göstermek, operatörün "acaba nerede?"
 * diye aramasını engelliyor.
 */
const TABS: {
  id: "tur" | "otel" | "transfer" | "ucus";
  label: MessageKey;
  phase2?: boolean;
}[] = [
  { id: "tur", label: "search.tabTour" },
  { id: "otel", label: "search.tabHotel" },
  { id: "transfer", label: "search.tabTransfer", phase2: true },
  { id: "ucus", label: "search.tabFlight", phase2: true },
];

export function SearchTabs({ active }: { active: "tur" | "otel" }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div role="tablist" aria-label={t("nav.search")} className="flex flex-wrap gap-1">
      {TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={selected}
            disabled={tab.phase2}
            title={tab.phase2 ? t("search.phaseTwo") : undefined}
            onClick={() => {
              if (tab.phase2) return;
              const qs = pathname.includes("/arama/") ? window.location.search : "";
              router.push(`/extranet/arama/${tab.id}${qs}`);
            }}
            className={`flex items-center gap-2 rounded-t-[var(--radius)] border-b-2 px-3 py-1.5
                        text-[length:var(--font-ui)] transition-colors ${
                          selected
                            ? "border-b-ink font-medium text-ink"
                            : tab.phase2
                              ? "cursor-not-allowed border-b-transparent text-ink-3"
                              : "border-b-transparent text-ink-2 hover:text-ink"
                        }`}
          >
            {t(tab.label)}
            {tab.phase2 && (
              <span className="rounded-[2px] border border-line-strong px-1 text-[length:var(--font-ui-xs)] text-ink-3">
                {t("search.phaseTwo")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
