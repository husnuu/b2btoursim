# Tasarım kararları ve gerekçeleri

Bu dosya "neden böyle" sorusunun cevabı. Bir karar değişecekse önce buraya
bakın — çoğunun arkasında bağlam dokümanındaki bir kural var.

## Konu

Ekranın karşısındaki kişi bir acente operatörü. Günde 30–50 rezervasyon,
aynı ekranda 8 saat, çoğu zaman telefonda müşteriyle konuşurken arama.
Bu bir SaaS ürünü gibi değil, bir **enstrüman** gibi davranmalı. Görsel dil
seyahat ticaretinin fiziksel malzemelerinden alındı: termal bilet kâğıdı,
vize etiketi, ıstampa mürekkebi, kalkış tabelası.

## Renk

| Rol | Değer | Nereden |
|---|---|---|
| `paper` | `#f0f2ef` | Termal bilet stoğu. Krem değil, soğuk yeşil-gri |
| `text.primary` | `#16242b` | Petrol mürekkep. Nötr gri veya tinted black değil |
| `action.primary` | `#4b3b9e` | Mor anilin ıstampa mürekkebi |
| `state.warning` | `#9c6710` | Vize etiketi okrası |
| `state.danger` | `#a83232` | "İPTAL" kaşesi |
| `margin.field` | `#135c3f` | Acentenin kazandığı para; marj alanına özel |

Aksiyon rengi için ilk refleks indigo/mavi idi — her B2B panelinin rengi o.
Mor ıstampa mürekkebine kaydırıldı: aynı ciddiyet, tanıdık olmayan ton.

Koyu yüzeyde uyarı için ayrı bir değer var (`state.warning-on-inverse`);
rol adı sabit kaldığı için bileşenler yine ham hex kullanmıyor.

## Tipografi

Tek süper aile: **Barlow**. Otoyol ve transit tabela grotesklerinden çizilmiş,
düşük kontrastlı, Türkçe diakritikleri sağlam (`latin-ext` altkümesi zorunlu).

- Extranet tabloları **Barlow Semi Condensed** kullanıyor. Dekoratif değil:
  aynı okunabilir puntoyla satıra iki kolon daha sığıyor.
- B2C başlıkları da aynı aileden, büyük puntoda tabela gibi kuruluyor.
  İkinci bir display ailesi eklenmedi.
- Ağırlık üç tane: 400, 500, 600. 700 yok.
- Sayılar her yerde tabular (`.tnum`). Fiyat kolonları buna dayanıyor.
- Büyük harf etiket yok, cümle düzeni.

## İmza öğesi: fiyat üçlüsü

Cesaret tek yerde harcandı. Bu ürünü her tüketici seyahat arayüzünden ayıran
şey acentenin aynı satırda net / marj / satış görmesi ve marjı satır üzerinde
değiştirebilmesi. `PriceTriad` bu yüzden:

- Marj alanı kutulu input değil, kâğıt formdaki doldurulacak boşluk gibi
  alttan çizgili — yoğun tabloda 20+ input kutusu gürültüsü olmuyor ama
  alanın düzenlenebilir olduğu görülüyor.
- Satış fiyatı marj değişince kısaca vurgulanıyor. Sayfadaki tek orkestre
  edilmiş hareket bu.
- `prefers-reduced-motion` her şeyi kapatıyor.

Etrafındaki her şey sessiz: gölge yok, gradyan yok, kart yok.

## Tanıtım sayfası

Hero'nun çapası stok fotoğraf, büyük bir sayı ya da soyut bir illüstrasyon
değil: **ürünün gerçek sonuç satırı, çalışır halde**. Ziyaretçi marjı
değiştirir, satış fiyatı döner. Vaadin tamamı o satırda görünüyor, o yüzden
anlatmak yerine gösteriliyor. Aynı mantıkla tedarikçi şeridi de gerçek
bileşen ve "tekrar dene" düğmesi gerçekten çalışıyor — tanıtım sayfasında
tıklanamayan buton koymadık.

