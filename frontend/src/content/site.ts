/**
 * Sayfadaki tüm metinler ve ürün durumları burada.
 *
 * `status` alanı, bir özelliğin sayfada nasıl etiketleneceğini belirler:
 *   - "live"    → etiket yok, aktif hizmet olarak anlatılır
 *   - "soon"    → "Yakında"
 *   - "planned" → "Planlanan"
 *
 * Bir modül canlıya alınmadan "live" yapılmamalı. Sayfa, ürünün gerçek
 * durumunu buradan okur.
 */

export type FeatureStatus = "live" | "soon" | "planned";
export type BusinessType = "acente" | "tedarikci";

export const statusLabel: Record<Exclude<FeatureStatus, "live">, string> = {
  soon: "Yakında",
  planned: "Planlanan",
};

export type NavLink = { label: string; href: string };
export type NavItem = NavLink & {
  children?: (NavLink & { desc: string; image: string })[];
};

export const nav: NavItem[] = [
  {
    label: "Çözümler",
    href: "/acenteler",
    children: [
      { label: "Acenteler için", href: "/acenteler", desc: "Yeni ürünlere ulaşın, B2B koşullarla satın.", image: "/images/istanbul.jpg" },
      { label: "Tedarikçiler için", href: "/tedarikciler", desc: "Ürünlerinizi daha fazla acenteye açın.", image: "/images/yat.jpg" },
    ],
  },
  { label: "B2B Pazaryeri", href: "/pazaryeri" },
  { label: "Entegrasyonlar", href: "/entegrasyonlar" },
  { label: "Nasıl Çalışır?", href: "/#nasil-calisir" },
  { label: "Hakkımızda", href: "/hakkimizda" },
];

export const categories = [
  {
    key: "tur",
    title: "Turlar ve Aktiviteler",
    blurb: "Günlük turlar, doğa ve macera aktiviteleri.",
    tab: "Turlar",
    long: "Şehir turlarından balon uçuşlarına, jeep safariden dalış gezilerine kadar günlük tur ve aktiviteleri tedarikçilerden doğrudan B2B koşullarla alın.",
    examples: ["Balon turları", "Şehir turları", "Jeep safari", "Dalış gezileri"],
    image: "/images/balon.jpg",
    alt: "Kapadokya'da peribacaları üzerinde uçan sıcak hava balonları",
  },
  {
    key: "transfer",
    title: "Transfer Hizmetleri",
    blurb: "Havalimanı, otel ve şehir içi transferler.",
    tab: "Transfer",
    long: "Havalimanı, otel ve şehirler arası transferleri araç tipine göre listeleyin ya da satışınıza ekleyin.",
    examples: ["Havalimanı transferi", "Otel–otel", "VIP araç", "Grup minibüsü"],
    image: "/images/transfer.jpg",
    alt: "Havalimanı terminalinde bekleyen beyaz transfer minibüsü",
  },
  {
    key: "tekne",
    title: "Tekne ve Yat Kiralama",
    blurb: "Günlük tekne turları, özel yat ve gulet kiralama.",
    tab: "Tekne & Yat",
    long: "Günlük tekne turları, özel yat ve gulet kiralamaları; kişi başı ya da tekne bazlı fiyatlarla tek panelde.",
    examples: ["Günlük tekne turu", "Özel yat", "Gulet kiralama", "Gün batımı turu"],
    image: "/images/yat.jpg",
    alt: "Yeşil koy önünde turkuaz suda ilerleyen beyaz motor yat",
  },
  {
    key: "feribot",
    title: "Feribot Biletleri",
    blurb: "Adalar ve komşu limanlar arası deniz ulaşımı.",
    tab: "Feribot",
    long: "Adalar ve komşu limanlar arasındaki feribot seferlerini müşterilerinizin seyahat planına ekleyin.",
    examples: ["Ada seferleri", "Yunan adaları", "Gidiş-dönüş", "Araçlı geçiş"],
    image: "/images/feribot.jpg",
    alt: "Koyu mavi denizde iz bırakarak ilerleyen yolcu feribotu",
  },
  {
    key: "otel",
    title: "Oteller ve Konaklama",
    blurb: "Butik otellerden tatil köylerine konaklama seçenekleri.",
    tab: "Konaklama",
    long: "Butik otellerden tatil köylerine konaklama seçeneklerini turlarınızla birlikte paketleyin.",
    examples: ["Butik otel", "Tatil köyü", "Pansiyon", "Paket konaklama"],
    image: "/images/otel.jpg",
    alt: "Palmiyelerle çevrili otel havuzu ve şezlonglar",
  },
  {
    key: "kultur",
    title: "Kültür ve Özel Deneyimler",
    blurb: "Rehberli kültür turları ve kişiye özel programlar.",
    tab: "Kültür",
    long: "Rehberli müze ve antik kent turları, gastronomi deneyimleri ve kişiye özel programlar.",
    examples: ["Antik kent turu", "Müze rehberliği", "Gastronomi", "Özel program"],
    image: "/images/kultur.jpg",
    alt: "Gün batımında Ayasofya ve minareleri",
  },
] as const;

