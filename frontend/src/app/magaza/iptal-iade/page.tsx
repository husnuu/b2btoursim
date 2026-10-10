import type { Metadata } from "next";
import { AGENCY } from "@/data/mock";
import { notFound } from "next/navigation";
import { getPublishedSite } from "@/lib/site/load";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { LegalPage } from "@/components/b2c/LegalPage";
import { ContentPage } from "@/components/b2c/ContentPage";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getStorefrontTenant();
  return { title: `İptal ve iade koşulları — ${tenant?.name ?? AGENCY.name}` };
}

function Demo() {
  return (
    <ContentPage
      title="İptal ve iade koşulları"
      lead="Her ürünün iptal koşulu farklıdır ve rezervasyon sayfasında, sepette ve voucher'ınızda açıkça yazılıdır."
    >
      <h2>Ücretsiz iptal</h2>
      <p>
        &quot;24 saat öncesine kadar ücretsiz&quot; ibaresi taşıyan turlarda,
        belirtilen süreye kadar yapılan iptallerde ücretin tamamı iade edilir.
        İade, ödemeyi yaptığınız karta 5–10 iş günü içinde geçer.
      </p>
      <h2>İade edilmeyen ürünler</h2>
      <p>
        &quot;İade edilmez&quot; ibaresi taşıyan ürünlerde iptal durumunda geri
        ödeme yapılamaz. Bu ürünler genellikle indirimli kontenjanlardır ve
        bu koşul satın alma öncesinde gösterilir.
      </p>
      <h2>Operatör kaynaklı iptaller</h2>
      <p>
        Hava koşulları, yetersiz katılım ya da güvenlik nedeniyle operatör
        turu iptal ederse, koşul ne olursa olsun ücretin tamamı iade edilir
        veya uygun bir başka tarihe aktarılır. Seçim sizindir.
      </p>
      <h2>Kısmi iptal</h2>
      <p>
        Grup rezervasyonlarında katılımcı sayısını azaltmak isterseniz,
        ürünün iptal süresi içinde kalan katılımcılar için düzenleme
        yapılabilir; iade yalnızca çıkarılan katılımcılar için hesaplanır.
      </p>
    </ContentPage>
  );
}

/**
 * Kiracı vitrininde metin acentenin kendi yazdığıdır (`SiteConfig.pages`,
 * VITRIN.md §4.6); boşsa sayfa yok ve altbilgi bağlantısı çizilmez.
 * Örnek vitrin (localhost) yukarıdaki metni basar.
 */
export default async function IptalIadePage() {
  const tenant = await getStorefrontTenant();
  if (!tenant) return <Demo />;
  const config = await getPublishedSite(tenant.id);
  const body = config.pages.iptalIade.trim();
  if (!body) notFound();
  return <LegalPage title="İptal ve iade koşulları" body={body} />;
}
