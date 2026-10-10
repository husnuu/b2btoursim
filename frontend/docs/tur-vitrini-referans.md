# Frontend referansı

> Bu dosya `tur-vitrini` projesinin frontend referans dokümanının kopyasıdır.
> Buradaki yolları ve bileşen adlarını **o** proje için okuyun; bu depoya nasıl
> uygulanacağı [../VITRIN.md](../VITRIN.md) içinde.

Bu arayüzü başka bir projede yeniden kullanacak geliştirici için yazıldı.
Ne olduğunu değil, **nasıl taşınacağını ve nerede tökezleyeceğini** anlatır.

Kaynak: `tur-vitrini` — 42 dosya, ~8.070 satır, 22 bileşen (11 istemci, 11 sunucu).

---

## 1. Yığın

| | |
|---|---|
| Çatı | Next.js 16.3.4, App Router |
| React | 19.2.8 |
| Stil | Tailwind CSS v4 (`@theme` ile token) |
| Dil | TypeScript 5, `strict: true` |
| Font | `next/font/google` — Figtree + Mulish |
| Görsel | `next/image`, dosyalar `public/` içinde |
| Durum | Yok. Zustand/Redux/Context yok; her şey ya props ya URL. |
| Veri | `src/data/*.ts` içinde düz TypeScript nesneleri |

Üçüncü parti UI kütüphanesi **yok**. Takvim, akordeon, sekme, adım göstergesi —
hepsi elle yazıldı. Bu bilinçli: dört bileşen için 200 KB bağımlılık taşımak
yerine, davranışı kontrol edilebilir tutuldu.

```bash
npm install
npm run dev      # http://localhost:3002
npm run verify   # typecheck + lint + build
```

---

## 2. Başka projeye taşıma

Üç kademede taşınabilir. Her kademe kendi başına çalışır.

### Kademe A — Sadece tasarım sistemi (~15 dakika)

Farklı bir ürün yapıyorsanız ama aynı görünümü istiyorsanız:

1. `src/app/globals.css` dosyasını kopyalayın.
2. `src/app/layout.tsx` içindeki font tanımlarını alın (`figtree`, `mulish`
   değişkenleri ve `<html className={...}>`).
3. `src/components/icons.tsx` dosyasını kopyalayın (28 ikon, sıfır bağımlılık).
4. `src/lib/format.ts` dosyasını kopyalayın (para, tarih, süre biçimlendirme).

Tailwind v4 kurulu olması yeterli. Başka hiçbir şey gerekmez.

### Kademe B — Katalog arayüzü (~1 saat)

Kademe A + ürün listeleme ve detay:

```
src/components/ProductCard.tsx      kart
src/components/ProductMedia.tsx     next/image sarmalayıcı
src/components/Catalog.tsx          filtre rayı + ızgara
src/components/Gallery.tsx          kapak + küçük resim şeridi
src/components/SectionNav.tsx       yapışkan bölüm çubuğu
src/components/Reviews.tsx          puan dağılımı
src/components/SSS.tsx              akordeon
src/components/DateField.tsx        tarih seçici
```

Bunlar `src/data/products.ts` içindeki tiplere bağlı. Kendi tipinizi
kullanacaksanız **Bölüm 7**'ye bakın: hangi alanların zorunlu olduğu orada.

### Kademe C — Tam akış (~yarım gün)

Kademe B + rezervasyon:

```
src/lib/rezervasyon.ts                      seçim tipi, URL kodlama, tutar
src/components/rezervasyon/RezervasyonAkisi.tsx   üç adımlı form
src/components/rezervasyon/OzetKarti.tsx    yapışkan özet
src/app/rezervasyon/page.tsx                akış rotası
src/app/rezervasyon/onay/page.tsx           onay rotası
src/components/*Booking.tsx                 tipe özel rezervasyon kutuları
```

---

## 3. Tasarım sistemi

### Renk

Hepsi `globals.css` içindeki `@theme` bloğunda. Tailwind bunları otomatik
olarak `bg-*`, `text-*`, `border-*` yardımcılarına çevirir.

