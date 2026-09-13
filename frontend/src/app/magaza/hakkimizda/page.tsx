import type { Metadata } from "next";
import { AGENCY } from "@/data/mock";
import { t } from "@/lib/i18n";
import { getStorefrontProfile } from "@/lib/storefront/profile";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { ContentPage } from "@/components/b2c/ContentPage";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getStorefrontTenant();
  return { title: `Hakkımızda — ${tenant?.name ?? AGENCY.name}` };
}

/** Kiracı vitrininde metin acentenin kendi yazdığıdır; boşsa tek cümle. */
export default async function HakkimizdaPage() {
  const tenant = await getStorefrontTenant();
  const profile = tenant ? await getStorefrontProfile(tenant.id) : null;
  const name = tenant?.name ?? AGENCY.name;

  if (tenant) {
    return (
      <ContentPage title="Hakkımızda" lead={profile?.about || t("b2c.aboutDefault", { name })}>
        {profile?.tursabNo && <p>{t("b2c.tursab", { no: profile.tursabNo })}</p>}
        {profile?.address && <p>{profile.address}</p>}
      </ContentPage>
    );
  }

  return (
    <ContentPage
      title="Hakkımızda"
      lead={`${name}, Kapadokya ve çevresinde yerel operatörlerin ürünlerini doğrudan satan TÜRSAB belgeli bir seyahat acentesidir.`}
    >
      <p>
        Sattığımız her turu bizzat çalıştığımız operatörlerden alıyoruz.
        Aracı zinciri kısa olduğu için hem fiyat daha makul kalıyor hem de
        bir aksilik olduğunda doğrudan sahadaki ekibe ulaşabiliyoruz.
      </p>
      <h2>Nasıl çalışıyoruz</h2>
      <p>
        Rezervasyonunuz alındığında operatör kontenjanı anında düşüyor ve
        size voucher gönderiliyor. Voucher üzerinde buluşma noktası, saat ve
        operatörün telefon numarası yazılı olur.
      </p>
      <h2>Belgelerimiz</h2>
      <p>
        TÜRSAB üyelik belgemiz ve zorunlu seyahat sigortası poliçemiz
        ofisimizde ve talep üzerine dijital olarak paylaşılır.
      </p>
    </ContentPage>
  );
}