export const features: {
  key: string;
  title: string;
  body: string;
  status: FeatureStatus;
}[] = [
  {
    key: "rezervasyon",
    title: "Rezervasyon Yönetimi",
    body: "Rezervasyon süreçlerinizi merkezi bir panel üzerinden takip edin.",
    status: "live",
  },
  {
    key: "kontenjan",
    title: "Fiyat ve Kontenjan Yönetimi",
    body: "Ürünlerinizi, fiyatlarınızı ve müsaitlik bilgilerinizi kolayca yönetin.",
    status: "live",
  },
  {
    key: "partner",
    title: "Acente ve Tedarikçi Yönetimi",
    body: "İş ortaklarınızı ve ticari ilişkilerinizi tek noktada organize edin.",
    status: "live",
  },
  {
    key: "fiyat",
    title: "B2B Fiyatlandırma",
    body: "Acente bazlı net fiyat, indirim ve komisyon modelleri oluşturun.",
    status: "live",
  },
  {
    key: "entegrasyon",
    title: "Entegrasyon Altyapısı",
    body: "Farklı tedarik ve satış sistemleri arasında bağlantılar kurun.",
    status: "planned",
  },
  {
    key: "rapor",
    title: "Raporlama ve Finansal Takip",
    body: "Rezervasyonları, satışları ve hakediş süreçlerini daha görünür hale getirin.",
    status: "soon",
  },
];

export const distribution = {
  sources: [
    { label: "Tur Operatörleri", status: "live" },
    { label: "Tekne İşletmeleri", status: "live" },
    { label: "Transfer Firmaları", status: "live" },
    { label: "Aktivite Sağlayıcıları", status: "live" },
    { label: "API/XML Tedarikçileri", status: "planned" },
  ],
  channels: [
    { label: "Seyahat Acenteleri", status: "live" },
    { label: "Alt Acenteler", status: "planned" },
    { label: "Online Satış Kanalları", status: "planned" },
    { label: "İş Ortakları", status: "live" },
    { label: "White-label Platformlar", status: "planned" },
  ],
} satisfies Record<string, { label: string; status: FeatureStatus }[]>;

export const integrations: { title: string; body: string; status: FeatureStatus }[] = [
  { title: "Tur ve aktivite sağlayıcıları", body: "Tedarikçi envanterinin otomatik aktarımı.", status: "planned" },
  { title: "Rezervasyon sistemleri", body: "Mevcut rezervasyon yazılımlarıyla çift yönlü senkron.", status: "planned" },
  { title: "Feribot ve ulaşım servisleri", body: "Sefer, koltuk ve bilet bilgilerine erişim.", status: "planned" },
  { title: "Ödeme altyapıları", body: "Tahsilat ve ödeme süreçlerinin platforma bağlanması.", status: "planned" },
  { title: "Acente web siteleri", body: "Ürünleri kendi sitenizde satabileceğiniz bileşenler.", status: "planned" },
  { title: "Diğer satış kanalları", body: "Ürünlerin ek dijital kanallara dağıtımı.", status: "planned" },
];

