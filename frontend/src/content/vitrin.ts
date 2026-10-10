import type { StayInfo } from "@/lib/storefront/kart";
import type { Supplier } from "@/lib/types";

/**
 * Acente vitrini önizlemesi için örnek veriler.
 *
 * Acente kurgusaldır; ürünler, fiyatlar ve tedarikçi adları temsilidir.
 * Bilerek puan, yorum sayısı ya da müşteri yorumu YOK — yeni bir vitrinde
 * bunlar olmaz ve uydurulmamalıdır. Gerçek veriler Seyyah panelinden gelecek.
 */

export type Agency = { name: string; tagline: string; phone: string; email: string };

export const DEMO_AGENCY: Agency = {
  name: "Mavi Rota",
  tagline: "Turizm & Seyahat",
  phone: "+90 (000) 000 00 00",
  email: "info@ornek-acente.com",
};

export type CategoryKey = "tur" | "tekne" | "transfer" | "feribot" | "kultur" | "konaklama" | "vize";

export type VCategory = { key: CategoryKey; label: string; image: string };
export const ALL_CATEGORIES: VCategory[] = [
  { key: "tur", label: "Turlar & Aktiviteler", image: "/images/balon.jpg" },
  { key: "tekne", label: "Tekne & Yat", image: "/images/yat.jpg" },
  { key: "kultur", label: "Kültür & Müzeler", image: "/images/v/efes.jpg" },
  { key: "transfer", label: "Transferler", image: "/images/transfer.jpg" },
  { key: "feribot", label: "Feribot", image: "/images/feribot.jpg" },
  { key: "konaklama", label: "Konaklama", image: "/images/otel.jpg" },
  { key: "vize", label: "Vize", image: "/images/istanbul.jpg" },
];

export type Destination = { slug: string; name: string; image: string };
export const DEMO_DESTINATIONS: Destination[] = [
  { slug: "kapadokya", name: "Kapadokya", image: "/images/balon.jpg" },
  { slug: "istanbul", name: "İstanbul", image: "/images/istanbul.jpg" },
  { slug: "cesme", name: "Çeşme", image: "/images/v/alacati.jpg" },
  { slug: "fethiye", name: "Fethiye", image: "/images/v/oludeniz.jpg" },
  { slug: "bodrum", name: "Bodrum", image: "/images/v/bodrum.jpg" },
  { slug: "pamukkale", name: "Pamukkale", image: "/images/v/pamukkale-2.jpg" },
  { slug: "antalya", name: "Antalya", image: "/images/v/antalya.jpg" },
  { slug: "selcuk", name: "Selçuk – Efes", image: "/images/v/efes-2.jpg" },
];

export type DestinationSlug = string;

export type Badge = "Çok tercih edilen" | "Kaçırmayın" | "Yeni" | "Son yerler";

export type Product = {
  slug: string;
  title: string;
  city: DestinationSlug;
  category: CategoryKey;
  image: string;
  gallery: string[];
  summary: string;
  duration: string;
  languages: string[];
  badge?: Badge;
  instant: boolean;
  freeCancel: boolean;
  pickup?: boolean;
  options: { name: string; tickets: { label: string; price: number }[] }[];
  oldPrice?: number;
  highlights: string[];
  description: string;
  included: string[];
  excluded: string[];
  meeting: string;
  remember: string[];
  cancellation: string;
  supplier: string;
  chips: string[];
  itinerary?: { time: string; title: string; body: string }[];
  /** Kiracı vitrini, yalnız villa: ETS tarzı konaklama kartının alanları. */
  stay?: StayInfo;
  /** Kiracı vitrini: ürün kendi detay sayfasına gidiyorsa (tekne, villa…) tam yol. */
  href?: string;
  /** Kiracı vitrini: yalnız bu günler seçilebilir (kalkış takvimi). Yoksa örnek müsaitlik. */
  available?: string[];
  /** Kiracı vitrini: sepete eklenecek gerçek kalkışlar (yalnız ürün sayfasında dolar). */
  cart?: { productId: string; supplier: Supplier; marginPct: number; variants: { id: string; name: string; startsAt: string; net: number; currency: string }[] };
};

