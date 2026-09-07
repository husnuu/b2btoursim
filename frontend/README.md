# Kontuar — frontend

Bağlam dokümanındaki (`Frontend / UI-UX Bağlam Dokümanı v1`) Adım 2 ve Adım 3'ün
kod karşılığı: token katmanı + tema motoru + i18n altyapısı, ve üzerine tek bir
uçtan uca dikey dilim.

```
npm install
npm run dev       # http://localhost:3000
npm run verify    # tip kontrolü + lint + testler
npm run build
npm run budget    # performans ve erişilebilirlik kapısı (sunucu ayakta olmalı)
```

Üretime hazırlık durumu ve ölçüm sonuçları: **[READINESS.md](READINESS.md)**.
Kısa cevap: gerçek kullanıcıya verilemez — kimlik doğrulama ve backend yok,
`/api/health?ready=1` bunu 503 ile bildirir.

`/` platformun tanıtım sayfası.

---

## Kapatılan kararlar (Bölüm 2)

Bunlar varsayım olarak alındı; değişirse token ve bileşen katmanı taşımayı
kaldıracak şekilde kuruldu.

> **Güncelleme (7 Eylül 2026):** Teknik Tasarım Dokümanı (TDD) yayımlandı.
> Rezervasyon durum makinesi, varlık sözlüğü ve API sözleşmesi artık tahmin
> değil; `src/lib/types.ts` ve `src/lib/booking-status.ts` TDD Bölüm 2.2 ve
> Bölüm 3 ile birebir hizalandı.

| # | Karar | Alınan |
|---|---|---|
| 2.1 | MVP kapsamı | Strateji dokümanı: tek dikey dilim |
| 2.2 | İlk ürün tipi | Tur / aktivite |
| 2.3 | Pazar / dil | Türkiye, `tr-TR`, TRY. i18n altyapısı gün 1, RTL yok |
| 2.4 | White-label | Logo + kısıtlı marka paleti; özel domain yok |
| 2.5 | Ekip | 1–2 frontend; kapsam buna göre kesildi |

Otel veya uçuş ilk dikey seçilirse `SearchBar`, `ResultTable` ve `PriceTriad`
dışındaki sonuç mimarisi yeniden kurulur — Bölüm 4'teki uyarı geçerli.

---

## Mimari

```
src/
  app/
    page.tsx                   tanıtım sayfası (SSR)
    extranet/                  SPA, SEO yok, data-density="compact"
      page.tsx                 arama
      arama/                   kademeli sonuç akışı
      urun/[id]/               seçenek tablosu, satır içi marj
      sepet/                   tek sayfa checkout
      voucher/[ref]/           müşteriye giden belge (yalnız retail fiyat)
      rezervasyonlar/          500 satır, sanallaştırılmış
    magaza/                    B2C, SSR/ISR, comfortable yoğunluk
  components/
    primitives/                iki yüzeyde ortak: Button, PriceDisplay,
                               PriceTriad, StatusBadge, SupplierMark,
                               FilterChipBar, Toast, States, Skeleton
    extranet/                  yoğun yüzeye özel bileşenler
    b2c/                       tüketici yüzeyine özel bileşenler
    site/                      tanıtım sayfası bileşenleri
  lib/
    theme.ts                   OKLCH türetme + WCAG AA zorlaması
    i18n/                      messages.ts (tek kaynak) + biçimlendiriciler
    booking-status.ts          durum makinesi ve geçiş kuralları
    cart.tsx                   sekme başına sepet
    session-store.ts           sessionStorage'ı dışsal kaynak olarak okur
    use-supplier-search.ts     kademeli yanıt + kısmi hata
    use-virtual-rows.ts        sabit yükseklikli pencereleme
    use-shortcuts.ts           `/` ve `Esc`
    log.ts                     yapılandırılmış log + kişisel veri maskeleme
    report.ts                  istemciden telemetri gönderimi
    design-tokens.ts           token sözleşmesi ve kontrast eşikleri
  app/api/
    health/                    liveness ve readiness
    telemetry/                 web vitals ve istemci hataları
tests/                         21 test (node --test, harici bağımlılık yok)
scripts/budget.mjs             performans ve erişilebilirlik bütçesi
```

### Token katmanı

Bileşenler ham hex kullanmaz, yalnızca rol adı kullanır. Ham değerler tek
yerde: `src/app/globals.css` içindeki `:root`. Tailwind `@theme inline` bu
değişkenleri utility'lere bağlar (`bg-surface`, `text-ink-2`, `border-line`).

İki yoğunluk ölçeği var ve boşluk hiçbir bileşene gömülü değil:

- varsayılan → `comfortable` (B2C)
- `[data-density="compact"]` → Extranet + Admin

