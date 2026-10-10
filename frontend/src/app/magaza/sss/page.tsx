import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AGENCY } from "@/data/mock";
import { getPublishedSite } from "@/lib/site/load";
import { getStorefrontTenant } from "@/lib/storefront/tenant";
import { ContentPage } from "@/components/b2c/ContentPage";
import { SSS } from "@/components/b2c/SSS";
import { parseFaq } from "@/components/b2c/StorefrontHome";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getStorefrontTenant();
  return { title: `Sıkça sorulan sorular — ${tenant?.name ?? AGENCY.name}` };
}

/** Örnek vitrin (localhost) metni; kiracı vitrini bunu hiçbir koşulda basmaz. */
const DEMO_QA = [
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
    q: "Çocuk indirimi var mı?",
    a: "2–11 yaş arası çocuklar için indirimli fiyat uygulanır; 2 yaş altı bebekler çoğu turda ücretsizdir. Balon turlarında yaş sınırı operatöre göre değişir.",
  },
];

/**
 * SSS (VITRIN.md §4.6): kiracı vitrininde kaynak yalnız acentenin "Sıkça
 * sorulan sorular" bölümü. Bölüm yok ya da boşsa sayfa yok — altbilgi
 * bağlantısı da çizilmez. Başka bir firmanın şartları asla basılmaz.
 */
export default async function SssPage() {
  const tenant = await getStorefrontTenant();
  if (!tenant) {
    return (
      <ContentPage title="Sıkça sorulan sorular">
        <SSS sorular={DEMO_QA} compact />
      </ContentPage>
    );
  }
  const config = await getPublishedSite(tenant.id);
  const section = config.sections.find((s) => s.kind === "faq" && s.enabled);
  const sorular = section ? parseFaq(section.body) : [];
  if (!sorular.length) notFound();
  return (
    <ContentPage title={section?.title || "Sıkça sorulan sorular"} lead={section?.lead || undefined}>
      <SSS sorular={sorular} compact />
    </ContentPage>
  );
}