export const DEMO_PRODUCTS: Product[] = [
  {
    slug: "kapadokya-gun-dogumu-balon-turu",
    title: "Gün doğumunda sıcak hava balonu turu",
    city: "kapadokya",
    category: "tur",
    image: "/images/balon.jpg",
    gallery: ["/images/balon.jpg", "/images/v/pamukkale-2.jpg", "/images/kultur.jpg"],
    summary: "Peribacalarının üzerinde gün doğumunu izleyin; uçuş sonrası geleneksel kutlama ile.",
    duration: "3 saat (uçuş ~1 saat)",
    languages: ["Türkçe", "İngilizce"],
    badge: "Çok tercih edilen",
    instant: false,
    freeCancel: true,
    pickup: true,
    options: [
      { name: "Standart sepet (20 kişi)", tickets: [{ label: "Yetişkin", price: 7800 }, { label: "Çocuk (6–12)", price: 6200 }] },
      { name: "Konfor sepet (12 kişi)", tickets: [{ label: "Yetişkin", price: 10400 }, { label: "Çocuk (6–12)", price: 8600 }] },
    ],
    highlights: [
      "Göreme vadilerinin üzerinde gün doğumunu havadan izleyin",
      "Otelinizden alınış ve bırakılış dahil",
      "İnişte geleneksel uçuş kutlaması ve katılım belgesi",
    ],
    description:
      "Sabahın erken saatlerinde otelinizden alınarak kalkış alanına götürülürsünüz. Hafif bir kahvaltının ardından pilotunuzun güvenlik bilgilendirmesiyle sepete binersiniz. Yaklaşık bir saatlik uçuş boyunca Güvercinlik, Kızılçukur ve Aşk vadilerinin üzerinden geçer, peribacalarını gün ışığıyla birlikte izlersiniz. İnişte ekip, geleneksel kutlamayı yapar ve katılım belgenizi verir.",
    included: ["Otel alınış ve bırakılış", "Hafif kahvaltı", "Yaklaşık 1 saatlik uçuş", "Uçuş sigortası", "Katılım belgesi"],
    excluded: ["Kişisel harcamalar", "Fotoğraf ve video paketleri"],
    meeting: "Göreme ve Ürgüp bölgesindeki otellerden alınış yapılır. Alınış saati rezervasyondan sonra bildirilir.",
    remember: [
      "Uçuşlar hava koşullarına bağlıdır; iptal durumunda ücret iadesi ya da tarih değişikliği yapılır.",
      "Hamileler ve 6 yaş altı çocuklar katılamaz.",
      "Rahat ayakkabı ve katmanlı kıyafet önerilir.",
    ],
    cancellation: "Tur saatinden 48 saat öncesine kadar ücretsiz iptal.",
    supplier: "Göreme Balon Org. (örnek)",
    chips: ["Gün doğumu", "Otel transferi", "Kahvaltı dahil", "Fotoğraflık"],
    itinerary: [
      { time: "05:00", title: "Otelden alınış", body: "Ekibimiz sizi otelinizin önünden alır." },
      { time: "05:30", title: "Kahvaltı ve bilgilendirme", body: "Kalkış alanında hafif kahvaltı ve pilot brifingi." },
      { time: "06:00", title: "Uçuş", body: "Yaklaşık bir saat boyunca vadilerin üzerinde." },
      { time: "07:15", title: "İniş ve kutlama", body: "Geleneksel kutlama ve katılım belgesi." },
      { time: "08:00", title: "Otele dönüş", body: "Otelinize bırakılırsınız." },
    ],
  },
  {
    slug: "cesme-koylar-tekne-turu",
    title: "Koylar tekne turu, öğle yemeği dahil",
    city: "cesme",
    category: "tekne",
    image: "/images/tekne.jpg",
    gallery: ["/images/tekne.jpg", "/images/yat.jpg", "/images/v/alacati.jpg"],
    summary: "Çeşme'nin turkuaz koylarında yüzme molaları ve teknede öğle yemeği ile tam gün.",
    duration: "6 saat",
    languages: ["Türkçe", "İngilizce"],
    badge: "Kaçırmayın",
    instant: true,
    freeCancel: true,
    options: [{ name: "Günlük tur", tickets: [{ label: "Yetişkin", price: 1250 }, { label: "Çocuk (4–11)", price: 750 }] }],
    oldPrice: 1450,
    highlights: ["Dört farklı koyda yüzme molası", "Teknede taze hazırlanan öğle yemeği", "Güverte ve gölgelik oturma alanları"],
    description:
      "Çeşme limanından hareketle Aya Yorgi, Pırlanta ve Kum koylarına uğrayan rotada her durakta yaklaşık bir saatlik yüzme molası verilir. Öğle yemeği teknede servis edilir. Gün batımına doğru limana dönüş yapılır.",
    included: ["Tekne turu", "Öğle yemeği", "Kaptan ve mürettebat", "Can yeleği"],
    excluded: ["İçecekler", "Otel transferi"],
    meeting: "Çeşme Limanı, Kale önü tekne iskelesi. Kalkıştan 20 dakika önce hazır olunuz.",
    remember: ["Havlu, güneş kremi ve mayo getirin.", "Rüzgarlı havalarda rota kaptanın kararıyla değişebilir."],
    cancellation: "Tur gününden 24 saat öncesine kadar ücretsiz iptal.",
    supplier: "Ege Koyları Denizcilik (örnek)",
    chips: ["Yüzme molası", "Öğle yemeği", "Aile dostu"],
    itinerary: [
      { time: "10:30", title: "Limandan kalkış", body: "Çeşme Limanı, Kale önü iskelesi." },
      { time: "11:30", title: "Aya Yorgi Koyu", body: "İlk yüzme molası." },
      { time: "13:00", title: "Öğle yemeği", body: "Teknede servis." },
      { time: "14:00", title: "Pırlanta ve Kum koyları", body: "İki yüzme molası daha." },
      { time: "16:30", title: "Limana dönüş", body: "" },
    ],
  },
  {
    slug: "istanbul-havalimani-ozel-transfer",
    title: "İstanbul Havalimanı özel transfer",
    city: "istanbul",
    category: "transfer",
    image: "/images/transfer.jpg",
    gallery: ["/images/transfer.jpg", "/images/istanbul.jpg"],
    summary: "Uçağınız indiğinde isim tabelasıyla karşılanın; otelinize kadar özel araçla.",
    duration: "45–75 dk",
    languages: ["Türkçe", "İngilizce"],
    instant: true,
    freeCancel: true,
    pickup: true,
    options: [
      { name: "Sedan (1–3 kişi)", tickets: [{ label: "Araç", price: 2100 }] },
      { name: "Minivan (4–7 kişi)", tickets: [{ label: "Araç", price: 2900 }] },
    ],
    highlights: ["İsim tabelası ile karşılama", "Uçuş takibi; rötarda ek ücret yok", "Kapıdan kapıya özel araç"],
    description:
      "Rezervasyon sırasında uçuş numaranızı paylaşın; şoförünüz iniş saatini takip eder ve sizi gelen yolcu çıkışında isim tabelası ile karşılar. Araç yalnızca size aittir, ara durak yapılmaz.",
    included: ["Özel araç ve şoför", "Karşılama hizmeti", "Köprü ve otoyol ücretleri", "60 dk ücretsiz bekleme"],
    excluded: ["Bahşiş"],
    meeting: "İstanbul Havalimanı (IST) gelen yolcu çıkışı, buluşma noktası.",
    remember: ["Uçuş numaranızı rezervasyonda belirtin.", "Bagaj sayınızı araç seçiminde dikkate alın."],
    cancellation: "Transfer saatinden 24 saat öncesine kadar ücretsiz iptal.",
    supplier: "Boğaz VIP Transfer (örnek)",
    chips: ["Uçuş takibi", "Özel araç", "7/24"],
  },
  {
    slug: "cesme-sakiz-feribot",
    title: "Sakız Adası feribot bileti",
    city: "cesme",
    category: "feribot",
    image: "/images/feribot.jpg",
    gallery: ["/images/feribot.jpg", "/images/v/alacati-2.jpg"],
    summary: "Yaklaşık 45 dakikalık yolculukla Sakız Adası'na günübirlik ya da konaklamalı geçiş.",
    duration: "≈ 45 dk",
    languages: ["Türkçe", "İngilizce", "Yunanca"],
    badge: "Son yerler",
    instant: false,
    freeCancel: false,
    options: [
      { name: "Gidiş-dönüş", tickets: [{ label: "Yetişkin", price: 1640 }, { label: "Çocuk (0–11)", price: 980 }] },
      { name: "Tek yön", tickets: [{ label: "Yetişkin", price: 1050 }, { label: "Çocuk (0–11)", price: 620 }] },
    ],
    highlights: ["Hızlı ve konforlu geçiş", "Günübirlik ya da açık dönüş seçeneği", "Liman vergileri dahil"],
    description:
      "Çeşme Limanı'ndan kalkan feribot ile Sakız Adası'na geçiş yapın. Pasaport kontrolü için kalkıştan en az 60 dakika önce limanda olmanız gerekir. Dönüş tarihini rezervasyon sırasında seçebilirsiniz.",
    included: ["Feribot bileti", "Liman vergileri"],
    excluded: ["Araç geçişi", "Vize ücretleri"],
    meeting: "Çeşme Uluslararası Yolcu Limanı, check-in bankoları.",
    remember: ["Geçerli pasaport ve gerekiyorsa vize zorunludur.", "Kimlik bilgileriniz rezervasyonda eksiksiz olmalıdır."],
    cancellation: "Bu ürün için iade yapılmaz; tarih değişikliği tedarikçi onayına bağlıdır.",
    supplier: "Ege Hatları (örnek)",
    chips: ["Pasaport gerekli", "Gidiş-dönüş", "Liman vergisi dahil"],
  },
  {
    slug: "efes-antik-kent-rehberli-tur",
    title: "Antik kent ve Celsus Kütüphanesi rehberli tur",
    city: "selcuk",
    category: "kultur",
    image: "/images/v/efes.jpg",
    gallery: ["/images/v/efes.jpg", "/images/v/efes-2.jpg", "/images/kultur.jpg"],
    summary: "Celsus Kütüphanesi'nden Büyük Tiyatro'ya profesyonel rehber eşliğinde.",
    duration: "4 saat",
    languages: ["Türkçe", "İngilizce", "Almanca"],
    badge: "Çok tercih edilen",
    instant: true,
    freeCancel: true,
    options: [{ name: "Küçük grup (en fazla 15 kişi)", tickets: [{ label: "Yetişkin", price: 2450 }, { label: "Çocuk (7–12)", price: 1600 }] }],
    highlights: ["Profesyonel kokartlı rehber", "Giriş biletleri dahil", "Küçük gruplarla daha rahat gezi"],
    description:
      "Magnesia Kapısı'ndan başlayan turda Kuretler Caddesi, Hadrian Tapınağı, Celsus Kütüphanesi ve Büyük Tiyatro'yu rehberinizin anlatımıyla gezersiniz. Tur, Liman Caddesi çıkışında sona erer.",
    included: ["Rehberlik hizmeti", "Ören yeri giriş bileti", "Kulaklık sistemi"],
    excluded: ["Yamaç Evler giriş ücreti", "Öğle yemeği"],
    meeting: "Efes Antik Kenti, Üst Kapı (Magnesia Kapısı) bilet gişesi önü.",
    remember: ["Yazın şapka ve su getirin; gölge alan azdır.", "Zemin taşlık; rahat ayakkabı giyin."],
    cancellation: "Tur saatinden 24 saat öncesine kadar ücretsiz iptal.",
    supplier: "Antik Rota Rehberlik (örnek)",
    chips: ["Giriş dahil", "Rehberli", "Küçük grup"],
    itinerary: [
      { time: "09:00", title: "Magnesia Kapısı", body: "Rehberle buluşma ve giriş." },
      { time: "09:30", title: "Kuretler Caddesi", body: "Hadrian Tapınağı ve çeşmeler." },
      { time: "10:30", title: "Celsus Kütüphanesi", body: "Fotoğraf molası." },
      { time: "11:30", title: "Büyük Tiyatro", body: "Turun sona ermesi." },
    ],
  },
  {
    slug: "fethiye-oludeniz-tekne-turu",
    title: "Ölüdeniz ve 12 Adalar tekne turu",
    city: "fethiye",
    category: "tekne",
    image: "/images/v/oludeniz.jpg",
    gallery: ["/images/v/oludeniz.jpg", "/images/v/oludeniz-2.jpg", "/images/tekne.jpg"],
    summary: "Kelebekler Vadisi ve Mavi Mağara dahil, yüzme molalı tam gün tekne turu.",
    duration: "8 saat",
    languages: ["Türkçe", "İngilizce"],
    instant: true,
    freeCancel: true,
    options: [{ name: "Günlük tur", tickets: [{ label: "Yetişkin", price: 1480 }, { label: "Çocuk (4–11)", price: 900 }] }],
    oldPrice: 1700,
    highlights: ["Kelebekler Vadisi ve Mavi Mağara", "Beş yüzme molası", "Öğle yemeği dahil"],
    description:
      "Ölüdeniz'den kalkan tekneyle Kelebekler Vadisi, Mavi Mağara, Soğuk Su Koyu ve Deve Plajı'na uğrarsınız. Her durakta yüzme molası verilir; öğle yemeği teknede servis edilir.",
    included: ["Tekne turu", "Öğle yemeği", "Can yeleği"],
    excluded: ["İçecekler", "Kelebekler Vadisi giriş ücreti"],
    meeting: "Ölüdeniz Belcekız plajı tekne iskelesi.",
    remember: ["Kelebekler Vadisi giriş ücreti nakit alınır."],
    cancellation: "Tur gününden 24 saat öncesine kadar ücretsiz iptal.",
    supplier: "Likya Tekne (örnek)",
    chips: ["Yüzme molası", "Öğle yemeği", "Doğa"],
    itinerary: [
      { time: "10:00", title: "Ölüdeniz'den kalkış", body: "" },
      { time: "11:00", title: "Kelebekler Vadisi", body: "Yüzme ve kısa yürüyüş." },
      { time: "12:30", title: "Mavi Mağara", body: "" },
      { time: "13:30", title: "Öğle yemeği", body: "Teknede servis." },
      { time: "15:00", title: "Soğuk Su ve Deve Plajı", body: "Son yüzme molaları." },
      { time: "18:00", title: "Dönüş", body: "" },
    ],
  },
  {
    slug: "bodrum-ozel-gulet-kiralama",
    title: "Özel gulet kiralama, tam gün",
    city: "bodrum",
    category: "tekne",
    image: "/images/v/bodrum.jpg",
    gallery: ["/images/v/bodrum.jpg", "/images/yat.jpg", "/images/v/bodrum-2.jpg"],
    summary: "Yalnızca size ait bir gulet ile rotayı kaptanla birlikte belirleyin.",
    duration: "Tam gün (8 saat)",
    languages: ["Türkçe", "İngilizce"],
    badge: "Yeni",
    instant: false,
    freeCancel: true,
    options: [
      { name: "Gulet (12 kişiye kadar)", tickets: [{ label: "Tekne", price: 38500 }] },
      { name: "Motor yat (8 kişiye kadar)", tickets: [{ label: "Tekne", price: 52000 }] },
    ],
    highlights: ["Tekne tamamen size özel", "Rota esnek, kaptanla birlikte planlanır", "Öğle yemeği ve meşrubat dahil"],
    description:
      "Bodrum Marina'dan kalkan gulet ile Karaada, Akvaryum Koyu veya Orak Adası gibi rotalardan dilediğinizi seçin. Mürettebat gün boyu hizmetinizdedir; öğle yemeği teknede hazırlanır.",
    included: ["Kaptan ve mürettebat", "Yakıt", "Öğle yemeği", "Meşrubatlar"],
    excluded: ["Alkollü içecekler", "Marina ücretleri (varsa)"],
    meeting: "Bodrum Marina, iskele bilgisi rezervasyon onayında paylaşılır.",
    remember: ["Talep tedarikçi onayına bağlıdır; onay e-posta ile iletilir."],
    cancellation: "Kiralama tarihinden 7 gün öncesine kadar ücretsiz iptal.",
    supplier: "Halikarnas Yatçılık (örnek)",
    chips: ["Özel tekne", "Esnek rota", "Grup"],
  },
  {
    slug: "pamukkale-hierapolis-gunubirlik",
    title: "Pamukkale ve Hierapolis günübirlik tur",
    city: "pamukkale",
    category: "kultur",
    image: "/images/v/pamukkale-2.jpg",
    gallery: ["/images/v/pamukkale-2.jpg", "/images/v/pamukkale.jpg"],
    summary: "Beyaz travertenler ve antik Hierapolis; isteğe bağlı Antik Havuz.",
    duration: "10 saat",
    languages: ["Türkçe", "İngilizce"],
    instant: true,
    freeCancel: true,
    pickup: true,
    options: [{ name: "Otel transferli tur", tickets: [{ label: "Yetişkin", price: 2250 }, { label: "Çocuk (6–12)", price: 1400 }] }],
    highlights: ["Travertenlerde yürüyüş", "Hierapolis antik kenti", "Otel transferi ve öğle yemeği dahil"],
    description:
      "Sabah otelinizden alınarak Pamukkale'ye ulaşırsınız. Rehberinizle Hierapolis'in nekropolü, tiyatrosu ve Frontinus Caddesi'ni gezdikten sonra travertenlerde serbest zaman verilir.",
    included: ["Otel transferi", "Rehberlik", "Ören yeri girişi", "Öğle yemeği"],
    excluded: ["Antik Havuz giriş ücreti", "İçecekler"],
    meeting: "Bölgedeki otellerden alınış yapılır.",
    remember: ["Travertenlerde ayakkabı ile yürünmez; terlik getirin."],
    cancellation: "Tur gününden 24 saat öncesine kadar ücretsiz iptal.",
    supplier: "Denizli Kültür Turları (örnek)",
    chips: ["Otel transferi", "Öğle yemeği", "Rehberli"],
    itinerary: [
      { time: "07:30", title: "Otelden alınış", body: "" },
      { time: "10:30", title: "Hierapolis", body: "Nekropol, tiyatro ve Frontinus Caddesi." },
      { time: "13:00", title: "Öğle yemeği", body: "" },
      { time: "14:00", title: "Travertenler", body: "Serbest zaman." },
      { time: "17:30", title: "Dönüş", body: "" },
    ],
  },
  {
    slug: "istanbul-bogaz-gun-batimi-turu",
    title: "Boğaz'da gün batımı tekne turu",
    city: "istanbul",
    category: "tekne",
    image: "/images/istanbul.jpg",
    gallery: ["/images/istanbul.jpg", "/images/kultur.jpg"],
    summary: "Dolmabahçe'den Rumeli Hisarı'na, iki kıtanın arasında gün batımı.",
    duration: "2 saat",
    languages: ["Türkçe", "İngilizce"],
    instant: true,
    freeCancel: true,
    options: [{ name: "Paylaşımlı tur", tickets: [{ label: "Yetişkin", price: 950 }, { label: "Çocuk (4–11)", price: 600 }] }],
    oldPrice: 1100,
    highlights: ["Gün batımında Boğaz manzarası", "Sesli anlatım", "Çay ve ikram dahil"],
    description:
      "Kabataş'tan kalkan teknede Dolmabahçe Sarayı, Ortaköy Camii, Boğaziçi Köprüsü ve Rumeli Hisarı'nı denizden izlersiniz. Dönüşte şehir ışıkları yanarken iskeleye varılır.",
    included: ["Tekne turu", "Çay ve ikram", "Sesli anlatım"],
    excluded: ["Otel transferi"],
    meeting: "Kabataş iskelesi, tur tabelası önü.",
    remember: ["Kalkıştan 15 dakika önce iskelede olun."],
    cancellation: "Tur saatinden 24 saat öncesine kadar ücretsiz iptal.",
    supplier: "Boğaziçi Denizcilik (örnek)",
    chips: ["Gün batımı", "Şehir manzarası"],
    itinerary: [
      { time: "18:30", title: "Kabataş'tan kalkış", body: "" },
      { time: "19:00", title: "Ortaköy ve Boğaziçi Köprüsü", body: "" },
      { time: "19:30", title: "Rumeli Hisarı", body: "Gün batımı." },
      { time: "20:30", title: "Kabataş'a dönüş", body: "" },
    ],
  },
  {
    slug: "antalya-kaleici-butik-otel",
    title: "Kaleiçi'nde butik otel konaklaması",
    city: "antalya",
    category: "konaklama",
    image: "/images/otel.jpg",
    gallery: ["/images/otel.jpg", "/images/v/antalya.jpg", "/images/v/antalya-2.jpg"],
    summary: "Tarihi Kaleiçi'nde avlulu, havuzlu bir konakta kahvaltı dahil konaklama.",
    duration: "Gecelik",
    languages: ["Türkçe", "İngilizce", "Rusça"],
    instant: false,
    freeCancel: true,
    options: [
      { name: "Standart oda, kahvaltı dahil", tickets: [{ label: "Gece", price: 4200 }] },
      { name: "Deniz manzaralı oda", tickets: [{ label: "Gece", price: 5600 }] },
    ],
    highlights: ["Tarihi limana yürüme mesafesi", "Avlu ve açık havuz", "Serpme kahvaltı"],
    description:
      "Restore edilmiş Osmanlı konağında yer alan otel, Kaleiçi'nin dar sokakları arasında sakin bir avluya sahiptir. Yat limanına ve Hadrian Kapısı'na yürüme mesafesindedir.",
    included: ["Konaklama", "Kahvaltı", "Wi-Fi"],
    excluded: ["Konaklama vergisi", "Otopark"],
    meeting: "Kaleiçi, Antalya. Adres rezervasyon onayında paylaşılır.",
    remember: ["Giriş 14:00, çıkış 12:00.", "Kaleiçi'ne araç girişi kısıtlıdır."],
    cancellation: "Giriş tarihinden 3 gün öncesine kadar ücretsiz iptal.",
    supplier: "Kaleiçi Konak (örnek)",
    chips: ["Kahvaltı dahil", "Havuz", "Merkezi"],
  },
];

