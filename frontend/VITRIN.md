# Vitrin tasarım dokümanı

> **Güncelleme (10 Ekim 2026) — Seyyah vitrini birebir.** `/magaza` artık
> `~/Desktop/seyyah` projesindeki `/vitrin` sayfasının **aynı kodu**:
> bileşenler `src/components/vitrin/**` (ProductCard, HeroSearch, SearchBox,
> CategoryBar, VitrinChrome, VitrinFooter, Favorites, RecentlyViewed,
> BookingWidget, AvailabilityCalendar, SearchResults, ProductGallery…),
> içerik ve tipler `src/content/vitrin.ts`, sayfalar `/magaza`,
> `/magaza/ara`, `/magaza/urun/[slug]` (`/magaza/[id]` oraya yönlendirir).
> Aynı sınıflar, aynı Seyyah paleti (pop + ink + mist), aynı fontlar (Plus
> Jakarta Sans + Fraunces, `lib/storefront/fonts.ts`).
>
> Tek fark veri kaynağı: bileşenler sabit içerik yerine `useVitrin()`
> bağlamını okur. Kiracısız adreste Seyyah'ın örnek acentesi (Mavi Rota,
> `DEMO_VITRIN`); kiracı adresinde `lib/storefront/vitrin-data.ts` acentenin
> yayınladığı turları ve modül ilanlarını `Product` şekline çevirir
> (fiyat kuruş → TL, kalkış günleri → takvim, kapak yoksa stok fotoğraf).
> Ürün sayfasında "Sepete ekle / Rezervasyon yap" gerçek sepete yazar
> (`useCart`), tutar sunucuda yeniden hesaplanır. Tekne/villa/transfer/vize
> kartları kendi detay sayfalarına gider (`Product.href`).
>
> Bu dokümanın geri kalanı önceki `tur-vitrini` uyarlamasının kaydıdır; o
> bileşenler (`components/b2c/StorefrontFrame`, `StorefrontHome`,
> `UrunKarti`…) modül liste/detay sayfalarında ve sepet/ödeme akışında hâlâ
> kullanılır. Omurga kararları (kiracı çözümü, `SiteConfig`, sipariş RPC,
> `kalemler()`) değişmedi. Seyyah bileşenlerindeki Türkçe metinler i18n
> dışında — birebir kopya tercih edildi.
>
> Tanıtım sayfası (`/`): Seyyah landing'i `src/app/(site)/**` ve
> `src/components/landing/**` altında; `data-surface="landing"`.

`tur-vitrini` referans arayüzünün acentenin hazır müşteri sitesine (`/magaza`,
kodda "vitrin") uygulanması.

Bu doküman vitrini yeniden giydirecek geliştirici için yazıldı. Referans
doküman ([docs/tur-vitrini-referans.md](docs/tur-vitrini-referans.md)) **ne
taşınacağını** anlatıyor; bu doküman **buraya nasıl oturacağını, nelerin
değişmeyeceğini ve nerede kırılacağını** anlatıyor. İkisi birlikte okunur;
"§" ile verilen bölüm numaraları bu dokümanın, "ref §" ile verilenler
referansın bölümleridir.

Önce okunacaklar: [README](README.md) "Vitrin" ve "Site tasarımı" bölümleri,
[DESIGN.md](DESIGN.md), `src/lib/design-tokens.ts`, `src/lib/site/config.ts`.

---

## 0. Tek paragraf özet

Vitrin bugün çalışıyor: kiracı adresten çözülüyor, içerik tablodan geliyor,
acente `/extranet/site` editöründe bölümleri diziyor, sipariş sunucuda
açılıyor. Değişecek olan **görünüm ve etkileşim katmanı**: beyaz kâğıt zemin,
Figtree + Mulish, 14 px kart, iki satırlı yapışkan başlık, sekmeli arama,
gerçek görsel, takvim bileşeni, bölüm çubuğu, akordeon SSS, tek kaynaklı tutar
dökümü. Değişmeyecek olan **omurga**: token katmanı ve kontrast kapısı, kiracı
çözümü, `SiteConfig` ve editör, anonim okuma, `create_storefront_booking`,
i18n, kuruş cinsinden para.

---

## 1. Kapsam

| Yüzey | Bu dokümanda |
|---|---|
| `/magaza/**` (vitrin) | Konunun kendisi |
| `/site-onizleme` | Aynı bileşenler; önizleme kuralları §8 |
| `/extranet/site` editörü | Yalnız yeni alanlar için form (§6) |
| `/extranet/**`, `/admin/**`, `/` | **Dokunulmaz.** Barlow ve mevcut palet kalır |

Mekanizma: vitrin kökü (`StorefrontFrame`) `data-surface="vitrin"` alır; token
ezmeleri `globals.css` içinde `[data-surface="vitrin"]` seçicisi altında yaşar.
Bu, `[data-density="compact"]` ile aynı kalıp: iki yüzey, tek stil dosyası,
tek bileşen kümesi. Extranet'e hiçbir vitrin stili sızmaz.

---

## 2. İki proje arasındaki fark

Referans tek firma için yazılmış, veritabanı olmayan bir vitrin; burası çok
kiracılı bir platform. Referans dokümandaki şu varsayımlar burada geçerli
değil:

| Referansta | Burada | Sonuç |
|---|---|---|
| Renkler `@theme` içinde sabit hex | Bileşen ham hex kullanamaz; roller `:root`'ta, `npm run test` denetler | Referans renkleri rol tokenına çevrilir (§3.1), `design-tokens.ts` sözleşmesine eklenir |
| Aksan `#c43d23` sabit | Aksan = kiracının marka rengi (`BRAND_PALETTE`, `themeVars`) | Fiyat ve birincil eylem `text-action` / `bg-action`; kontrastı motor zorlar |
| Veri `src/data/*.ts` | `tour`, `boat`, `villa`, `vehicle`, `visa_product`, `tenant_site`, `tenant_profile`; anon RLS | Kiracı vitrininde hiçbir sayfa mock basmaz (bugün üç sayfa basıyor, §4.6) |
| Firma bilgisi `firma.ts` | `tenant_profile` + `tenant_site.published` | Logo için `tenant_branding.logo_path` var, yükleme arayüzü yok (§10) |
| Metinler bileşende Türkçe sabit | Hepsi `messages.ts`, tipli anahtar | Yeni her metin `b2c.*` anahtarı alır |
| Fiyat istemcide `kalemler()` / `toplam()` | Tutar sunucuda, RPC içinde | İstemci dökümü "tahmini"; onay ekranı yalnız sunucu değerini basar |
| Rezervasyon sunucuya gitmez | `create_storefront_booking` → `PENDING` | Adımlar değişir, uç nokta aynı |
| Sayfa yapısı sabit | Ana sayfa `config.sections` sırası; "açık olması yetmez, içeriği de olmalı" | Yeni bölüm ve alan `SiteConfig`e girer, `normalizeSite` doğrular |
| Tek görünüm | Aynı bileşen vitrinde ve editör iframe'inde (`preview`) | Yeni istemci bileşenleri `preview`'ı tanımak zorunda (§8) |

