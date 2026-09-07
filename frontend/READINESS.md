# Üretim hazırlık karnesi

**Ölçüm tarihi:** 2026-09-07 · **Ölçen:** yerel üretim derlemesi (`next start`),
Chrome, 4G ağ benzetimi (9 Mbps / 85 ms), mobilde CPU 4× yavaşlatma.

## Tek cümlelik cevap

**Gerçek kullanıcıya verilemez.** Ölçtüğüm her şey iyi çıktı, ama ölçülebilen
şeyler ürünün küçük kısmı: bu bir arayüz prototipi. Backend, kimlik doğrulama
ve gerçek tedarikçi bağlantısı yok. `/api/health?ready=1` bunu bilerek **503**
döndürüyor — sistem kendi hazır olmadığını söylüyor.

---

## Ölçülenler

Hepsi `npm run budget` ile tekrarlanabilir ve CI'da bütçe aşılırsa birleştirme durur.

### Performans — Bölüm 8 bütçesine karşı

| Ölçüm | Hedef | Sonuç | |
|---|---|---|---|
| B2C mağaza LCP (mobil 4G) | < 2500 ms | **500 ms** | geçti |
| B2C ürün LCP (mobil 4G) | < 2500 ms | **488 ms** | geçti |
| Tanıtım sayfası LCP (mobil 4G) | < 2500 ms | **512 ms** | geçti |
| Extranet iskelet ekranı | < 1000 ms | **456 ms** | geçti |
| Arama iskeleti | < 1000 ms | **412 ms** | geçti |
| İlk tedarikçi sonucu ekranda | < 3000 ms | **1708 ms** | geçti |
| 500 satır kaydırma, p95 kare | < 20 ms (50+ fps) | **16.8 ms** (≈60 fps) | geçti |
| 500 satırda DOM'daki satır | < 80 | **30** | geçti |
| CLS, tüm sayfalar | < 0.1 | **0.000** | geçti |
| Sayfa başına transfer | < 450 KB | **387–435 KB** | geçti |

**Uyarı:** LCP değerleri localhost'ta ölçüldü; ağ gecikmesi yok. Gerçek sunucu
ve CDN ile bu sayılar büyür. Buradaki değerler bir **taban**, vaat değil.
Gerçek rakamı ancak alan verisi (RUM) söyler — onun için `/api/telemetry`
kuruldu ama henüz veri toplamıyor.

### Erişilebilirlik — axe-core, WCAG 2.1 A + AA

9 sayfada **0 ihlal**. Ama bu ilk çalıştırmada böyle değildi:

