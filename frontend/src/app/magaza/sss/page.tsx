import type { Metadata } from "next";
import { ContentPage } from "@/components/b2c/ContentPage";

export const metadata: Metadata = { title: "Sıkça sorulan sorular — Anadolu Seyahat" };

const QA = [
  {
    q: "Rezervasyonum ne zaman kesinleşir?",
    a: "Ödemeniz alındığı anda operatörün kontenjanı düşer ve onay e-postanız gönderilir. Anında onay etiketi taşımayan ürünlerde operatör onayı en geç 24 saat içinde gelir.",
  },
  {
    q: "Balon turu hava koşulları yüzünden iptal olursa ne oluyor?",
    a: "Uçuş güvenlik nedeniyle iptal edilirse ücretin tamamı iade edilir ya da uygun bir başka güne aktarılır. Karar sabah erken saatte operatör tarafından verilir ve size telefonla bildirilir.",
  },
  {
    q: "Turu kim yönetiyor?",
    a: "Turları bölgedeki yerel operatörler yürütür. Voucher'ınızda o turu yürüten operatörün adı ve iletişim bilgisi yazılıdır.",
  },
  {
    q: "Otelden alınıyor muyum?",
    a: "Göreme, Ürgüp ve Uçhisar bölgesindeki otellerden alış çoğu turda fiyata dahildir. Bölge dışındaysanız rezervasyon sırasında not bırakın, ek ücret çıkarsa önceden bildiririz.",
  },
  {
    q: "Çocuk indirimi var mı?",
    a: "2–11 yaş arası çocuklar için indirimli fiyat uygulanır; 2 yaş altı bebekler çoğu turda ücretsizdir. Balon turlarında yaş sınırı operatöre göre değişir.",
  },
];

export default function SssPage() {
  return (
    <ContentPage title="Sıkça sorulan sorular">
      <dl className="flex flex-col gap-6">
        {QA.map((item) => (
          <div key={item.q} className="border-b border-line pb-6 last:border-0">
            <dt className="font-dense text-lg font-medium text-ink">{item.q}</dt>
            <dd className="mt-2 max-w-[68ch] text-ink-2">{item.a}</dd>
          </div>
        ))}
      </dl>
    </ContentPage>
  );
}