---

## 3. Tasarım sistemi uyarlaması

### 3.1 Renk

Vitrin kapsamında ezilen roller. Değerler referanstan, isimler bizim:

| Rol | Platform | Vitrin | Referanstaki adı |
|---|---|---|---|
| `--paper` | `#f0f2ef` | `#f5f6f7` | `ground` — sayfa zemini |
| `--surface-base`, `--surface-raised` | `#ffffff` | `#ffffff` | `paper` — kart ve panel |
| `--surface-sunken` | `#e4e8e3` | `#eef1f3` | `sunken` — çukur alan |
| `--border-default` | `#d2d8d1` | `#e3e7ea` | `line` — dekoratif ayraç |
| `--border-strong` | `#7b877c` | `#7b877c` **(değişmez)** | `line-strong` `#c6ced5` **alınmaz** |
| `--text-primary`, `-secondary`, `-muted` | değişmez | değişmez | `ink`, `ink-2`, `muted` |
| `--surface-inverse` | `#16242b` | değişmez | kalkış bandı ve altbilgi |

İki not:

- Referansın girdi sınırı `#c6ced5` beyaz üzerinde 1.9:1 verir; WCAG 1.4.11
  arayüz sınırı için 3:1 ister. READINESS'ta aynı sınıf hata bir kez
  düzeltildi (`--border-strong` 2.19 → 3.0+); geri alınmaz.
- Metin rolleri bizim değerlerle kalır. Yeni zeminler eskilerinden daha açık,
  dolayısıyla her oran yükselir; ama sözleşmeye yine de eklenir (§7).

**Aksan.** Fiyat ve birincil eylem `--action-primary`, yani kiracının
`theme.brand` seçimi. Referansın "aksanı değiştirirseniz iki yönü de ölçün"
uyarısı burada motorun işi. `deriveActionTokens` bugün yalnız beyaz üstünde
4.5:1 arıyor; fiyat metni artık `--paper` (`#f5f6f7`) ve `--surface-sunken`
(`#eef1f3`) üstüne de düşecek ve bu zeminlerde oran yaklaşık yüzde yedi
geriler. Kural: **motor eşiği en koyu açık zemin (`#eef1f3`) üzerinden
arar.** Paletin mevcut on rengi zaten geçiyor (en açığı Kiremit `#a34a1e`,
çukurda ≈5.2:1); kural ileride palete eklenecek renk için var. Tema motoru
testlerine bir satır eklenir.

**Semantik renkler.** Referansın `score`, `amber`, `info` tokenları için yeni
rol açılmaz; mevcut durum renkleri karşılar:

| Referans | Burada | Not |
|---|---|---|
| `score` zemin + beyaz metin | `bg-success text-ink-inverse` | Yorum verisi yok, bugün çizilmez (§5) |
| `amber` kategori etiketi + `amber-ink` | `bg-warning-tint text-warning` | 5.39:1, sözleşmede var |
| `info` rozet | `bg-info-tint text-info` | |
| `accent-soft` seçili kart zemini | `bg-action-tint` | Motor türetir |

### 3.2 Tipografi

**Karar:** vitrin **Figtree** (başlık, buton, etiket, sayı) + **Mulish**
(akan metin) kullanır. Barlow platformun sesi: operatörün aleti, tabela
groteski. Vitrin acentenin sesi ve okuyan kişi tatil planlayan müşteri.
DESIGN.md'deki "ikinci display ailesi eklenmedi" kararı **yalnız vitrin
için** bozuluyor; extranet, admin ve tanıtım sayfası Barlow kalır.

Nasıl:

- Fontlar `src/app/magaza/layout.tsx` ve `src/app/site-onizleme/page.tsx`
  içinde `next/font/google` ile yüklenir: `subsets: ["latin", "latin-ext"]`
  (Türkçe diakritikler için zorunlu), `variable: "--font-figtree"` /
  `"--font-mulish"`, `display: "swap"`. `className` vitrin köküne verilir,
  kök layout'a girmez; extranet bu dosyaları indirmez.
- `globals.css` `@theme inline` bugün doğrudan `--font-barlow` ve
  `--font-barlow-sc`'ye bağlı. Araya iki semantik değişken girer:

  ```css
  :root {
    --font-body: var(--font-barlow), ui-sans-serif, system-ui, sans-serif;
    --font-display: var(--font-barlow-sc), var(--font-barlow), ui-sans-serif, sans-serif;
  }
  [data-surface="vitrin"] {
    --font-body: var(--font-mulish), ui-sans-serif, system-ui, sans-serif;
    --font-display: var(--font-figtree), ui-sans-serif, system-ui, sans-serif;
  }
  @theme inline {
    --font-sans: var(--font-body);
    --font-dense: var(--font-display);
  }
  ```

  Böylece b2c bileşenlerindeki `font-dense` sınıfı dokunulmadan Figtree'ye
  döner. Neden dolaylama şart: `@theme inline` değeri yardımcıya gömer;
  tema değişkenini kapsamda ezmek işe yaramaz, ancak onun **işaret ettiği**
  değişken ezilebilir.