> İlk tarama 8 sayfanın hepsinde **177 düğümde** kontrast ihlali buldu.
> Sebep bendim: `--text-muted` (#78878d) kâğıt zeminde 3.30:1 veriyordu,
> `--border-strong` girdi çerçevesi olarak 2.19:1'de kalıyordu, `--state-warning`
> kendi rozet zemininde 4.16:1'di. DESIGN.md "WCAG 2.1 AA" yazıyordu ama
> yalnızca tema motorunun ürettiği marka rengi doğrulanıyordu; elle seçilmiş
> nötr renkler hiç kontrol edilmemişti.

Düzeltildi ve bir daha sessizce bozulamaz hale getirildi: `src/lib/design-tokens.ts`
her tokenın hangi zeminde hangi eşiği tutması gerektiğini yazar, `npm run test`
bunu doğrular, `npm run budget` tarayıcıda gerçek render üzerinden bir kez daha
bakar. Muafiyetlerin (`--border-default`, kök hata sınırı) yazılı gerekçesi var
ve gerekçesiz muafiyet testten geçmiyor.

### Testler

`npm run test` — 21 test, hepsi geçiyor, harici bağımlılık yok (Node'un kendi
test koşucusu ve TypeScript desteği).

- **Fiyat hesabı (6):** marj uygulaması, kuruş yuvarlaması, monotonluk,
  net + marj = satış tutarlılığı. Buradaki bir hata doğrudan acentenin cebinden çıkar.
- **Durum makinesi (6):** izinli geçişler, kendine geçiş yok, iptal ve iadenin
  geri alınamazlığı, her durumun renkten bağımsız işareti.
- **Tema motoru (4):** 10 marka renginin tamamı AA tutuyor; palet dışı açık bir
  renk verilse bile motor düşürüyor; hover/active tonları koyulaşıyor.
- **Token sözleşmesi (5):** kontrast eşikleri, CSS ile sözleşmenin ayrışmaması,
  bileşenlerde ham renk kalmaması.

---

## Kurulanlar

| Yetenek | Durum | Nerede |
|---|---|---|
| Yapılandırılmış log (JSON satır) | kuruldu | `src/lib/log.ts` |
| Kişisel veri maskeleme | kuruldu | aynı dosya, `redact` |
| İstek kimliği ile izleme | kuruldu | `requestIdFrom` |
| Liveness ucu | kuruldu | `GET /api/health` |
| Readiness ucu | kuruldu | `GET /api/health?ready=1` → şu an 503 |
| İstemci hata yakalama | kuruldu | `src/instrumentation-client.ts` |
| Core Web Vitals (RUM) | kuruldu | `src/components/WebVitals.tsx` |
| Telemetri toplama ucu | kuruldu | `POST /api/telemetry` |
| Hata sınırları | kuruldu | `error.tsx`, `global-error.tsx`, `not-found.tsx`, `extranet/error.tsx` |
| Güvenlik başlıkları | kuruldu | `next.config.ts` |
| CSP | **yalnız rapor modunda** | enforce edilmiyor, aşağıya bakın |
| Performans bütçesi kapısı | kuruldu | `npm run budget` |
| CI | kuruldu | `.github/workflows/ci.yml` |

### Log tarafında kritik bir tercih

Bu ürün yolcu adı, e-posta, telefon ve tedarikçiye giden serbest not işliyor.
`log.ts` bunları **uygulama içinde** maskeler: bilinen alan adları (`name`,
`email`, `phone`, `note`, `tckn`, `iban`, `token`…) `[gizlendi]` olur, serbest
metinde e-posta ve telefon kalıpları yakalanır. Böylece kişisel veri sınırı log
toplayıcı sözleşmesine değil, koda bağlıdır. KVKK açısından fark önemli:
veriyi hiç göndermemek, gönderip "silineceğine" güvenmekten farklıdır.

---

## Kırmızı çizgiler — bunlar olmadan kullanıcıya açılmaz

Öncelik sırasıyla. İlk üçü olmadan pilot bile yapılmamalı.

1. **Kimlik doğrulama ve yetkilendirme yok.**
   `/extranet` şu an herkese açık. Acente rolleri, oturum, alt acente izinleri —
   hiçbiri yok. Çok kiracılı bir sistemde bu, bir acentenin diğerinin
   rezervasyonlarını görmesi demek. Tek başına yayına engel.

2. **Backend ve kiracı ayrımı yok.**
   Tüm veri `src/data/mock.ts`. Tenant izolasyonu, satır seviyesi yetki, veri
   saklama — hiçbiri denenmedi. Frontend'in doğru varsaydığı sözleşme
   (`src/lib/types.ts`) test edilmemiş bir varsayım.

3. **Para hesabı yalnız istemcide.**
   Marj ve satış fiyatı tarayıcıda hesaplanıyor. Sunucu doğrulaması olmadan
   fiyat manipüle edilebilir. Sunucu her rezervasyonda fiyatı yeniden
   hesaplamalı ve uyuşmazlıkta reddetmeli.

4. **Ödeme ve bakiye gerçek değil.**
   Kredi limiti kontrolü ekranda yapılıyor; arkasında muhasebe yok. Çift
   harcama, yarış koşulu, mutabakat — hiçbiri ele alınmadı.

5. **Uçtan uca test yok.**
   Birim testler var, tarayıcı akış testi yok. Arama → sepet → voucher akışı
   elle doğrulandı; regresyona karşı korunmuyor. Playwright zaten kurulu,
   bütçe betiği o akışı zaten gezip ölçüyor — testler oradan büyütülmeli.

6. **CSP enforce edilmiyor.**
   Next hidrasyonu satır içi script kullandığı için `unsafe-inline` gerekiyor;
   nonce'a geçilmeden enforce etmek sayfayı kırar. Şu an rapor modunda —
   raporlar toplanıp meşru kaynaklar görülünce açılmalı.

7. **Hata bütçesi ve alarm yok.**
   Log ve metrik akıyor ama kimse bakmıyor. "Hata oranı %1'i geçerse kime
   haber gider" sorusunun cevabı yok. SLO tanımlanmadan gözlemlenebilirlik
   yarımdır.

8. **Yedekleme, geri alma, olay müdahale planı yok.**
   Deploy geri alınabilir mi, ne kadar sürede? Veri kaybı toleransı nedir?
   Bir tedarikçi yanlış fiyat gönderirse rezervasyonlar nasıl geri alınır?

9. **Yük testi yapılmadı.**
   Ölçümler tek kullanıcıyla. Eşzamanlı 50 operatör, her biri 5 tedarikçiye
   arama açtığında ne olur — bilinmiyor.

10. **Kullanıcı araştırması hâlâ yok.**
    Bölüm 9.4. Yoğunluk, klavye ve fiyat üçlüsü varsayımları gerçek bir
    operatörle sınanmadı. Teknik hazırlık, yanlış ürünü hızlı çalıştırmayı
    kurtarmaz.

---

## Bilinen ve kabul edilen borç

| Konu | Durum | Neden şimdilik kabul |
|---|---|---|
| Font yükü 152 KB (12 dosya) | açık | Transfer bütçesi içinde ama payın %40'ı. İki aile × 3 ağırlık × latin+latin-ext. Ağırlık azaltmak ilk optimizasyon adayı. |
| `--border-default` 1.45:1 | muaf | Dekoratif ayraç; bilgi taşımıyor, WCAG 1.4.11 kapsamı dışında. Gerekçesi `design-tokens.ts` içinde yazılı. |
| Kök hata sınırında satır içi renk | muaf | Layout çöktüğünde stil sayfası yüklü olmayabilir. Değerleri token tablosuyla karşılaştıran ayrı bir test var. |
| Extranet sonuçlarında CLS 0.05 | kabul | Sonuçlar akarken satır ekleniyor; eşiğin (0.1) altında ve kademeli yüklemenin doğal sonucu. |

---

## Tekrar çalıştırmak için

```bash
npm run verify    # tip kontrolü + lint + 21 test
npm run build
npx next start -p 3100 &
npm run budget    # performans + erişilebilirlik kapısı
curl -s "localhost:3100/api/health?ready=1" | jq
```

CI aynı sırayı izler; bütçe aşılırsa birleştirme durur.
