import type { Metadata } from "next";
import { CONTACT_EMAIL, CONTACT_LINES, isPlaceholder, telHref } from "@/config/contact";
import { AGENCY } from "@/data/mock";
import { t } from "@/lib/i18n";
import { getStorefrontProfile } from "@/lib/storefront/profile";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { ContentPage } from "@/components/b2c/ContentPage";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getStorefrontTenant();
  return { title: `İletişim — ${tenant?.name ?? AGENCY.name}` };
}

export default async function IletisimPage() {
  const tenant = await getStorefrontTenant();

  // Kiracı vitrini: acentenin KENDİ iletişimi. Platform numaraları burada
  // görünmez — müşteri acenteyi arar, platformu değil.
  if (tenant) {
    const p = await getStorefrontProfile(tenant.id);
    const hasAny = p.contactPhone || p.contactEmail || p.address;
    return (
      <ContentPage title="İletişim" lead={hasAny ? undefined : t("b2c.contactPending")}>
        {p.contactPhone && (
          <p>
            <a href={telHref(p.contactPhone)} className="tnum font-dense text-xl font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              {p.contactPhone}
            </a>
            {p.phoneHours && <span className="ms-3 text-[length:var(--font-ui-sm)] text-ink-2">{p.phoneHours}</span>}
          </p>
        )}
        {p.contactEmail && (
          <p>
            E-posta: <a href={`mailto:${p.contactEmail}`} className="text-ink underline decoration-line-strong underline-offset-2">{p.contactEmail}</a>
          </p>
        )}
        {p.address && <p>{p.address}</p>}
        {p.tursabNo && <p className="text-[length:var(--font-ui-sm)] text-ink-3">{t("b2c.tursab", { no: p.tursabNo })}</p>}
      </ContentPage>
    );
  }

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
