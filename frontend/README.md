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
                  # korumalı rotalar için: BUDGET_EMAIL=... BUDGET_PASSWORD=... npm run budget
```

Üretime hazırlık durumu ve ölçüm sonuçları: **[READINESS.md](READINESS.md)**.
Kısa cevap: gerçek kullanıcıya verilemez — kimlik ve veritabanı bağlı, iş
verisi hâlâ mock; `/api/health?ready=1` bunu 503 ile bildirir.

Veri modeli ve ER diyagramı: **[../supabase/ERD.md](../supabase/ERD.md)**.

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

## Kimlik: davetle giriş

Açık kayıt yok. Süper Admin kiracıyı açar ve ilk yöneticiyi davet eder;
yönetici ekibini `/extranet/ayarlar` üzerinden davet eder. Davet
e-postasındaki bağlantı `/auth/confirm` → `/sifre-belirle` yoluyla şifre
belirletir (uçtan uca Playwright ile doğrulandı: link → şifre → panel). Bu kural veritabanında zorunlu: `auth.users`'a bekleyen bir
`app_user` kaydı olmadan satır girilemez (tetikleyici geri alır).

Kiracı ve rol bilgisi iki kademede okunur: JWT'de varsa oradan
(`custom_access_token_hook` etkinse), yoksa `app_user` tablosundan
`auth.uid()` ile. RLS fonksiyonları da uygulama da aynı yedeği uygular;
hook bir hızlandırmadır (sorgu başına bir arama tasarrufu), doğruluk şartı
değil. Sistem hook olmadan çalışır.

```
src/proxy.ts                    oturum yenileme + kapı yönlendirmesi
src/lib/supabase/{client,server,admin,proxy}.ts
src/lib/auth/claims.ts          talep ayrıştırma, açık yönlendirme koruması
src/lib/auth/session.ts         sunucu tarafı oturum durumu
src/lib/auth/actions.ts         signIn / signOut / reset / setPassword / inviteUser
src/app/auth/confirm/route.ts   e-posta bağlantılarının indiği uç
scripts/bootstrap.mjs           ilk kiracı + platform yöneticisi (tek seferlik)
```

**Kurulum (bir kez, Supabase Dashboard):**

1. Settings → API Keys → *Secret keys* → `.env.local` içine `SUPABASE_SECRET_KEY`.
2. *(isteğe bağlı, performans)* Authentication → Hooks → *Custom Access Token* → Postgres → `public.custom_access_token_hook`.
3. Authentication → URL Configuration → Site URL: `http://localhost:3000` (üretimde gerçek alan adı).
4. `node scripts/bootstrap.mjs <e-posta> <şifre> "<Şirket>"` → `/giris`.

E-posta şablonlarını değiştirmek gerekmez: `/auth/confirm` varsayılan
şablonun `#access_token` parçasını da, `token_hash` ve `code` biçimlerini
de çözer. Üretimde Site URL ve Redirect URL listesine gerçek alan adı eklenir.

## Vitrin: acentenin müşteri sitesi

Kiracı **adresten** çözülür, yolda önek yok:

| Adres | Kiracı |
|---|---|
| `firma-adi.localhost:3000` | slug `firma-adi` (geliştirme; tarayıcı `*.localhost`'u kendisi çözer) |
| `firma-adi.kontuar.com` | slug (wildcard DNS; `NEXT_PUBLIC_ROOT_DOMAIN=kontuar.com`) |
| `www.firmaninsitesi.com` | `tenant_domain` tablosu (white-label) |
| `localhost:3000/magaza` | kiracısız — örnek vitrin, banner bunu söyler |

Vitrin `anon` rolüyle okur ve yalnız yayındaki envanteri görür
(`tour.status = aktif` ve `show_on_website`; politikalar `0017`). Net
fiyat, marj, rezervasyon tablolarında anon'un SELECT yetkisi yok.
Vitrin istemcisi çerez okumaz: operatör kendi oturumuyla başka acentenin
vitrinine baksa da aynı şeyi görür.

Vitrinde dummy veri yok: ana sayfa, tur listesi, ürün, sepet, sipariş ve
onay `tour` / `booking` tablolarından; hakkımızda, iletişim, TÜRSAB
numarası ve marka rengi `/extranet/ayarlar → Vitrin bilgileri`nden
(`tenant_profile`, `tenant_branding`). Sipariş `create_storefront_booking`
veritabanı fonksiyonuyla açılır: fiyat istemciden alınmaz, kalkış
kontenjanı satır kilidiyle düşer, durum `PENDING` — ödeme platformda
alınmaz, acente kendi yöntemiyle tahsil eder.

Tur kataloğunun kaynağı `tour` tablosudur (`listTenantTours` → `TourCatalogProvider`);
sekmenin `sessionStorage`'ı yalnız kaydedilmemiş düzenlemeleri tutar. Taslak
oluşturulur oluşturulmaz tabloya yazılır; **Kaydet**, **Kaydet & Devam Et**,
**Yayınla** ve durum değişikliği `syncTour` çağırır. Kimlikler UUID: taslak ile
satır aynı kimliği taşır. Bu yüzden `localhost` ve `firma.localhost` gibi farklı
origin'lerde aynı liste görünür (Playwright ile doğrulandı).

Tekne modülü aynı kalıpta tabloya bağlı (`listTenantBoats` / `syncBoat`;
kısıtlar yalnız yayında zorunlu — 0021). Transfer, villa ve vize modülleri
hâlâ sekmede; sıradaki adım.

Yayın zinciri: sihirbaz → **Yayınla** → `syncTour` (sunucu eylemi) →
`tour` + yaş kademeleri + program + çeviriler → vitrin. Taslak ve pasif
turlar da tabloya yazılır ama anon'a görünmez. Kategori/etiket/ekstra
kütüphaneleri henüz sihirbazın yerel deposunda; tabloya taşınınca yayına
eklenir.

## İlan detayları ve talep akışı

Referans alınan acente siteleri (kart → detay → talep) kalıbı: her modülün
liste sayfası (`/magaza/tekneler`, `/villalar`, `/transferler`, `/vize`,
turlar için `/tur-arama`) ve detay sayfası (`/magaza/tekne/[slug]`,
`/villa/[slug]`, `/transfer/[id]`, `/vize/[id]`, tur `/magaza/[slug]`).
Detay: breadcrumb, başlık, meta çipler, görsel ızgarası, fiyat tablosu,
teknik özellikler / program, dahil-hariç, iptal koşulları, WhatsApp; sağda
talep kutusu. Tur sepete gider; tekne/villa/transfer/vize tarih ister ve
doğrudan talep açar (`create_storefront_booking` v2). Tutar sunucuda
hesaplanır; tekne ve villada tarih çakışması veritabanı kısıtıyla
reddedilir ("Seçtiğiniz tarihler dolu"). Menü sekmeleri liste sayfalarına
gider.

## Site tasarımı: acente sitenin karakterini kendisi belirler

`/extranet/site` — sol sütun bölümler (sürükle-bırak ya da ok tuşları,
aç/kapa, başlık/alt metin), karakter (marka rengi, üst çubuk açık/koyu,
köşe, kahraman düzeni), menü, altbilgi, SEO; sağ sütun taslağın canlı
önizlemesi (`/site-onizleme`, aynı origin, kiracı oturumdan). Her
değişiklik 700 ms sonra taslağa yazılır; **Yayınla** müşteriye açar.

Yapı tek bir JSON (`tenant_site.draft` / `.published`), şeması
`src/lib/site/config.ts` içinde doğrulanır: bilinmeyen bölüm atılır, eksik
alan varsayılanla dolar, menü bağlantısı yalnız site içi yol ya da https.

Kural: **bölümün açık olması yetmez, içeriği de olmalı.** Tekne bölümü açık
ama yayında tekne yoksa vitrinde çizilmez; editör "boş — gizlenir" der ve
nereden doldurulacağını söyler. Bölümler: kahraman, kalkış tablosu, turlar,
transferler, tekneler, villalar, vize, hakkımızda, SSS, iletişim, serbest
metin (birden çok).

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
| B2B Pazaryeri | özet, tedarikçi keşfi, pazaryeri turları/transferleri, paylaştıklarım, aldıklarım, kontratlar, 6 adımlı kurulum sihirbazı |

Faz 2 ve Faz 3 ekranları (transfer/uçuş araması, tedarikçi portalı, üye
hesabı, raporlar, mobil) bilinçli olarak yazılmadı; arama sekmelerinde
"Faz 2" etiketiyle görünür ama devre dışı.

## B2B Pazaryeri — spesifikasyondan bilinçli sapmalar

Modül "B2B Pazaryeri Modülü Spesifikasyonu" (8 Eylül 2026) temel alınarak
yazıldı. Dört yerde dokümandan ayrıldık; hepsinin gerekçesi kodda yorum
olarak duruyor:

| Spesifikasyon | Bizde | Neden |
|---|---|---|
| Bölüm 6: komisyon akışı "Tedarikçi → **platform** → Satıcı" | Para **taraflar arasında**; platform yalnız hakediş hesaplar | Platform para taşırsa 1618 sayılı kanun kapsamına girer. Bölüm 2.5'teki "tüm sözleşmesel ilişkiler taraflar arasındadır" ifadesiyle de tutarlı |
| Bölüm 7: `MARKETPLACE_LISTING` polimorfik referans | Tipli nullable FK (`tourId` XOR `vehicleId`) | Polimorfik FK referans bütünlüğünü kırar, RLS politikasını zorlaştırır |
| Bölüm 5.1: `CONTRACT.kapsam` bir alan | `ContractListing` çoka-çok tablosu | Kapsam doğası gereği çoka-çok |
| Bölüm 5.1: fiyat "donmuş **olabilir**" | İki kademe: kontrat onayında donar, her rezervasyon ayrıca snapshot'lar | Parada "olabilir" olmaz; tedarikçi oranı değiştirince geçmiş rezervasyonlar değişmemeli |
| Bölüm 3: duvarın arkası tamamen boş | Acente adı/şehir/envanter sayısı görünür, fiyat ve kontrat kilitli | Değeri göstermeden abonelik satılmaz |
| Bölüm 9: sol menüde 8 öğeli grup | Ray'da tek satır, alt gruplar sayfa içi sekme | Ray zaten 13 satır |
| Faz 2: aramaya entegrasyon | **MVP'ye alındı** | Ürünün vaadi "tek aramada bütün tedarikçileriniz"; pazaryerini ayrı ekranda bırakmak o vaadi bozardı |

Ayrıca `MARKETPLACE_SUBSCRIPTION` ayrı bir varlık değil, planın bir özelliği
(`MarketplaceAccess`) — ikinci bir faturalama yüzeyi açmamak için.

## Yapılmayanlar

- **Faz 2 / Faz 3 ekranları.** Yukarıdaki not.
- **Pazaryeri iptal/iade sorumluluğu.** Spesifikasyonda hiç geçmiyor: müşteri
  pazaryerinden alınan turu iptal ederse satıcı müşteriye iade eder ama
  tedarikçiden parasını nasıl geri alır? Karar verilmeden ekran yazılmaz.
- **Pazaryerinde çifte satış.** Aynı kontenjanı iki satıcı aynı anda satarsa
  ne olur — envanter kilidi tasarlanmadı.
- **Tanıtım sayfası alt sayfaları.** Fiyatlandırma ve entegrasyon listesi
  yok — "Demo planlayın" e-postaya gidiyor.
- **Ekran–API eşlemesi.** Kimlik ve kullanıcı listesi gerçek (Supabase);
  diğer veriler `src/data/mock.ts` içinde. Şekiller `src/lib/types.ts`
  sözleşmesine göre yazıldı, tablo bağlandıkça `use-supplier-search` ve
  `getProduct` değişir, bileşenler değişmez.
- **Scope bazlı yazma yetkisi.** RLS kiracıyı süzer; "muhasebe rezervasyon
  silemez" kuralı henüz politika değil, uygulama katmanında.
- **Storybook.** Bileşenler ayrık ve prop'ları dar; kurulum tek adım kaldı.
- **Faz 2 kalemleri:** komut paleti (`Cmd/Ctrl+K`), FilterSidebar, sıralama
  şeffaflığı bloğu, A/B varyant altyapısı, para birimi seçici, canlı sohbet.
- **Kullanıcı araştırması.** Bölüm 9.4 hâlâ açık: buradaki yoğunluk ve klavye
  varsayımları 2–3 gerçek acente operatörüyle doğrulanmadı.