| Token | Değer | Kullanım | Kontrast |
|---|---|---|---|
| `paper` | `#ffffff` | kart ve panel zemini | — |
| `ground` | `#f5f6f7` | sayfa zemini | — |
| `sunken` | `#eef1f3` | çukur alan, tablo başlığı | — |
| `ink` | `#14171d` | başlık ve ana metin | — |
| `ink-2` | `#39414f` | gövde metni | — |
| `muted` | `#5b6472` | ikincil metin | beyaz 5.98 · ground 5.53 · sunken 5.27 |
| `faint` | `#828b98` | üçüncül, etiket | yalnız büyük/ikincil metinde |
| `line` | `#e3e7ea` | ayraç | dekoratif |
| `line-strong` | `#c6ced5` | girdi ve panel sınırı | — |
| `accent` | `#c43d23` | **fiyat ve birincil eylem** | beyaz 5.20 · üstünde beyaz 5.20 |
| `accent-hover` | `#b83a22` | buton hover | — |
| `accent-soft` | `#fdeeea` | seçili kart zemini | — |
| `amber` | `#f5a623` | kategori etiketi, yıldız | — |
| `amber-ink` | `#3d2600` | amber üzerindeki metin | amber üstünde 7.02 |
| `score` | `#1a7a44` | puan kutusu, onay | üstünde beyaz 5.37 |
| `info` | `#2563a8` | bilgi rozeti | üstünde beyaz 6.12 |

**Aksan neden `#c43d23`?** Referans aldığımız vitrinlerin parlak mercanı
(`#e8593c`) beyaz üzerinde 3.54 veriyor — normal metin için AA'yı tutmuyor.
`#c43d23` iki yönde de 5.20: hem beyaz zeminde fiyat olarak, hem buton zemini
olarak beyaz metinle. Aksanı değiştirirseniz **iki yönü de** ölçün.

Semantik renk (`score`, `amber`, `info`) aksandan ayrı. Aksanı marka rengiyle
değiştirirken bunlara dokunmayın.

### Tipografi

İki aile, iki rol:

```
--font-display  Figtree   başlık, buton, etiket, sayı
--font-sans     Mulish    akan metin
```

İkisi de `latin-ext` altkümesiyle yükleniyor — **Türkçe diakritikler için
zorunlu**. Altkümeyi düşürürseniz ş/ğ/ı karakterleri yedek fonta düşer.

Ölçek Tailwind'in keyfî değer sözdizimiyle veriliyor (`text-[15px]`), ayrı bir
ölçek tablosu yok. Yaygın kullanımlar:

| Yer | Boyut / ağırlık |
|---|---|
| Sayfa başlığı | `text-[clamp(1.8rem,3.8vw,2.7rem)] font-bold` |
| Bölüm başlığı | `text-[21px] font-bold` |
| Kart başlığı | `text-[17px] font-semibold` (display) |
| Gövde | `text-[13.5px]` / `text-[14px]` |
| Etiket | `text-[12.5px] font-semibold text-muted` |
| Künye | `text-[11.5px] text-faint` |

`.tnum` sınıfı tabular rakam verir. **Hizalanması gereken her sayıda kullanın**
— fiyat, tarih, sayaç, tablo kolonu.

### Yarıçap ve gölge

```
--radius-card  14px   kart, panel, açılır kutu
--radius-ui    10px   buton, girdi, rozet
--radius-pill  999px  sekme, çip, avatar

--shadow-card  durağan kart
--shadow-lift  yükseltilmiş panel, açılır kutu, hover
```

Kullanımı: `rounded-card`, `shadow-(--shadow-lift)`.

### ⚠ `@layer base` — en önemli kural

`globals.css` içindeki element kuralları **`@layer base` içinde olmak zorunda**:

```css
@layer base {
  h1, h2, h3, h4 { margin: 0; ... }
  p { margin: 0; }
}
```