- Ağırlıklar: Figtree 600/700, Mulish 400 (altı dosya). İlk ölçüm 500/600/700
  + 400/600 ile bütçeyi aştı; `font-medium` isteyen yerler en yakın ağırlığa
  düşer. Vitrin başlıklarında 700 serbest (DESIGN.md'deki "700 yok" kuralı
  Barlow için).
- Bütçe (ölçüldü, 9 Ekim 2026): asıl maliyet yeni aileler değildi. Kök
  layout Barlow + Barlow Semi Condensed'i **ön yüklüyordu** (`next/font`
  varsayılanı): vitrin hiç kullanmadığı 12 dosyayı (~150 KB) indiriyordu.
  Kökte `preload: false`, Extranet ve Admin kabuğunda `lib/platform-fonts.ts`
  ile ön yükleme. Sonuç `/magaza` 396 KB → **309 KB**, `/magaza/p-balon`
  392 → **305 KB** (sınır 450). Tanıtım sayfası da 376 → 348. Sınır yine
  aşılırsa **Barlow'a dönülür** — bu dokümanın geri kalanı fonttan bağımsızdır.
- Ölçek (ref §3) bizim sınıflarla:

  | Yer | Sınıf |
  |---|---|
  | Sayfa başlığı | `font-dense text-[clamp(1.8rem,3.8vw,2.7rem)] font-bold` |
  | Bölüm başlığı | `font-dense text-[21px] font-bold` |
  | Kart başlığı | `font-dense text-[17px] font-semibold` |
  | Gövde | `--font-ui` (15 px, comfortable) — değişmez |
  | Etiket | `text-[12.5px] font-semibold text-ink-3` |
  | Künye | `text-[11.5px] text-ink-3` |

  `.tnum` hizalanması gereken her sayıda: fiyat, tarih, sayaç, kolon.

### 3.3 Yarıçap ve gölge

| Token | Platform | Vitrin, `radius: "soft"` | Vitrin, `radius: "sharp"` |
|---|---|---|---|
| `--radius` (buton, girdi, rozet) | 4 px | **10 px** | 4 px |
| `--radius-lg` (kart, panel, açılır kutu) | 8 px | **14 px** | 6 px |
| Hap (sekme, çip, avatar) | `rounded-full` | aynı | aynı |

`StorefrontFrame` bugün soft → 6/12, sharp → 2/3 basıyor; o iki satır
yukarıdaki değerlere çekilir. Editördeki "Köşeler" seçimi aynen kalır.

Gölge: `:root`a iki rol eklenir ve b2c'deki kullanımlar buna döner.
Başlangıç değerleri (mürekkep tonuyla, ölçüp ayarlanır):

```css
--shadow-card: 0 1px 2px rgba(22, 36, 43, 0.06), 0 1px 3px rgba(22, 36, 43, 0.08);
--shadow-lift: 0 2px 6px rgba(22, 36, 43, 0.08), 0 12px 32px rgba(22, 36, 43, 0.14);
```

`--shadow-raised` → `--shadow-card`, `--shadow-float` (arama çubuğu) →
`--shadow-lift`. `--shadow-chip` kalır.

### 3.4 `@layer base` — en önemli kural, ve mevcut bir kusur

Tailwind v4 yardımcıları `@layer utilities` içinde üretir. **Katmansız CSS,
özgüllüğü ne olursa olsun katmanlı CSS'i ezer.** Referans projede
`h1..h4 { margin: 0 }` katmansız yazıldığı için bütün `mt-*` yardımcıları
sessizce iptal olmuştu (ref §3).

Bizde aynı tuzak muhtemelen bugün açık: `globals.css` içindeki
`* { min-inline-size: 0 }` katmansız. `min-inline-size` ile `min-width`
aynı kaskad grubunda değerlendirilir; dolayısıyla `min-w-56`
(`SearchBar.tsx:59`), `min-w-36`, `min-w-[1.75rem]` (`SupplierMark.tsx:30`)
gibi yardımcılar büyük olasılıkla etkisiz. Faz 1'in ilk işi bunu tarayıcıda
doğrulamak ve düzeltmek:

- `*`, `html`, `body` kuralları `@layer base` içine.
- `.tnum`, `.sr-only`, `.rule-b`, `.skeleton`, `.price-settle`, `.row-in`
  `@layer components` içine (yardımcılar bunları ezebilsin).
- Vitrin için eklenecek **her** element kuralı, örneğin
  `[data-surface="vitrin"] :is(h1,h2,h3,h4) { font-family: var(--font-display) }`,
  katman içinde.

### 3.5 İkonlar

Referansın `icons.tsx` dosyası (28 ikon, `currentColor`, sıfır bağımlılık)
olduğu gibi `src/components/b2c/icons.tsx` olarak alınır. `StorefrontFrame`,
`ProductCard` ve `StorefrontHome` içindeki satır içi SVG'ler (telefon,
WhatsApp, sepet, saat, dünya, arama, iğne, takvim, kişi) oradan beslenir.

---

## 4. Sayfa ve bileşen eşlemesi

