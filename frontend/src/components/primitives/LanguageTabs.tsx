import { Button } from "./Button";

type Lang = "tr" | "en";

/**
 * TR/EN sekmesi — Bölüm 6 "Çoklu Dil Otomatik Çeviri". EN sekmesindeyken
 * "AI ile çevir" ve varsa "Temizle" aksiyonları görünür.
 */
export function LanguageTabs({
  lang,
  onLangChange,
  hasTranslation,
  translating,
  onTranslate,
  onClear,
}: {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  hasTranslation: boolean;
  translating: boolean;
  onTranslate: () => void;
  onClear: () => void;
}) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <div className="flex rounded-[var(--radius)] border border-line-strong p-0.5">
        {(["tr", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onLangChange(l)}
            className={`rounded-[2px] px-2 py-0.5 text-[length:var(--font-ui-sm)] font-medium uppercase ${
              lang === l ? "bg-action text-on-action" : "text-ink-3 hover:text-ink"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      {lang === "en" && (
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={onTranslate} disabled={translating}>
            {translating ? "Çevriliyor…" : hasTranslation ? "Yeniden çevir (AI)" : "İngilizce'ye çevir (AI)"}
          </Button>
          {hasTranslation && (
            <Button type="button" size="sm" variant="ghost" onClick={onClear}>
              Alternatif dilleri temizle
            </Button>
          )}
        </div>
      )}
      {lang === "en" && (
        <span className="text-[length:var(--font-ui-xs)] text-ink-3">
          Otomatik çeviri taslaktır, yayınlamadan önce gözden geçirin.
        </span>
      )}
    </div>
  );
}