Tailwind v4 yardımcı sınıfları `@layer utilities` içinde tanımlar ve
**katmansız CSS, özgüllüğü ne olursa olsun katmanlı CSS'i ezer**. Bu blok
katmansız yazılırsa `h1..h4 { margin: 0 }` kuralı projedeki **bütün**
`mt-*` / `mb-*` / `leading-*` yardımcılarını sessizce iptal eder; başlıklar
açıklamalarının üstüne yapışır ve hiçbir hata görmezsiniz.

Bu projede tam olarak bu oldu ve fark edilmesi uzun sürdü. Yeni element
kuralı eklerken katmanın içinde kaldığından emin olun.

---

## 4. Dosya haritası

### `src/app/` — rotalar

| Dosya | Ne |
|---|---|
| `layout.tsx` | font, metadata, TopBanner + Header + Footer |
| `globals.css` | tokenlar, taban stilleri, animasyon |
| `page.tsx` | ana sayfa: hero, güven şeridi, dört ürün şeridi, kampanya ve vize bandı |
| `turlar/page.tsx` | tur kataloğu, `?kapsam=yurtici\|yurtdisi` okur |
| `turlar/[slug]/page.tsx` | tur detayı → `ProductDetailView` |
| `transfer/`, `konaklama/` | aynı desen |
| `vize/page.tsx` | vize giriş sayfası (katalog bileşenini **kullanmaz**) |
| `vize/[slug]/page.tsx` | vize detayı → `VizeDetailView` (ayrı iskelet) |
| `rezervasyon/page.tsx` | URL'den seçimi çözer → `RezervasyonAkisi` |
| `rezervasyon/onay/page.tsx` | onay ekranı |
| `gorsel-kaynaklari/page.tsx` | fotoğraf künyeleri (lisans gereği) |

### `src/components/` — bileşenler

**Sunucu bileşenleri** (durum yok, doğrudan veri alır):

| Bileşen | Props | Not |
|---|---|---|
| `SiteHeader` | — | iki satır: marka+arama, kategori navigasyonu |
| `SiteFooter` | — | güven şeridi + 4 kolon + telif |
| `ProductCard` | `product: Product` | dört tip için tek kart, `kind`'e göre dallanır |
| `ProductMedia` | `photoKey, alt, sizes, priority?` | `next/image` sarmalayıcı, `fill` kullanır |
| `ProductDetailView` | `product: ProductDetail, related: Product[]` | tur/transfer/konaklama ortak iskeleti |
| `Reviews` | `rating, reviewCount, buckets, aspects, reviews` | puan dağılımı |
| `SSS` | `sorular: Soru[], grup?: string` | `<details>` akordeonu |
| `icons` | `className?` | 28 ikon, `currentColor` |
| `vize/VizeCard` | `vize: VizeProduct` | ülke kartı (yıldız/rozet yok) |
| `vize/VizeDetailView` | `vize: VizeDetail, digerleri: VizeProduct[]` | vizeye özel iskelet |
| `rezervasyon/OzetKarti` | `secim: Secim` | yapışkan özet |

**İstemci bileşenleri** (`"use client"`):

| Bileşen | Props | Not |
|---|---|---|
| `TopBanner` | — | kapatılabilir, `useSyncExternalStore` ile localStorage |
| `HeroSearch` | — | dört sekme, sekmeye göre alan ve form hedefi |
| `Catalog` | `products, kind, initialScope?` | filtre rayı + sıralama + ızgara |
| `Gallery` | `photos: PhotoKey[]` | kapak + şerit + künye |
| `SectionNav` | `sections: Section[]` | yapışkan, IntersectionObserver |
| `DateField` | aşağıda | Türkçe takvim |
| `BookingBox` | `tour: TurDetail` | tur rezervasyon kutusu |
| `TransferBooking` | `transfer: TransferDetail` | yön + araç + saat |
| `VillaBooking` | `villa: VillaDetail` | giriş/çıkış + gece hesabı |
| `VizeBooking` | `vize: VizeDetail` | başvuru sayısı + iki kalemli tutar |
| `rezervasyon/RezervasyonAkisi` | `secim: Secim` | üç adımlı form + doğrulama |