Aynı bileşen iki ölçekte de çalışır; `--row-h`, `--pad-x`, `--font-ui`
değişir.

Karanlık mod MVP'de yok ama isimlendirme hazır: tek bir blok eklemek yeter.

### Tema motoru

`deriveActionTokens(hex)` seçilen marka renginden hover/active/tint tonlarını
OKLCH uzayında türetir ve beyaz metinle en az 4.5:1 kontrast tutana kadar
açıklığı düşürür. Tenant'a serbest hex verilmez — `BRAND_PALETTE` içindeki
10 seçenek verilir. Tenant markası `src/app/layout.tsx` içinde tek satırda
seçilir; `BRAND_PALETTE` içindeki her renk `npm run test` ile doğrulanır.

### i18n

Kullanıcıya görünen hiçbir metin bileşen içinde değil; hepsi
`src/lib/i18n/messages.ts` içinde. Anahtarlar tipli (`MessageKey`), eksik
anahtar derlenmez. Tarih/saat sunucuda UTC, görüntülemede `Europe/Istanbul`.
Para her yerde minor unit (kuruş) olarak taşınır, `formatMoney` ile basılır.

### Fiyat kuralı

`salePrice(net, marginPct)` tek kaynaktır; hiçbir bileşen kendi formülünü
yazmaz. `PriceDisplay` üç modda çalışır (`net | retail | both`); B2C ve
voucher yalnız `retail` kullanır — net ve marj o yüzeylerde hiçbir koşulda
basılmaz.

---

## Doğrulanan davranışlar

- İlk tedarikçi sonucu ~0,9 sn'de listede; kalanlar geldikçe akıyor.
- Bir tedarikçi (TX) kasten zaman aşımına uğruyor: arama çökmüyor, o kaynak
  şeritte "yanıt vermedi / tekrar dene" olarak duruyor, diğerleri gösteriliyor.
- Marj satır üzerinde değişiyor, satış fiyatı anında güncelleniyor
  (`↑`/`↓` ile 1, `Shift` ile 5 puan).
- Sepete ekleme onay sormuyor, "geri al" sunuyor.
- Sepet sekme başına; iki sekmede iki farklı müşteri karışmıyor.
- Rezervasyon listesi 500 satırda sanallaştırılmış, klavye ile geziliyor,
  beş kolondan sıralanıyor.
- `/` tuşu arama alanına odaklanıyor.
- Tüm akış: arama → sonuç → ürün → sepet → onay → voucher çalışıyor.

---

## Ekran envanteri

İçerik Haritası'ndaki MVP kapsamı (~34 route) mock veriyle tamamlandı.

| Alan | Yazılan ekranlar |
|---|---|
| Kimlik | `/giris`, `/sifre-sifirlama` |
| Extranet | ana sayfa, arama (sekmeli), tur sonuçları, otel sonuçları, ürün detay, sepet, voucher, rezervasyon listesi, rezervasyon detay + iptal, bakiye ve cari hesap, ekstre, alt acenteler, kullanıcı ve roller |
| Süper Admin | genel bakış, kiracı listesi, onboarding sihirbazı, kiracı detay, plan tanımları, tedarikçi adaptörleri, API kimlik bilgileri, para birimi ve kur, rol şablonları |
| B2C | ana sayfa, tur arama, ürün detay, sepet, ödeme, onay, hakkımızda, SSS, iptal-iade, KVKK, iletişim |
| Tanıtım | `/` |

Faz 2 ve Faz 3 ekranları (transfer/uçuş araması, tedarikçi portalı, üye
hesabı, raporlar, mobil) bilinçli olarak yazılmadı; arama sekmelerinde
"Faz 2" etiketiyle görünür ama devre dışı.

## Yapılmayanlar

- **Faz 2 / Faz 3 ekranları.** Yukarıdaki not.
- **Tanıtım sayfası alt sayfaları.** Fiyatlandırma ve entegrasyon listesi
  yok — "Demo planlayın" e-postaya gidiyor.
- **Ekran–API eşlemesi.** Veriler `src/data/mock.ts` içinde; şekiller
  `src/lib/types.ts` sözleşmesine göre yazıldı, endpoint bağlanınca
  `use-supplier-search` ve `getProduct` değişir, bileşenler değişmez.
- **Storybook.** Bileşenler ayrık ve prop'ları dar; kurulum tek adım kaldı.
- **Faz 2 kalemleri:** komut paleti (`Cmd/Ctrl+K`), FilterSidebar, sıralama
  şeffaflığı bloğu, A/B varyant altyapısı, para birimi seçici, canlı sohbet.
- **Kullanıcı araştırması.** Bölüm 9.4 hâlâ açık: buradaki yoğunluk ve klavye
  varsayımları 2–3 gerçek acente operatörüyle doğrulanmadı.