export const steps = [
  { title: "Hesabınızı Oluşturun", body: "Acente veya tedarikçi olarak başvurun." },
  { title: "İş Ortaklarınızı Keşfedin", body: "Ürünleri veya potansiyel satış kanallarını inceleyin." },
  { title: "Ürünlerinizi Yönetin", body: "Ürünleri listeleyin, fiyatları ve rezervasyon koşullarını belirleyin." },
  { title: "Satış Ağınızı Genişletin", body: "Yeni iş ortaklıkları ve rezervasyon fırsatları oluşturun." },
] as const;

export const faq = [
  {
    q: "Seyyah nedir?",
    a: "Seyyah; seyahat acentelerini, tur operatörlerini ve turizm hizmet sağlayıcılarını tek bir dijital ekosistemde buluşturan B2B turizm satış ve rezervasyon platformudur. Ürün tedariki, B2B satış ve rezervasyon yönetimi aynı panelde yürür.",
  },
  {
    q: "Seyyah kimler için geliştirilmiştir?",
    a: "İki grup için: başka tedarikçilerin ürünlerini müşterilerine satmak isteyen seyahat acenteleri ve kendi tur, tekne, transfer veya aktivite ürünlerini daha fazla acenteye ulaştırmak isteyen turizm tedarikçileri.",
  },
  {
    q: "Seyyah üzerinden hangi ürünler satılabilir?",
    a: "Platform; günlük turlar ve aktiviteler, tekne turları ve yat kiralama, transfer hizmetleri, feribot biletleri, konaklama ve kültür turları gibi kategorileri kapsayacak şekilde tasarlanıyor. Başvurunuz sırasında hangi kategorilerin hesabınızda açık olduğunu sizinle paylaşırız.",
  },
  {
    q: "Tedarikçi olarak nasıl katılabilirim?",
    a: "“Tedarikçi Olarak Başvur” formunu doldurmanız yeterli. Başvurunuz incelendikten sonra ekibimiz sizinle iletişime geçer; onaylanan hesaplarda ürünlerinizi listeleyip fiyat ve kontenjan bilgilerinizi tanımlayabilirsiniz.",
  },
  {
    q: "Acenteler nasıl ürün temin edebilir?",
    a: "Onaylı acente hesapları, tedarikçilerin B2B satışa açtığı ürünleri platform üzerinden inceler ve kendilerine tanımlanan ticari koşullarla rezervasyon oluşturur.",
  },
  {
    q: "Seyyah API ve XML entegrasyonlarını destekliyor mu?",
    a: "API ve XML tabanlı entegrasyonlar ürün yol haritamızda yer alıyor, ancak henüz kullanıma açık değil. Entegrasyon ihtiyacınızı başvuru formunda belirtirseniz planlama sürecinde sizi de dikkate alırız.",
  },
  {
    q: "Başvuru ve üyelik süreci nasıl işler?",
    a: "Formu doldurduğunuzda başvurunuz ekibimize ulaşır. İşletme bilgileriniz değerlendirildikten sonra sizinle iletişime geçilir ve uygun görülen hesaplar platforma dahil edilir.",
  },
  {
    q: "Seyyah'ı kullanmak ücretli mi?",
    a: "Fiyatlandırma modeli henüz kesinleşmedi. Başvuru sürecinde ticari koşullar sizinle ayrıca ve şeffaf biçimde paylaşılacak. Başvuru yapmak herhangi bir ücret veya taahhüt gerektirmez.",
  },
] as const;

export const serviceOptions = [
  "Turlar ve Aktiviteler",
  "Transfer",
  "Tekne ve Yat",
  "Feribot",
  "Konaklama",
  "Kültür Turları",
  "API/XML Entegrasyonu",
] as const;

export const heroChecks = [
  { strong: "Tek panel:", text: "ürün, fiyat ve rezervasyon aynı yerde." },
  { strong: "İki yönlü:", text: "ürün satın alın ya da ürününüzü açın." },
  { strong: "Net koşullar:", text: "acente bazlı net fiyat ve komisyon." },
] as const;

export const marqueeItems = [
  "Günlük Turlar",
  "Tekne Turları",
  "Yat Kiralama",
  "Havalimanı Transferi",
  "Feribot Biletleri",
  "Konaklama",
  "Kültür Turları",
  "Özel Deneyimler",
] as const;
