import type { Metadata } from "next";
import { AGENCY } from "@/data/mock";
import { ContentPage } from "@/components/b2c/ContentPage";

export const metadata: Metadata = { title: "Hakkımızda — Anadolu Seyahat" };

export default function HakkimizdaPage() {
  return (
    <ContentPage
      title="Hakkımızda"
      lead={`${AGENCY.name}, Kapadokya ve çevresinde yerel operatörlerin ürünlerini doğrudan satan TÜRSAB belgeli bir seyahat acentesidir.`}
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
