import type { Metadata } from "next";
import { AGENCY } from "@/data/mock";
import { notFound } from "next/navigation";
import { getPublishedSite } from "@/lib/site/load";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { LegalPage } from "@/components/b2c/LegalPage";
import { ContentPage } from "@/components/b2c/ContentPage";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getStorefrontTenant();
  return { title: `KVKK aydınlatma metni — ${tenant?.name ?? AGENCY.name}` };
}

function Demo() {
  const name = AGENCY.name;
  return (
    <ContentPage
      title="KVKK aydınlatma metni"
      lead={`${name} olarak kişisel verilerinizi 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında işliyoruz. Bu metin hangi veriyi neden işlediğimizi anlatır.`}
    >
      <h2>İşlenen veriler</h2>
      <p>
        Rezervasyon için ad soyad, e-posta ve telefon bilgisi; bazı turlarda
        operatörün talebi üzerine yaş bilgisi. Kart bilgileriniz sistemimize
        hiçbir zaman kaydedilmez; ödeme sağlayıcısının döndürdüğü referans
        numarası saklanır.
      </p>
      <h2>İşleme amacı</h2>
      <p>
        Rezervasyonun oluşturulması, operatöre iletilmesi, voucher
        gönderimi, iptal ve iade işlemleri ile yasal saklama yükümlülüğü.
      </p>
      <h2>Aktarım</h2>
      <p>
        Katılımcı bilgileri yalnızca turu yürüten operatöre, yalnızca turun
        gerçekleşmesi için gereken kadarıyla aktarılır. Pazarlama amaçlı
        üçüncü taraflarla paylaşım yapılmaz.
      </p>
      <h2>Saklama süresi</h2>
      <p>
        Muhasebe ve vergi mevzuatı gereği rezervasyon kayıtları 10 yıl
        saklanır. Bu sürenin sonunda kayıtlar silinir veya anonimleştirilir.
      </p>
      <h2>Haklarınız</h2>
      <p>
        Verilerinize erişme, düzeltilmesini veya silinmesini isteme
        haklarınız için iletişim sayfasındaki e-posta adresine
        başvurabilirsiniz. Başvurular en geç 30 gün içinde yanıtlanır.
      </p>
    </ContentPage>
  );
}

/**
 * Kiracı vitrininde metin acentenin kendi yazdığıdır (`SiteConfig.pages`,
 * VITRIN.md §4.6); boşsa sayfa yok ve altbilgi bağlantısı çizilmez.
 * Örnek vitrin (localhost) yukarıdaki metni basar.
 */
export default async function KvkkPage() {
  const tenant = await getStorefrontTenant();
  if (!tenant) return <Demo />;
  const config = await getPublishedSite(tenant.id);
  const body = config.pages.kvkk.trim();
  if (!body) notFound();
  return <LegalPage title="KVKK aydınlatma metni" body={body} />;
}