/** En düşük bilet fiyatı; fiyatı olmayan üründe (teklifle) null. */
export const fromPrice = (p: Product): number | null => {
  const prices = p.options.flatMap((o) => o.tickets.map((t) => t.price)).filter((x) => x > 0);
  return prices.length ? Math.min(...prices) : null;
};
export const destNameIn = (destinations: Destination[], slug: string) => destinations.find((d) => d.slug === slug)?.name ?? slug;
export const catLabel = (key: CategoryKey) => ALL_CATEGORIES.find((c) => c.key === key)!.label;
export const tl = (n: number | null) => (n == null ? "Teklifle" : "₺" + n.toLocaleString("tr-TR"));

export type Inspiration = { title: string; image: string; href: string };
export const DEMO_INSPIRATIONS: Inspiration[] = [
  { title: "Ege'de bir hafta: koydan koya", image: "/images/v/oludeniz-2.jpg", href: "/magaza/ara?kategori=tekne" },
  { title: "Antik kentler rotası", image: "/images/v/efes-2.jpg", href: "/magaza/ara?kategori=kultur" },
  { title: "Kapadokya'da gün doğumu", image: "/images/balon.jpg", href: "/magaza/ara?sehir=kapadokya" },
  { title: "Alaçatı sokaklarında hafta sonu", image: "/images/v/alacati-2.jpg", href: "/magaza/ara?sehir=cesme" },
];