| Referans | Bizde bugün | Karar |
|---|---|---|
| `TopBanner` | yok | **Yeni.** `nav.announcement` (§6); `useSyncExternalStore` + `localStorage`; önizlemede kapatılamaz |
| `SiteHeader` iki satır, yapışkan, `--header-h` | `StorefrontFrame`: tek satır `h-14`, yapışkan değil, üstte iletişim bandı | **Yeniden yazılır** §4.1 |
| `SiteFooter` güven şeridi + 4 kolon + telif | koyu 4 kolon + telif | Koyu kalır (AA ölçülü, her kiracıda okunur); üstüne güven şeridi |
| `HeroSearch` dört sekme | `SearchBar` üç alan, yalnız tur | **Yeniden yazılır** §4.2 |
| Güven şeridi | `TrustStrip` | Kalır; rozet biçimi referansa göre |
| Ürün şeritleri | `tours` → `ProductCard` ızgara; modüller → `ModuleCarousel` | Tek kart (§5), şerit düzeni korunur |
| Kampanya bandı | yok | **Alınmaz** — kampanya veri modeli yok; `custom` bölüm aynı işi görür |
| Vize bandı, `VizeCard` | `visa` bölümü, `ModuleCardBody` | Vize kartı yıldız ve rozet basmaz; birim "başvuru başı" |
| `Catalog` filtre rayı + sıralama + ızgara | `StoreSearchResults`: çip + sıralama, durum `useState` | **Yeniden yazılır** §4.3 |
| `ProductCard`, `ProductMedia` | `ProductCard` (tur) + `ModuleCardBody` (diğer), ton zemin | **Birleştirilir** §5; gerçek görsel §4.4 |
| `Gallery` kapak + şerit + künye | `GalleryGrid` ton kutuları | **Yeniden yazılır** `media_asset` üstünden §4.4 |
| `SectionNav` | yok | **Yeni**, detay sayfalarında §4.5 |
| `Reviews` | yok, veri de yok | **Alınmaz.** `reviewCount = 0` iken puan hiçbir yerde çizilmez |
| `SSS` `<details>` akordeon | ana sayfada `dl`; `/magaza/sss` **mock metin** | **Yeni bileşen**; kaynak `faq` bölümü §4.6 |
| `DateField` | yerel `<input type="date">`, 7 yerde | **Alınır** §4.7 |
| `BookingBox` | `StickyBookingWidget` (tur → sepet) | Kalır, yeniden giydirilir §4.7 |
| `TransferBooking`, `VillaBooking`, `VizeBooking` | `RequestForm` (`kind` ile dallanır) | Kalır; tarih/saat ve hata metni değişir §4.7 |
| `RezervasyonAkisi` üç adım, URL durumu | `StoreCart` → `StoreCheckout` tek sayfa | Adım göstergesi ve doğrulama kuralı alınır; URL durumu alınmaz §4.8 |
| `OzetKarti` | checkout'ta sağ kutu | Ayrı bileşen, `kalemler()` okur §4.8 |
| `rezervasyon/onay` | `/magaza/onay/[ref]` sunucudan | Kalır; yalnız stil |
| `gorsel-kaynaklari` | yok | **Alınmaz** — görseller acentenin kendi yüklemesi, lisans künyesi yok |
| `format.ts` | `lib/i18n` biçimlendiricileri | Para ve tarih biçimi bizde kalır; yalnız takvim matematiği alınır §4.7 |

### 4.1 Başlık

İki satır, her genişlikte sabit yükseklik, yapışkan:

```
┌ iletişim bandı (telefon · WhatsApp) — yalnız veri varsa, YAPIŞKAN DEĞİL ─┐
├ 1. satır h-16: logo/ad · arama alanı · sepet · acente girişi ────────────┤
├ 2. satır h-10: modül sekmeleri (otomatik) · ek bağlantılar ──────────────┤
└──────────────────────────────────────────────────────────────────────────┘
```

- `--header-h: 106px` (64 + 40 + iki 1 px çizgi) vitrin kapsamında tanımlanır.
  İletişim bandı başlığın **dışında** kalır ki `--header-h` sabit kalsın.
  Referansın notu geçerli: yükseklik genişliğe göre değişirse mobilde 10 px
  kayma oluşur.
- Logo: `tenant_branding.logo_path` doluysa `next/image`, değilse acente adı
  `font-dense`. Yükleme arayüzü yok (§10); bugün hepsi ad basar.
- Arama alanı: `name="nereye"`, GET `/magaza/tur-arama` — bugünkü katalog bu
  parametreyi zaten süzer. Dar ekranda alan gizlenir, büyüteç ikonu ana
  sayfada `#arama`ya, diğer sayfalarda `/magaza/tur-arama`ya gider.
- İkinci satır: `moduleNavLinks` + `config.nav.links` (bugünkü kural). Dar
  ekranda yatay kayar, sepet yerinde kalır (bugünkü davranış). Aktif sekme
  **renkle değil** alt kenarda 2 px çizgiyle işaretlenir.
- `theme.header` (açık/koyu) iki satıra da uygulanır. Koyu başlıkta odak
  halkası aksan rengi zeminle karışabilir: `.bg-inverse :focus-visible`
  için `outline-color: var(--text-inverse)` ezmesi.
- Yapışkan olan her şey — `SectionNav`, rezervasyon kutusu, özet kartı —
  `top` değerini `var(--header-h)` üzerinden alır.

### 4.2 Sekmeli arama

Sekmeler = açık **ve** içeriği olan modül bölümleri. Menüyle aynı kural,
aynı fonksiyon (`sectionHasContent`). Tek modüllü acentede sekme çubuğu
çizilmez, yalnız alanlar görünür.

| Sekme | Alanlar | Hedef (GET) |
|---|---|---|
| Turlar | `nereye` metin · `tarih` (`DateField bare`) · `kisi` | `/magaza/tur-arama` — üçü de bugün süzer |
| Transferler | `nereden` · `nereye` · `tarih` · `saat` (liste) | `/magaza/transferler` |
| Tekneler | `tarih` · `kisi` | `/magaza/tekneler` |
| Villalar | `giris` · `cikis` (çıkış > giriş zorlanır) · `kisi` | `/magaza/villalar` |
| Vize | `ulke` metin | `/magaza/vize` |

- Form sunucu bileşenidir, tarayıcının GET gönderimi yeter; istemci kodu
  yalnız `DateField` ve sekme geçişi.
- Faz 1'de sekmeler yalnız yönlendirir; parametreler URL'de durur, kaybolmaz.
  Faz 2'de `ModuleListPage` bunları okur, listeyi süzer ve detay
  bağlantılarına taşır; detaydaki `RequestForm` ön-dolar.
- Önizlemede alanlar `disabled`, `action` yok (bugünkü kalıp).
- Kahraman düzeni (`split` / `centered`) ve "arama kartı kahramanın alt
  kenarına taşar, dar ekranda akışta durur" davranışı korunur.

### 4.3 Katalog

`/magaza/tur-arama` ve dört modül liste sayfası aynı iskeleti alır:

- Masaüstünde sol filtre rayı, dar ekranda "Filtrele" düğmesiyle açılan
  panel; üstte sonuç sayısı ve sıralama; ızgara `sm:2 lg:3`.
- **Filtre durumu URL'de** (ref §6 "durum URL'de taşınır"):
  `?nereye&tarih&kisi&kategori&sure&iptal=ucretsiz&dil=TR&sirala=fiyat`.
  `useSearchParams` + `router.replace`; bağlantı paylaşılabilir, geri tuşu
  adım atlamaz, yenilemede filtre kalır. Bugünkü `useState` çipleri kalkar.
