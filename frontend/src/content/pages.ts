import type { FeatureStatus } from "./site";

/**
 * Ara sayfaların metinleri. Durum etiketleri site.ts ile aynı kurala uyar:
 * canlıya alınmamış bir şey "live" olarak anlatılmaz.
 */

export type Step = { title: string; body: string; status?: FeatureStatus };

export const agencyPage = {
  kicker: "Seyahat acenteleri için",
  title: "Daha fazla ürün.\nDaha az telefon trafiği.",
  lead: "Farklı tedarikçilerin turlarını, transferlerini, tekne ve feribot ürünlerini tek panelden bulun; size tanımlanan B2B koşullarla rezervasyon oluşturun.",
  photos: [
    { src: "/images/istanbul.jpg", alt: "Eminönü önünden geçen İstanbul vapuru" },
    { src: "/images/balon.jpg", alt: "Kapadokya'da sıcak hava balonları" },
    { src: "/images/transfer.jpg", alt: "Havalimanında bekleyen transfer minibüsü" },
  ],
  before: [
    "Her tedarikçiye ayrı telefon",
    "WhatsApp gruplarında kaybolan fiyatlar",
    "Excel'de güncel olmayan fiyat listeleri",
    "“Yer var mı?” diye beklenen dönüşler",
  ],
  after: [
    "Tüm tedarikçiler tek panelde",
    "Size özel net fiyat ve komisyon",
    "Ürün, fiyat ve müsaitlik aynı ekranda",
    "Rezervasyon durumunu anlık takip",
  ],
  manifesto:
    "Müşteriniz Kapadokya'da balon, Çeşme'de tekne ve havalimanından transfer istiyor. Üç ayrı tedarikçiyi aramak yerine hepsini tek panelde bulun, fiyatını görün ve rezervasyonunuzu oluşturun.",
  steps: [
    { title: "Keşfedin", body: "Kategori, bölge veya tedarikçiye göre B2B satışa açılmış ürünleri inceleyin." },
    { title: "Koşulları görün", body: "Her üründe size tanımlanan net fiyatı ya da komisyon oranını açıkça görün." },
    { title: "Rezervasyon oluşturun", body: "Tarih ve kişi sayısını seçin; talebiniz tedarikçiye iletilsin." },
    { title: "Takip edin", body: "Onay, değişiklik ve iptal durumlarını tek listeden izleyin." },
  ] satisfies Step[],
  faq: [0, 4, 6, 7],
};

export const supplierPage = {
  kicker: "Tedarikçiler için",
  title: "Ürününüzü bir kez girin.\nAcentelerin satışına açın.",
  lead: "Turlarınızı, teknelerinizi, transfer ve aktivitelerinizi Seyyah'a ekleyin; fiyatı, kontenjanı ve hangi acentenin satabileceğini siz belirleyin.",
  photos: [
    { src: "/images/yat.jpg", alt: "Koy önünde ilerleyen motor yat" },
    { src: "/images/tekne.jpg", alt: "Koyda demirli gulet" },
    { src: "/images/feribot.jpg", alt: "Denizde ilerleyen feribot" },
  ],
  manifesto:
    "Tekneniz her sabah limandan ayrılıyor. Boş kalan her koltuk satılmamış bir fırsat demek. Seyyah ile ürünlerinizi daha fazla acenteye açın; fiyatı, kontenjanı ve kime satılacağını siz belirleyin.",
  steps: [
    { title: "Ürününüzü listeleyin", body: "Açıklama, fotoğraf, süre ve kalkış bilgileriyle ürününüzü bir kez tanımlayın." },
    { title: "Fiyat ve kontenjan belirleyin", body: "Tarih bazlı müsaitlik ve kontenjanınızı yönetin." },
    { title: "Acentelere açın", body: "Ürününüzü hangi acentelerin, hangi koşulla satabileceğine siz karar verin." },
    { title: "Rezervasyonları alın", body: "Gelen talepleri tek listede görün, onaylayın ve takip edin." },
  ] satisfies Step[],
  faq: [3, 1, 6, 7],
};