"Acentenin gördüğü / müşterinin gördüğü" bölümü ürünün en keskin kuralını
tek bakışta anlatıyor: aynı ürün, iki yüzey, iki farklı gerçek.

## Reddedilen desenler

- **Kart + yumuşak gölge sonuç listesi.** İlk refleksti; satır başına ~90px
  yiyor ve tam olarak brief'in reddettiği tüketici deseni. Tabloya çevrildi:
  38px satır, hairline ayraç, gölge sıfır, ekranda 20+ satır.
- **Orta noktayla birleştirilmiş meta.** `09:00 · 4 sa · TR/EN` hem şablon
  tellsi hem taranabilir değil. Her nitelik kendi mini kolonuna girdi.
- **Büyük kapak fotoğrafı hero.** B2C hero'nun çapası bugünün kalkış tablosu:
  bu sayfanın konusuna en özgü şey ve Extranet'teki disiplinin tüketici
  kaydındaki karşılığı.
- **İkonlu sol ray.** Altı öğe için ikon tanıma maliyeti okumadan yüksek;
  kazanılan piksel tabloya gitti. Aktif öğe satır başındaki 2px kural ile
  işaretleniyor, sadece renkle değil.
- **Tanıtım sayfasında sahte pencere çubuğu.** Demo kutusunun başına konan
  üç renkli nokta hiçbir bilgi taşımıyordu; kaldırıldı.
- **Ürün detayda üç mor buton.** Seçenek satırlarındaki eylemler eşit
  ağırlıkta; hepsini birincil renkte yapmak rengi değersizleştiriyordu.
  Outline'a çevrildi, birincil renk sayfada tek yerde kaldı.

## Yoğunluk

İki ölçek, tek bileşen kümesi. Boşluk değerleri token'dan geliyor,
bileşene gömülü değil. `data-density="compact"` Extranet ve Admin'de,
varsayılan `comfortable` B2C'de.

Extranet ve B2C **aynı işlevi gören ama farklı bileşenler** kullanıyor
(`ResultRow` ↔ `ProductCard`). Ortak olan alt katman: token, buton, fiyat
biçimlendirme, durum rozeti.

## Erişilebilirlik

Bu bölüm bir zamanlar yalnızca bir iddiaydı ve iddia yanlıştı: ilk axe taraması
sekiz sayfanın hepsinde kontrast ihlali buldu (177 düğüm). Tema motoru marka
rengini doğruluyordu ama elle seçilmiş nötr renkler hiç kontrol edilmemişti.
Artık `src/lib/design-tokens.ts` sözleşmesi ve iki ayrı kapı var — ayrıntı
[READINESS.md](READINESS.md) içinde.

- Kontrast tema motorunda zorunlu; tenant bunu bozamıyor.
- Statik tokenlar `npm run test` ile, gerçek render `npm run budget` ile denetlenir.
- Odak her zaman görünür, satırlarda ek olarak sol kenarda 2px işaret.
- Rozetlerde renk tek başına anlam taşımıyor; her durumun kendi işareti var.
- Dokunma hedefi minimumu yalnız `pointer: coarse` altında uygulanıyor;
  masaüstü yoğunluğu bozulmuyor.
- Mizanpaj logical CSS özellikleriyle (`ps-`, `pe-`, `border-s-`) kuruldu;
  RTL kararı gelirse mizanpaj yeniden yazılmayacak.

## Açık kalan tasarım soruları

1. Sonuç satırında tedarikçi kodu mu, tam ad mı? Şu an dar kolonda kod,
   geniş alanda ad. Operatör gözlemi bunu çözecek (Bölüm 9.4).
2. Marj alanı yüzde mi, tutar mı? Şu an yüzde. Bazı acenteler sabit tutarla
   çalışıyor olabilir.
3. Rezervasyon listesinde satır tıklanınca detay mı açılmalı, satır mı
   genişlemeli? Şu an ikisi de yok — detay ekranı yazılmadı.
