import type { Metadata } from "next";
import { AGENCY } from "@/data/mock";
import { ContentPage } from "@/components/b2c/ContentPage";

export const metadata: Metadata = { title: "KVKK aydınlatma metni — Anadolu Seyahat" };

export default function KvkkPage() {
  return (
    <ContentPage
      title="KVKK aydınlatma metni"
      lead={`${AGENCY.name} olarak kişisel verilerinizi 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında işliyoruz. Bu metin hangi veriyi neden işlediğimizi anlatır.`}
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