### `src/lib/`

**`format.ts`** — biçimlendirme ve tarih matematiği. Saat dilimi kayması
olmasın diye tüm hesaplar UTC üzerinden:

```ts
money(minor)            // 145000 -> "₺1.450"   (minor unit = kuruş)
count(n) · score(n) · duration(minutes)
parseDate(iso) · toISO({y,m,d}) · dayNumber(iso) · addDays(iso, n)
nightsBetween(from, to)
dateShort(iso)          // "4 Eki 2026"
dateLong(iso)           // "4 Ekim 2026 Pazar"
monthTitle(y, m) · daysInMonth(y, m) · firstWeekdayOffset(y, m)
WEEKDAYS                // pazartesi başlangıçlı
```

**`rezervasyon.ts`** — seçim tipi, URL kodlama, tutar hesabı:

```ts
secimCoz(searchParams)  // URL -> Secim | null
secimSorgusu(secim)     // Secim -> query string
kalemler(secim)         // fiyat satırları    ← TEK KAYNAK
toplam(secim)           // toplam tutar       ← TEK KAYNAK
kisiSayisi · kisiEtiketi · pasaportGerekli · secimOzeti
referansUret(kind)      // "TR-YYJ9083"
```

### `src/data/`

| Dosya | İçerik |
|---|---|
| `products.ts` | 22 ürün, 4 tip, ayrımlı birleşim + detay türetme |
| `photos.ts` | 21 fotoğraf künyesi (kaynak, yazar, lisans) |
| `sss.ts` | tipe göre SSS + ortak sorular |
| `firma.ts` | marka, telefon, adres, hakkımızda — **tek yerde** |

---

## 5. `DateField` — tarih seçici

Yerel `<input type="date">` yerine yazıldı, üç sebeple:

1. Tarayıcı diline göre biçimlenir; Türkçe sitede `mm/dd/yyyy` çıkar.
2. Geçmiş tarih engellenemez.
3. "Çıkış girişten sonra olmalı" kuralı zorlanamaz.

Aynı sorun `<input type="time">` için de geçerli — o yüzden transferdeki saat
alanı da açık listeye çevrildi (`02:30 PM` sorunu).

```tsx
<DateField
  label="Giriş"
  value={iso}                 // "YYYY-MM-DD"
  onChange={setIso}
  name="giris"                // verilirse gizli input ile forma katılır
  min="2026-10-07"            // bu tarihten öncesi kapalı
  minNote="en az 3 gece"      // altta küçük açıklama
  bare                        // kenarlıksız (hero arama çubuğu için)
  mode="gelecek"              // "gelecek" | "gecmis"
/>
```