export type Availability = "open" | "few" | "full" | "closed";

/**
 * Örnek müsaitlik: ürün + tarihten türetilen, her açılışta aynı sonucu veren
 * sahte değer. Canlı vitrinde Seyyah kontenjan verisinden gelecek.
 */
export function availability(slug: string, iso: string, available?: string[]): Availability {
  if (available) return available.includes(iso) ? "open" : "closed";
  let h = 0;
  for (const c of slug + iso) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const r = h % 20;
  if (r === 0) return "closed";
  if (r < 3) return "full";
  if (r < 7) return "few";
  return "open";
}

export type VitrinFaqItem = { q: string; a: string };
export const DEMO_FAQ: VitrinFaqItem[] = [
  { q: "Rezervasyonum ne zaman kesinleşir?", a: "“Anında onay” etiketli deneyimlerde rezervasyonunuz ödemeyle birlikte kesinleşir. Diğerlerinde tedarikçi müsaitliği kontrol eder ve onayı genellikle aynı gün e-postayla iletiriz." },
  { q: "İptal etmek istersem ne olur?", a: "Her deneyimin iptal koşulu ürün sayfasında yazar. Ücretsiz iptal süresi içinde iptal ederseniz ödemenizin tamamı iade edilir." },
  { q: "Voucher'ımı nasıl kullanırım?", a: "Onaydan sonra e-postanıza gelen mobil voucher'ı buluşma noktasında telefonunuzdan göstermeniz yeterli." },
  { q: "Grup ya da özel tur talebim var.", a: "Kalabalık gruplar ve kişiye özel programlar için bize telefonla ya da e-postayla ulaşın; size özel teklif hazırlayalım." },
];

