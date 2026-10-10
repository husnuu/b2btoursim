/**
 * Acentenin kendi görseli olmadığında kullanılan stok fotoğraflar (Unsplash
 * lisansı, `public/images`). Kahraman ve "hakkımızda" bandı buradan beslenir;
 * ilan kartları ASLA stok görsel basmaz — ürünün fotoğrafı değilse yanıltır.
 * Acente `media_asset` yüklediğinde kendi kapakları öne geçer.
 */
export type StockPhoto = { url: string; alt: string };

export const STOCK_HERO: StockPhoto[] = [
  { url: "/images/v/oludeniz.jpg", alt: "Ölüdeniz koyu ve turkuaz deniz" },
  { url: "/images/balon.jpg", alt: "Kapadokya'da sıcak hava balonları" },
  { url: "/images/v/efes.jpg", alt: "Efes'te Celsus Kütüphanesi" },
];

export const STOCK_ABOUT: StockPhoto[] = [
  { url: "/images/v/alacati.jpg", alt: "Alaçatı sokakları" },
  { url: "/images/v/bodrum-2.jpg", alt: "Bodrum kıyısı" },
];