- `mode="gecmis"` doğum tarihi için: ileri tarih kapalı, **ay ve yıl doğrudan
  seçilir** (1990'a ay ay gitmek işkenceydi), 101 yıl geriye gider.
- Takvim **yalnızca açıkken** render edilir. Yan faydası: `new Date()` hiçbir
  zaman sunucuda çalışmaz, dolayısıyla hidrasyon uyuşmazlığı olmaz.
- Açılır kutu dar bir kolonda ekran dışına taşacaksa ölçülüp sağa yaslanır.

---

## 6. Yeniden kullanılabilir desenler

Bunlar bu projeye özgü değil; her katalog/rezervasyon arayüzünde işe yarar.

### Fiyat tek yerde hesaplanır

`kalemler()` ve `toplam()` — rezervasyon kutusu, özet kartı ve onay ekranı
aynı fonksiyonu çağırır. Üç yerde farklı rakam çıkması **mümkün değil**.
Kendi projenizde de fiyat hesabını bileşenin içine yazmayın.

### Durum URL'de taşınır

Rezervasyon seçimi `?urun=…&secenek=…&yetiskin=2` biçiminde adres çubuğunda.
Global durum deposu yok. Kazanç: bağlantı paylaşılabilir, sunucuda render
edilebilir, geri tuşu adım atlamaz, yenilemede seçim kaybolmaz.

### `sticky`, kutunun kendisinde değil kapsayıcısında

```tsx
<aside className="lg:sticky lg:top-[calc(var(--header-h)+2.5rem)] lg:self-start">
  <BookingBox … />
</aside>
```

Kutunun kendisine `sticky` verirseniz kutu kendi boyunda kalır ve sayfa
kaydıkça ekrandan çıkar. Yapışkan olması gereken, ızgara hücresidir.

### Yapışkan şeritlerin yüksekliği tek değişkende

`--header-h` (106px). Detay sayfasındaki ikinci yapışkan şerit buna göre
konumlanır. Header yüksekliği her genişlikte **sabit** tutulur (`h-16` + `h-10`),
aksi hâlde mobilde 10px kayma oluyordu.

### Form kutusu tek kopya basılır

Masaüstü ve mobil için ayrı ayrı render **etmeyin**. Aynı radyo grubu
(`name="secenek"`) belgede iki kez var olursa tarayıcı ikisini tek grup sayar
ve masaüstündeki seçim sessizce kaybolur. Mobildeki alt çubukta yalnız fiyat
ve birincil eylem bulunur, form alanı yok.

### Doğrulama adım geçişinde çalışır

Her tuş vuruşunda değil — kullanıcı yazarken alanı kırmızıya boyamak, henüz
bitirmediği alanı hata gibi gösterir. Bir alan bir kez hata verdiyse
düzeltilirken anında yeniden denetlenir.

### Para minor unit

Her yerde kuruş (`145000` = ₺1.450). Kayan nokta yuvarlama hatası olmaz.
Biçimlendirme tek yerde: `money()`.

---

## 7. Veri modeli

`Kind` ayrımlı birleşiminin etiketi; kart ve detay bileşenleri buna bakıp
tipe özgü parçayı seçer:

```ts
type Kind = "tur" | "transfer" | "villa" | "vize";
```

**Her üründe zorunlu ortak alanlar** (kendi tipinizi yazarken bunlar gerekli):

```ts
slug, kind, city, country, scope, category, title, summary,
photo, rating, reviewCount, badge, priceFrom, priceUnit,
instantConfirm, freeCancelHours
```

`priceUnit` kritik: tur **kişi başı**, transfer **araç başı**, konaklama
**gecelik**, vize **başvuru başı**. Kartın yanlış birim yazmaması buna bağlı.

**Tipe özgü alanlar**: tur → `durationMinutes`, `languages`; transfer →
`from`, `to`, `maxPax`, `maxLuggage`; villa → `konaklamaTipi`, `bedrooms`,
`maxGuests`, `minNights`; vize → `destination`, `visaType`, `processingDays`.

### Veri kaynağını değiştirmek

`getProduct(slug)` ve `byKind(kind)` tek giriş noktası. Veritabanına
geçerken bu iki fonksiyonun gövdesini değiştirmek yeterli; **hiçbir bileşen
değişmez**.

`derive()` fonksiyonu, detayı yazılmamış ürünler için liste kaydından makul
bir detay üretir — hiçbir sayfa boş kalmasın diye. Gerçek içerik gelince
sözlüğe eklenir, bu fonksiyon devreden çıkar.

---

## 8. Erişilebilirlik

Uyulan kurallar:

- Kontrast AA. Yeni renk eklerken **iki yönü de** ölçün (metin olarak ve zemin olarak).
- Hata metni `aria-describedby` ile bağlanır, `<label>` **içine konmaz** —
  içeride olursa ekran okuyucu "Ad En az 2 harf yazın" diye okur.
- Akordeon yerel `<details>/<summary>`: JavaScript olmadan çalışır, klavyeyle
  gezilir, durum kendiliğinden bildirilir.
- Takvimde her gün düğmesinin `aria-label`'ı tam tarih (`"4 Ekim 2026 Pazar"`).
- Renk tek başına anlam taşımaz; puan çubuklarının yanında sayı da var.
- Dokunmatikte `button` için `min-block-size: 44px` — yalnız `pointer: coarse`
  altında, masaüstü yoğunluğu bozulmasın diye.
- `prefers-reduced-motion` tüm animasyonu kapatır.

---

## 9. Tuzaklar

Bu projede çarptığımız, tekrar çarpmanız muhtemel olanlar:

| Sorun | Belirti | Çözüm |
|---|---|---|
| Katmansız taban CSS | Başlıklar açıklamaya yapışır, `mt-*` çalışmaz | `@layer base` kullanın |
| Form kutusu iki kez basılı | Masaüstünde radyo seçimi kaybolur | Tek kopya basın |
| `sticky` yanlış kapsayıcıda | Panel kaydırınca ekrandan çıkar | Izgara hücresine verin |
| Yerel `date`/`time` girdisi | `mm/dd/yyyy`, `02:30 PM` | Kendi bileşeninizi yazın |
| Anahtar ön eki çakışması | Form adımı kilitlenir | `startsWith("k")` → `kvkk` de yakalar; tam ön ek kullanın |
| `useEffect` içinde `setState` | ESLint `react-hooks/set-state-in-effect` | Değişikliği tetikleyen handler'da yapın |
| Sunucuda `new Date()` | Hidrasyon uyuşmazlığı | `useSyncExternalStore` ya da yalnız etkileşimde hesaplayın |
| React anahtarı yinelenmesi | Konsol uyarısı, kaybolan öğe | Etiket yerine benzersiz alan kullanın |
| SVG `slice` kırpması | Görselin altı/üstü kesilir | En-boy oranı ile içeriği hizalayın |

---

## 10. Yeniden kullanırken değiştirilecekler

**Genel, olduğu gibi taşınır:** `globals.css` yapısı, `icons.tsx`,
`format.ts`, `DateField`, `SSS`, `SectionNav`, `Gallery`, `ProductMedia`,
`Catalog` iskeleti, `RezervasyonAkisi` iskeleti, Bölüm 6'daki desenler.

**Bu firmaya özgü, değiştirin:**

| Ne | Nerede |
|---|---|
| Marka, telefon, adres, hakkımızda | `src/data/firma.ts` — tek dosya |
| Logo | `public/logo-ege-ceylan-tur.webp` |
| Ürünler, fiyatlar, yorumlar | `src/data/products.ts` |
| Fotoğraflar ve künyeler | `public/gorseller/`, `src/data/photos.ts` |
| SSS içeriği | `src/data/sss.ts` |
| Aksan rengi | `globals.css` → `--color-accent` (+ hover, soft) |
| Para birimi ve yerel ayar | `src/lib/format.ts` → `LOCALE`, `CURRENCY` |
| Rota adları | `src/app/` klasör adları + `KIND_PATH` |

**Lisans uyarısı:** `public/gorseller/` altındaki fotoğraflar Wikimedia
Commons'tan ve bir kısmı **CC BY-SA** — atıf zorunlu. Başka projeye
taşırsanız ya künyeleri (`photos.ts` + `/gorsel-kaynaklari` sayfası) birlikte
taşıyın ya da kendi fotoğraflarınızla değiştirin. Logo firmaya ait, taşımayın.

---

## 11. Bilinen eksikler

- Rezervasyon akışı sunucuya hiçbir şey göndermez; referans numarası
  istemcide üretilir. Gerçek kurulumda API çağrısı ve 3D Secure yönlendirmesi
  girecek.
- Sepet yok; her ürün tek başına rezerve edilir.
- Arama kutusu `/turlar` adresine `q` gönderir ama katalog bu parametreyi
  okumaz.
- Yorumlar sayfalanmaz; her üründe dört örnek yorum basılır.
- Footer'daki kurumsal bağlantıların bir kısmı var olmayan sayfalara gider.
- Koyu tema yok (bilinçli: fotoğraf ağırlıklı katalogda koyu zemin görselin
  rengini bozuyor).
- Çoklu dil yok; metinler bileşenlerin içinde Türkçe sabit.
