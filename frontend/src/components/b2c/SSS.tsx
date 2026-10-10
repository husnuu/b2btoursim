import { Plus } from "lucide-react";

export type Soru = { q: string; a: string };

/**
 * SSS akordeonu (VITRIN.md §4.6, Seyyah vitrin): yerel `<details>/<summary>`,
 * aynı `name` ile tek açık. JavaScript olmadan çalışır, klavyeyle gezilir.
 * Artı simgesi açıkta 45° döner ve aksan rengine boyanır. Kaynak her zaman
 * acentenin `faq` bölümü; mock metin yok.
 */
export function SSS({ sorular, compact = false, name = "vitrin-sss" }: { sorular: Soru[]; compact?: boolean; name?: string }) {
  if (!sorular.length) return null;
  return (
    <div className={compact ? "border-t border-line" : "border-t-2 border-ink"}>
      {sorular.map((s) => (
        <details key={s.q} name={name} className="group border-b border-line">
          <summary
            className={`flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-ink [&::-webkit-details-marker]:hidden ${
              compact ? "py-4 text-[length:var(--font-ui)]" : "py-5 text-lg"
            }`}
          >
            {s.q}
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sunken text-ink transition-all duration-300 group-open:rotate-45 group-open:bg-highlight group-open:text-on-highlight">
              <Plus className="size-4" />
            </span>
          </summary>
          <p className="max-w-2xl pb-5 leading-relaxed text-ink-2">{s.a}</p>
        </details>
      ))}
    </div>
  );
}