- Tur filtreleri ve kaynakları: kategori (`tour_category_link`), süre (yarım
  gün ≤ 4 sa / tam gün / çok gün — `durationMinutes`), ücretsiz iptal
  (`cancellation.type`), dil (`languages`), fiyat aralığı (satış fiyatı).
  Modüller: tekne kapasite ve kaptan; villa kişi ve bölge; transfer tip;
  vize ülke.
- `FilterChipBar` primitive'i rayın içinde yeniden kullanılır.
- Referansın "arama kutusu `q` gönderir ama katalog okumaz" eksiği burada
  yok: `nereye` zaten süzer.
- Önizlemede `router.replace` iframe adresini değiştirir; `preview` iken
  URL yerine yerel durum kullanılır (§8).

### 4.4 Görsel

**Ön koşul:** `media_asset.storage_path` ya da `external_url` dolu kayıt
bugün yok; kova ve yükleme arayüzü yazılmadı. Bu dokümanın kapsamı dışında,
ama bileşen bugünden hazır olur:

- `ProductMedia`: `next/image`, `fill`, `sizes`, `alt = media_asset.alt`.
  Kaynak yoksa bugünkü ton zemin ve parlama. `priority` yalnız detay
  kapağında.
- `getStorefrontData`, `toResult` ve `gallery()` kapak seçimini zaten yapıyor
  (`is_cover`, `position`); yalnız `storage_path` / `external_url` dönülür ve
  `photoUrl` üretilir. Depo yolu için
  `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/<kova>/<yol>`.
- `next.config.ts`: `images.remotePatterns` — Supabase host ve `external_url`
  için **sayılı** izinli hostlar; serbest host açılmaz. CSP `img-src` aynı
  hostları alır (rapor modunda olsa da şimdi eklenir; enforce'a geçince
  unutulmasın).
- `Gallery`: kapak + küçük resim şeridi; seçili küçük resim kapağı değiştirir
  (küçük istemci bileşeni); altta künye satırı (`alt`).

### 4.5 Detay sayfası

Bölüm sırası ve `SectionNav` öğeleri (yalnız içeriği olan bölüm öğe alır):

Özet → Program (tur) → Fiyatlar ve kalkışlar / Fiyatlar → Özellikler ve
teknik → Dahil ve hariç → Bilinmesi gerekenler → Buluşma noktası / Konum →
İptal koşulları → Sıkça sorulanlar (site geneli, varsa) → Benzer ilanlar.

- `SectionNav`: istemci, `IntersectionObserver`, `sticky top-[var(--header-h)]`;
  bölüm listesi sunucudan prop olarak gelir. Hash bağlantıları önizlemede de
  serbest (iframe içinde kalır).
- Rezervasyon kutusu: yapışkanlık **ızgara hücresinde**
  (`<aside className="lg:sticky lg:top-[calc(var(--header-h)+2.5rem)] lg:self-start">`).
  `StickyBookingWidget` içindeki ikinci `sticky` ve `aside` kaldırılır —
  bugün çift yapışkan.
- Mobilde alt sabit çubukta yalnız fiyat + birincil eylem; form alanı yok
  (bugün doğru; ref §6 "form kutusu tek kopya").
- Puan ve yorum: veri yok, çizilmez. Uydurma sayı, uydurma yorum yok.

### 4.6 SSS ve içerik sayfaları — mock sızıntısı

Bugün `/magaza/sss`, `/magaza/iptal-iade` ve `/magaza/kvkk` kiracı vitrininde
de platformun örnek metnini basıyor ("Balon turu hava koşulları…", Göreme
adresi) ve altbilgi bunlara bağlantı veriyor. Bir acentenin sitesinde başka
bir firmanın şartları duruyor. Karar:

| Sayfa | Kaynak | Boşsa |
|---|---|---|
| `/magaza/sss` | `faq` bölümünün gövdesi (`parseFaq`) → `SSS` akordeonu | `notFound()`, altbilgi bağlantısı çizilmez |
| `/magaza/iptal-iade` | `SiteConfig.pages.iptalIade` (§6) | aynı |
| `/magaza/kvkk` | `SiteConfig.pages.kvkk` (§6) | aynı |
| `/magaza/hakkimizda`, `/magaza/iletisim` | `tenant_profile` — bugün doğru | — |

- `SSS` bileşeni: yerel `<details>/<summary>`, JavaScript'siz çalışır,
  klavyeyle gezilir. Ana sayfadaki `faq` bölümü de aynı bileşeni kullanır.
- `localhost` demo vitrini mock metinleri korur (banner zaten örnek olduğunu
  söylüyor).

### 4.7 Tarih, saat ve rezervasyon kutuları

**`DateField`** referanstan `src/components/b2c/DateField.tsx` olarak, aynı
props ile alınır (`label, value ISO, onChange, name, min, minNote, bare,
mode: "gelecek" | "gecmis"`). Takvim matematiği `src/lib/storefront/tarih.ts`:
`parseDate, toISO, addDays, nightsBetween, daysInMonth, firstWeekdayOffset,
monthTitle, WEEKDAYS` (pazartesi başlangıçlı, UTC hesap). Para ve tarih
**biçimlendirme** alınmaz; `formatShortDate`, `formatMoney` bizde.

- Takvim yalnız açıkken render edilir: sunucuda `new Date()` çalışmaz,
  hidrasyon uyuşmazlığı olmaz.
- Saat: `<input type="time">` yerine 30 dakika adımlı `<select>` (tekne,
  transfer). Yerel girdi tarayıcı diline göre `02:30 PM` gösterir.
- Yerine konacağı yerler: `RequestForm` (6 yerel girdi), `StorefrontHome`
  arama çubuğu (1). Faz 3 sonunda `grep 'type="date"\|type="time"'`
  vitrinde sıfır döner.
- `RequestForm` bugün `useState` başlangıcında `today()` ile `new Date()`
  okuyor; sunucu ve istemci farklı gün üretebilir. Başlangıç boş kalır,
  `min` takvim açılırken hesaplanır.

