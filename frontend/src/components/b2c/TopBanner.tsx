"use client";

import { notifyLocalChange, useLocalValue, writeLocal } from "@/lib/local-store";
import { t } from "@/lib/i18n";
import { IconX } from "./icons";

/**
 * Duyuru bandı (VITRIN.md §4, referans `TopBanner`). Metin `nav.announcement`.
 * Kapatma `localStorage`'da, anahtar metnin özetini içerir: acente metni
 * değiştirince band yeniden görünür. `useSyncExternalStore` üstünden okunur;
 * sunucu her zaman açık render eder, istemci gerçek değeri okur, hidrasyon
 * uyuşmazlığı olmaz. Önizlemede kapatılamaz.
 */
function hash(s: string): string {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h.toString(36);
}

export function TopBanner({ text, preview = false }: { text: string; preview?: boolean }) {
  const key = `vitrin.duyuru.${hash(text)}`;
  const dismissed = useLocalValue(key);
  if (!text.trim() || (!preview && dismissed === "1")) return null;

  return (
    <div className="bg-action text-on-action">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2 text-[length:var(--font-ui-sm)] font-medium">
        <p className="min-w-0 flex-1 truncate text-center sm:text-start">{text}</p>
        {!preview && (
          <button
            type="button"
            aria-label={t("b2c.announcement.close")}
            onClick={() => {
              writeLocal(key, "1");
              notifyLocalChange();
            }}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-on-action/15"
          >
            <IconX size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