export const marketplacePage = {
  kicker: "B2B Pazaryeri",
  title: "Turizmin her alanı.\nTek pazaryerinde.",
  lead: "Seyyah, tedarikçilerin ürünlerini acentelerin satışına açtığı kapalı bir B2B pazaryeri. Tüketiciye değil, turizm profesyonellerine.",
  journey: [
    { who: "Acente", text: "Ürünü bulur, tarih ve kişi sayısıyla talep oluşturur." },
    { who: "Seyyah", text: "Talebi ticari koşullarıyla birlikte tedarikçiye iletir." },
    { who: "Tedarikçi", text: "Müsaitliği kontrol eder, rezervasyonu onaylar." },
    { who: "Acente", text: "Onayı panelde görür, müşterisini bilgilendirir." },
  ],
  principles: [
    { title: "Yalnızca profesyoneller", body: "Pazaryerine başvurusu onaylanan acente ve tedarikçiler erişir." },
    { title: "Koşulları satıcı belirler", body: "Fiyat, kontenjan ve hangi acentenin satabileceği tedarikçinin kararıdır." },
    { title: "Tek kayıt, iki görünüm", body: "Aynı rezervasyonu acente ve tedarikçi kendi panelinden takip eder." },
  ],
};

export const integrationsPage = {
  kicker: "Entegrasyonlar",
  title: "Bağlantılar\nyolda.",
  lead: "Seyyah'ın uzun vadeli hedefi; tedarikçi sistemlerini, acente web sitelerini ve diğer satış kanallarını tek altyapıda buluşturmak. Bugün nerede olduğumuzu açıkça paylaşıyoruz.",
  roadmap: [
    {
      phase: "Bugün",
      status: "live" as FeatureStatus,
      title: "Panel üzerinden yönetim",
      items: ["Ürün ve fiyat yönetimi", "Müsaitlik ve kontenjan", "Rezervasyon yönetimi", "Acente bazlı B2B fiyatlandırma"],
    },
    {
      phase: "Sırada",
      status: "soon" as FeatureStatus,
      title: "Görünürlük",
      items: ["Satış raporları", "Komisyon ve hakediş takibi", "Voucher ve rezervasyon belgeleri"],
    },
    {
      phase: "Planlanan",
      status: "planned" as FeatureStatus,
      title: "Bağlantılar",
      items: ["API ve XML entegrasyonları", "Dış tedarikçi bağlantıları", "Alt acente ve bayi yönetimi", "White-label ve web sitesi bileşenleri"],
    },
  ],
};

export const aboutPage = {
  kicker: "Hakkımızda",
  title: "Seyyah:\nyolda olanın adı.",
  lead: "“Seyyah” gezgin demek; yeri yurdu dolaşan, gördüğünü anlatan kişi. Biz bu adı, turizmin farklı uçlarını birbirine bağlama işine verdik.",
  manifesto:
    "Turizmde ürün çok, bağlantı az. Bir tur operatörü harika bir tekne turu düzenliyor ama yalnızca tanıdığı birkaç acenteye satabiliyor. Bir acente müşterisine daha fazlasını sunmak istiyor ama doğru tedarikçiye ulaşamıyor. Seyyah bu iki tarafı aynı masaya oturtmak için var.",
  values: [
    { title: "Şeffaf koşullar", body: "Net fiyat, komisyon ve rezervasyon şartları iki taraf için de açıkça görünür." },
    { title: "Önce iş ortaklığı", body: "Platformu, tedarikçiyle acentenin uzun vadeli ilişkisini kolaylaştırmak için tasarlıyoruz." },
    { title: "Söz verdiğimizi gösteririz", body: "Henüz hazır olmayan bir özelliği hazırmış gibi anlatmıyoruz; yol haritamız açık." },
    { title: "Sahadan gelen bilgi", body: "Ürünü turizm profesyonellerinin gündelik iş akışına göre şekillendiriyoruz." },
  ],
};