export type HeroSlide = { src: string; alt: string; caption: string };
export const DEMO_HERO: HeroSlide[] = [
  { src: "/images/v/oludeniz.jpg", alt: "Ölüdeniz koyu ve turkuaz deniz", caption: "Ölüdeniz, Fethiye" },
  { src: "/images/balon.jpg", alt: "Kapadokya'da sıcak hava balonları", caption: "Göreme, Kapadokya" },
  { src: "/images/v/efes.jpg", alt: "Efes'te Celsus Kütüphanesi", caption: "Efes, Selçuk" },
];

/**
 * Vitrinin tüm verisi — bileşenler yalnız bunu okur (`useVitrin`). Örnek
 * vitrinde (kiracısız adres) DEMO_VITRIN; kiracı vitrininde
 * `lib/storefront/vitrin-data.ts` acentenin yayınladığı ilanlardan kurar.
 */
export type VitrinData = {
  demo: boolean;
  agency: Agency;
  destinations: Destination[];
  categories: VCategory[];
  products: Product[];
  inspirations: Inspiration[];
  faq: VitrinFaqItem[];
  hero: HeroSlide[];
  /** Kiracı vitrini: WhatsApp numarası varsa. */
  whatsapp?: string;
};

export const DEMO_VITRIN: VitrinData = {
  demo: true,
  agency: DEMO_AGENCY,
  destinations: DEMO_DESTINATIONS,
  categories: ALL_CATEGORIES.filter((c) => c.key !== "vize"),
  products: DEMO_PRODUCTS,
  inspirations: DEMO_INSPIRATIONS,
  faq: DEMO_FAQ,
  hero: DEMO_HERO,
};