**Hata metni.** `StoreCheckout.Text` ve `RequestForm.Field` hatayı `<label>`
içine basıyor; ekran okuyucu alan adını ve hatayı tek cümle okur ("Ad soyad
En az 2 harf yazın"). Referans kuralı: hata `<p id>` label dışında, girdide
`aria-describedby` + `aria-invalid`. Ortak `primitives/Field.tsx` aynı kusuru
taşıyor; vitrin bileşenleri düzeltilir, extranet ayrı iş olarak not edilir.

**`StickyBookingWidget`** (tur → sepet): fiyat başlığı `text-action`, "kişi
başı" etiketi, eğik "son yer" damgası kalır. Kalkış seçimi `<select>` yerine
`DateField` (yalnız `departureDays` içindeki günler açık) + o güne ait saat
listesi. Döküm `kalemler()` ile (§4.8). Sepete ekleme onay sormaz, "geri al"
sunar (bugünkü davranış, kalır).

**`RequestForm`** (tekne, villa, transfer, vize → doğrudan talep): yapı
kalır; tarih ve saat alanları yukarıdaki gibi, tahmini tutar `kalemler()`,
"Fiyat acente tarafından teklif edilir" durumu korunur.

### 4.8 Tutar ve ödeme adımları

**Tek kaynak:** `src/lib/storefront/kalemler.ts` (hesap, içe alma yok) +
`kalem-etiket.ts` (satır metni, i18n).

```ts
type Secim =
  | { kind: "tur"; birimFiyat: number; kisi: number }
  | { kind: "tekne"; model: "saatlik" | "cokGunlu" | "kisiBasi"; /* saat, adet, kişi, kaptan */ }
  | { kind: "villa"; gecelik: number; gece: number }
  | { kind: "transfer"; saatlik: number | null; saat: number }
  | { kind: "vize"; birimFiyat: number; kisi: number };

kalemler(secim): Kalem[]          // tipli satırlar: kisi | saat | gece | gun | indirim | kaptan
toplam(secim): number | null      // kuruş; kalem yoksa (teklifle) null
kalemEtiketi(kalem, currency)     // "₺1.450 × 3 kişi"
```

Widget dökümü, `RequestForm` tahmini, sepet satır tutarı ve checkout özeti
hepsi bunu çağırır; üç ekranda üç farklı rakam çıkması mümkün olmaz.
`salePrice` ile uyumlu (marj 0). Değişmeyen kural: **sunucu kendi hesaplar,
istemci fiyat göndermez.** Onay sayfası (`order-read.ts`) yalnız sunucu
değerini basar; istemci tahminiyle farklıysa sunucu kazanır.

**Checkout:**

- İki adımlı gösterge (Bilgiler → Onay), `<nav aria-label>`. Üç adım yok:
  ödeme bu platformda alınmaz.
- `OzetKarti` sağda yapışkan, `lg:top-[calc(var(--header-h)+2.5rem)]`.
- Doğrulama gönderimde; bir kez hata veren alan düzeltilirken anında yeniden
  denetlenir (ref §6). Yazarken kırmızıya boyanmaz.
- Sepet `sessionStorage`'da, sekme başına kalır (DESIGN.md kararı). Referansın
  URL durumu alınmaz: sepet çok kalemli ve istemci fiyat taşımaz.
- Misafir devam tek yol; hesap yok.

---

## 5. Kart veri modeli

Referansın tek `ProductCard`'ı dört tip için `kind`'e göre dallanıyor. Bizde
`ProductCard` (`SearchResult`) ve `ModuleCardBody` (`ModuleItem`) iki ayrı
kart. Birleştirilir:

```ts
export type KartUrun = {
  kind: "tur" | "transfer" | "tekne" | "villa" | "vize";
  id: string;
  href: string;
  title: string;
  subtitle: string;
  photo: { url: string; alt: string } | null;   // yoksa `tone`
  tone: string;
  price: number | null;                         // kuruş; null → "fiyat teklifle"
  currency: string;
  priceUnit: "kisiBasi" | "aracBasi" | "saatlik" | "gecelik" | "gunluk" | "basvuruBasi";
  badge: "sonYerler" | "oneCikan" | null;
  meta: string[];                               // en çok 3: süre, dil, kapasite…
  freeCancelHours: number | null;
  rating: { score: number; count: number } | null; // veri yok, bugün hep null
};
```

`priceUnit` kritik — kartın yanlış birim yazmaması buna bağlı:

| Tip | Fiyat kaynağı | Birim |
|---|---|---|
| Tur | `tour_age_tier` yetişkin ya da kalkış `price_override` | kişi başı |
| Transfer, `saatlikKiralama` | `vehicle.hourly_rate` | saatlik |
| Transfer, `rotaBazli` | yok → `price: null` | "fiyat teklifle" |
| Tekne, `saatlik` | `boat.hourly_rate` | saatlik |
| Tekne, `cokGunlu` | `multiday_unit_price` | `multiday_unit`: gecelik / günlük |
| Tekne, `kisiBasi` | `per_person_price` | kişi başı |
| Villa | `nightly_rate` | gecelik |
| Vize | `visa_product.price` | başvuru başı |

Rozet: `sonYerler` kalan ≤ 6; `oneCikan` `tour.featured`. İkisi birden ise
`sonYerler`. Adaptörler (`toKart`) `site/load.ts` ve `storefront/tours.ts`
içinde; `StoreSearchResults`, `ModuleGrid`, `ModuleCarousel` ve detaydaki
"benzer ilanlar" tek `UrunKarti` bileşenini kullanır.

---

## 6. `SiteConfig` değişiklikleri

| Alan | Tür | Varsayılan | Kullanıldığı yer | Editör paneli |
|---|---|---|---|---|
| `nav.announcement` | string ≤ 160 | `""` | `TopBanner` | Menü |
| `pages.iptalIade` | string ≤ 20 000 | `""` | `/magaza/iptal-iade` | **Yeni: Sayfalar** |
| `pages.kvkk` | string ≤ 20 000 | `""` | `/magaza/kvkk` | Sayfalar |
| `theme.radius` | değişmez | | değer eşlemesi değişti (§3.3) | — |

- `SITE_VERSION` 1 kalır: `normalizeSite` eksik alanı varsayılanla doldurur,
  eski taslak yeni sürümle açılır.
- `tests/site.test.ts`'e: bilinmeyen `pages` anahtarı atılır, uzunluk
  kırpılır, boş duyuru banner üretmez.
- Editörde "boş — gizlenir" etiketi `pages` alanları için de çıkar
  (`isEmpty`, `emptyHint`).

---

## 7. Erişilebilirlik

Referans §8 kuralları + bu depodaki kapı:

- **Kontrast sözleşmesi.** `design-tokens.ts` `SURFACES`a `vitrinKâğıt
  #f5f6f7` ve `vitrinÇukur #eef1f3` eklenir, `LIGHT_SURFACES`'a girer; metin
  rolleri ve `--border-strong` (3:1) bu zeminlerde de denetlenir.
  `--border-default` vitrin değeri `#e3e7ea` muafiyet notuna eklenir
  (dekoratif). `tokens.test.ts`'in "CSS ile sözleşme aynı" denetimi kapsamlı
  değerleri de okuyacak şekilde genişletilir.
- **Aksan motoru** eşiği `#eef1f3` üstünden (§3.1).
- **axe taraması** (`npm run budget`): sayfalara `/magaza/tekneler`, bir
  detay ve `/magaza/odeme` eklenir. Betik bugün kiracısız `/magaza`yı (demo)
  ölçüyor; kiracı vitrini için `BUDGET_HOST=firma.localhost:3100` desteği
  eklenmeli, yoksa yeni bileşenlerin yarısı hiç ölçülmez.
- Hata metni `aria-describedby`, label dışında (§4.7).
- Takvimde gün düğmesinin `aria-label`'ı tam tarih ("4 Ekim 2026 Pazar"),
  ay ve yıl `<select>`.
- Akordeon yerel `<details>`.
- Renk tek başına anlam taşımaz: son yer damgası metinli, aktif sekme çizgili,
  puan çubuğu olsaydı yanında sayı.
- Dokunma hedefi (`pointer: coarse` altında 44 px) ve `prefers-reduced-motion`
  zaten global; dokunulmaz.
- Koyu başlıkta odak halkası (§4.1).

---

## 8. Önizleme kuralları

Aynı bileşen vitrinde ve `/extranet/site` editörünün iframe'inde çalışır.
Yeni her istemci bileşeni için:

- `preview` prop zinciri: `StorefrontFrame` → `StorefrontHome` → bileşen.
  Kök `data-preview` taşır; CSS tarafında `[data-preview] …` kullanılabilir.
- Bağlantılar `PreviewLink` ile etkisiz (`<span aria-disabled>`); formlar
  `disabled`, `action` yok; `TopBanner` kapatılamaz; `SectionNav` hash
  bağlantıları serbest; `DateField` açılabilir ama gönderilemez; `Catalog`
  önizlemede URL yerine yerel durum.
- `/site-onizleme` yalnız ana sayfayı gösterir; detay ve katalog önizlemesi
  kapsam dışı.
- Yayın `revalidatePath("/magaza", "layout")` çağırıyor; yeni sayfalar da
  `/magaza` altında, ek iş yok.

---

## 9. Uygulama planı

**Durum (9 Ekim 2026): üç faz uygulandı.** `npm run verify` yeşil (115 test),
`next build` geçti, `npm run budget` demo vitrinde axe 0 ihlal, transfer
309/305 KB (sınır 450), LCP 404/356 ms. Kiracı vitrini ölçümü için
`BUDGET_HOST` desteği hâlâ eksik (§7). Aşağıdaki plan uygulamanın kaydı
olarak duruyor; kabul ölçütleri geçerli.

Üç faz; her biri kendi başına yayınlanabilir. Süreler tahmin.

### Faz 1 — Tasarım sistemi (yaklaşık 1 gün)

Dosyalar: `globals.css`, `lib/design-tokens.ts`, `lib/theme.ts`,
`app/magaza/layout.tsx`, `app/site-onizleme/page.tsx`,
`components/b2c/StorefrontFrame.tsx`, `components/b2c/icons.tsx` (yeni),
`ProductCard.tsx` ve `StorefrontHome.tsx` (kart ve bölüm başlığı stili),
`next.config.ts` (`images`, CSP), tema ve token testleri.

İş: vitrin token kapsamı (§3.1), font dolaylaması ve Figtree/Mulish (§3.2),
yarıçap ve gölge (§3.3), `@layer` düzeni ve `*` kuralı doğrulaması (§3.4),
ikonlar (§3.5), iki satırlı başlık ve `--header-h` (§4.1), altbilgi güven
şeridi, kontrast sözleşmesi (§7).

Kabul:

- `npm run verify` yeşil; yeni token kuralları testte.
- `npm run budget`: vitrin sayfalarında LCP, CLS ve KB bütçede, axe 0.
- `/extranet` ve `/admin` görünümü değişmedi (öncesi/sonrası ekran
  görüntüsü).
- `firma.localhost:3000` beyaz zemin, Figtree başlık, yapışkan iki satır;
  `localhost:3000/magaza` demo banner'ıyla aynı görünüm.

### Faz 2 — Katalog ve detay (2–3 gün)

Dosyalar: `KartUrun` + `toKart` (`lib/site/load.ts`, `lib/storefront/tours.ts`),
`components/b2c/UrunKarti.tsx`, `ProductMedia.tsx`, `Gallery.tsx`,
`SectionNav.tsx`, `Catalog.tsx` (+ `StoreSearchResults`, `ModuleListPage`),
`SSS.tsx`, `HeroSearch.tsx`, `app/magaza/{sss,iptal-iade,kvkk}/page.tsx`,
`lib/site/config.ts` (`pages`), `SiteEditor.tsx` (Sayfalar paneli),
`lib/i18n/messages.ts`.

Kabul:

- Filtreler URL'de; bağlantı kopyalanıp açıldığında aynı sonuç.
- Modül liste sayfaları hero parametrelerini okur ve süzer.
- `/magaza/sss` kiracının metnini basar; boşsa 404 ve altbilgide bağlantı
  yok. Kiracı vitrininde "Kapadokya" kelimesi hiçbir sayfada geçmez.
- Detayda `SectionNav` başlığın altına yapışır, hiçbir bölüm başlığı
  örtülmez.
- Görsel yoksa ton; `storage_path` dolu test kaydında `next/image` basar.
- Önizleme iframe'inde hiçbir bağlantı dışarı çıkmaz.

### Faz 3 — Rezervasyon (2–3 gün)

Dosyalar: `components/b2c/DateField.tsx`, `lib/storefront/tarih.ts`,
`lib/storefront/kalemler.ts` (+ `tests/kalemler.test.ts`), `RequestForm.tsx`,
`StickyBookingWidget.tsx`, `StoreCart.tsx`, `StoreCheckout.tsx`,
`OzetKarti.tsx`, `TopBanner.tsx`, `lib/site/config.ts` (`announcement`),
`SiteEditor.tsx`.

Kabul:

- Vitrinde yerel `date` / `time` girdisi kalmadı.
- Hata metinleri label dışında, `aria-describedby` ile bağlı; axe 0.
- Widget, sepet ve checkout aynı `toplam()` rakamını basar (test: üç
  çağrı, tek sonuç).
- Sunucu toplamı istemci tahmininden farklıysa onay sayfası sunucuyu
  gösterir.
- Duyuru kapatılınca kapalı kalır; metin değişince geri gelir.

### Doğrulama

```bash
npm run verify                       # tip + lint + testler
npm run build && npx next start -p 3100 &
npm run budget                       # bütçe ve axe (demo vitrin)
BUDGET_HOST=firma.localhost:3100 npm run budget   # kiracı vitrini — Faz 1'de eklenir
grep -rn 'type="date"\|type="time"' src/components/b2c src/app/magaza   # Faz 3 sonunda boş
```

---

## 10. Dışarıda bırakılanlar

- **Görsel yükleme**: kova, yükleme arayüzü, `media_asset` yazımı. Ön koşul,
  ayrı iş. Bileşenler hazır bekler.
- **Logo**: `tenant_branding.logo_path` şemada var, arayüz yok. Başlık adı
  basar.
- **Yorum ve puan**: veri modeli yok. Çizilmez, uydurulmaz.
- **Kampanya bandı**: veri modeli yok; `custom` bölüm.
- **Koyu tema**, **çoklu dil**: referansla aynı gerekçe.
- **Ödeme**: platform tahsilat yapmaz; akış talep → acente onayı. 3D Secure
  yok.
- **Rota bazlı transfer fiyatı**: vitrin fiyat basmaz, "teklifle".
- **Önizlemede detay ve katalog**.
- **Pazaryeri ürünleri** vitrinde yok (README).
- **Extranet `Field` primitive'indeki hata metni** kusuru: vitrinle birlikte
  düzeltilmez, ayrı iş.

---

## 11. Tuzaklar

Referans §9 ile bu deponun kendi tuzakları:

| Sorun | Belirti | Çözüm |
|---|---|---|
| Katmansız taban CSS | `mt-*`, `min-w-*` sessizce iptal | `@layer base`; mevcut `*` kuralı (§3.4) |
| `@theme inline` ile font ezme | kapsamda font değişmez | `--font-body` / `--font-display` dolaylaması (§3.2) |
| Çift yapışkan | panel kendi boyunda kalır, kaydırınca çıkar | yalnız ızgara hücresi `sticky` |
| Form kutusu iki kopya | radyo grubu birleşir, masaüstü seçimi kaybolur | mobil çubukta yalnız fiyat + eylem |
| Yerel `date` / `time` | `mm/dd/yyyy`, `02:30 PM` | `DateField`, saat listesi |
| Sunucuda `new Date()` | hidrasyon uyuşmazlığı | takvim yalnız açıkken; `RequestForm` başlangıç boş |
| `DepartureBoard.todayLabel()` | önbellekli render'da eski tarih | istek anında render; ISR gelirse kısa `revalidate` |
| Ham hex | `tokens.test` kırılır | rol tokenı; yeni renk önce `design-tokens.ts` |
| Bileşende sabit metin | i18n dışı | `messages.ts`, `b2c.*` |
| Önizlemede gerçek bağlantı | editör iframe içinde kaybolur | `preview` zinciri (§8) |
| Mock sızıntısı | kiracı vitrininde başka firmanın şartları | §4.6 |
| Aksan açık zeminde | marka rengi fiyat metni olarak AA tutmaz | motor eşiği `#eef1f3` |
| `remotePatterns` eksik | `next/image` 400 | Supabase host + CSP `img-src` |
| Anon istemci yerine oturum | operatör başka vitrini "bulunamadı" görür | `createStorefrontClient` (çerez okumaz) — değişmez |
| React anahtarı metin | aynı etiketli iki çip, biri kaybolur | `id` anahtar (`Chips` bugün metni kullanıyor) |
| Font bütçesi | sayfa 450 KB'ı aşar | ağırlık düşür, sonra Barlow (§3.2) |
| `next/font` kökte ön yükleme | kullanılmayan aile de iner (~150 KB) | kökte `preload: false`; ön yükleme kullanan yüzeyin layout'unda |
| Test koşucusu `@/` çözmez | `ERR_MODULE_NOT_FOUND` | test edilen kütüphane hiçbir şey içe almaz (`kalemler.ts`), etiket ayrı dosyada |

---

## 12. Açık sorular

1. **Font.** Figtree/Mulish önerildi; `npm run budget` sonucuna göre
   kesinleşir. Barlow her an geri dönüş.
2. **Altbilgi tonu.** Referans renk vermiyor; koyu önerildi (ölçülü, her
   kiracıda okunur).
3. **`pages` metinleri** `SiteConfig` JSON'unda mı, `tenant_profile`
   kolonlarında mı? JSON seçildi: editörde birlikte yayınlanır, taslak/yayın
   ayrımı bedava. Bedeli: 40 KB'a kadar büyüyebilen bir `jsonb`.
4. **Logo yükleme** hangi faza girer? Görsel yüklemeyle birlikte, ayrı iş.
5. **Detayda SSS** site geneli mi, ürüne özel mi? Site geneli; ürün bazlı
   soru için veri yok.
