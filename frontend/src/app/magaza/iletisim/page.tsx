import type { Metadata } from "next";
import { CONTACT_EMAIL, CONTACT_LINES, isPlaceholder, telHref } from "@/config/contact";
import { t } from "@/lib/i18n";
import { ContentPage } from "@/components/b2c/ContentPage";

export const metadata: Metadata = { title: "İletişim — Anadolu Seyahat" };

export default function IletisimPage() {
  return (
    <ContentPage
      title="İletişim"
      lead="Rezervasyonunuzla ilgili her konuda ulaşabilirsiniz. Seyahat günü acil durumlar için nöbetçi hattımız 24 saat açıktır."
    >
      <ul className="border-t border-line">
        {CONTACT_LINES.map((line) => {
          const pending = isPlaceholder(line.number);
          return (
            <li
              key={line.id}
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line py-4"
            >
              <span className="flex flex-col">
                <span className="text-[length:var(--font-ui-sm)] text-ink-2">
                  {line.label}
                </span>
                {pending ? (
                  <span className="tnum font-dense text-xl font-semibold text-ink-3">
                    {t("site.contact.pending")}
                  </span>
                ) : (
                  <a
                    href={telHref(line.number)}
                    className="tnum font-dense text-xl font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
                  >
                    {line.number}
                  </a>
                )}
              </span>
              <span className="text-[length:var(--font-ui-sm)] text-ink-2">
                {line.hours}
              </span>
            </li>
          );
        })}
      </ul>

      <p>
        E-posta:{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
        >
          {CONTACT_EMAIL}
        </a>
      </p>
      <p>Adres: Aydınlı Mah., Göreme, Nevşehir</p>
    </ContentPage>
  );
}
