import { t } from "@/lib/i18n";
import {
  CONTACT_EMAIL,
  CONTACT_LINES,
  isPlaceholder,
  telHref,
} from "@/config/contact";

/**
 * Üç hat, koyu kapanış bandında.
 *
 * Ziyaretçi hangisini arayacağına saniyede karar vermeli: etiket önce,
 * numara büyük ve tabular, çalışma saati altında. Numaralar tıklanabilir
 * (`tel:`) ve dokunma hedefi mobilde 44px'in altına düşmüyor.
 */
export function ContactLines() {
  return (
    <div className="w-full lg:max-w-sm">
      <h3 className="font-dense text-[length:var(--font-ui-sm)] text-ink-2">
        {t("site.contact.title")}
      </h3>

      <ul className="mt-2 border-t border-line">
        {CONTACT_LINES.map((line) => {
          const pending = isPlaceholder(line.number);
          const content = (
            <>
              <span className="flex flex-col">
                <span className="text-[length:var(--font-ui-sm)] text-ink-2">
                  {line.label}
                </span>
                <span
                  className={`tnum font-dense text-[length:calc(var(--font-ui)*1.45)] font-semibold tracking-tight ${
                    pending ? "text-ink-3" : "text-ink"
                  }`}
                >
                  {pending ? t("site.contact.pending") : line.number}
                </span>
              </span>
              <span className="shrink-0 self-end text-[length:var(--font-ui-sm)] text-ink-2">
                {line.hours}
              </span>
            </>
          );

          return (
            <li key={line.id} className="border-b border-line">
              {pending ? (
                <div className="flex items-baseline justify-between gap-4 py-3">
                  {content}
                </div>
              ) : (
                <a
                  data-touch-target
                  href={telHref(line.number)}
                  className="flex items-baseline justify-between gap-4 py-3
                             transition-colors hover:bg-action-tint"
                >
                  {content}
                </a>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[length:var(--font-ui-sm)] text-ink-2">
        {t("site.contact.email")}{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
        >
          {CONTACT_EMAIL}
        </a>
      </p>
    </div>
  );
}
