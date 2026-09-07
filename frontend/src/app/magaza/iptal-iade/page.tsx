import type { Metadata } from "next";
import { ContentPage } from "@/components/b2c/ContentPage";

export const metadata: Metadata = { title: "İptal ve iade koşulları — Anadolu Seyahat" };

export default function IptalIadePage() {
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
