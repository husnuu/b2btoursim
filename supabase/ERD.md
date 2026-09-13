# Veri Modeli — ER Diyagramı

Supabase projesi: **b2btourism** (`kyanueyvzwzibxqqekaz`, eu-central-1, Postgres 17).
Kaynak: `supabase/migrations/` — 15 dosya, sırayla uygulanır (13 şema + 2 kimlik/RLS).

| Nesne | Sayı |
|---|---|
| Tablo | 97 |
| Görünüm | 4 (`agency_balance`, `agency_statement`, `booking_totals`, `marketplace_settlement`) |
| Enum | 54 |
| Yabancı anahtar | 250 |
| Check kısıtı | 149 |
| Çakışma (EXCLUDE) kısıtı | 4 |
| RLS açık tablo | 97 / 97 — kiracı izolasyonu politikaları `0015_rls_policies` |

Diyagramlar alan bazında bölünmüş; her diyagram yalnızca o alanın omurgasını gösterir.
Tam kolon listesi migration dosyalarında, tablo/kolon yorumları veritabanında (`comment on`).

---

## Şemayı taşıyan beş kural

1. **Kiracı izolasyonu veritabanında.** Her iş tablosu `tenant_id` taşır ve `unique (tenant_id, id)` sunar; alt tablolar üst tabloya `(tenant_id, parent_id)` bileşik FK ile bağlanır. Bir kiracının satırı başka kiracının satırına *bağlanamaz* — RLS politikası yazılmadan önce bile.
2. **Para `bigint` minor unit, yüzde `numeric(6,3)`, an `timestamptz`, takvim değeri `date`/`time`.** Float yok.
3. **Türetilebilen saklanmaz.** Bakiye, yürüyen bakiye, satış fiyatı, gece sayısı — hepsi görünüm ya da generated kolon. İki yerde iki farklı sonuç çıkmasın diye.
4. **Polimorfik referans yok, tipli nullable FK var.** `booking_item`, `media_asset`, `marketplace_listing`, `popular_route` — hepsinde "tam olarak biri dolu" check kısıtı.
5. **Snapshot ilkesi.** Ürün adı, sözleşme metni, fiyat kuralı, kur — satış anında kopyalanır. Kaynak sonradan değişse/silinse bile rezervasyon ne satıldığını bilir.

---

## 1. Platform ve kiracı

```mermaid
erDiagram
  plan ||--o{ plan_feature : "özellik bayrağı"
  plan ||--o{ tenant : "abone"
  currency ||--o{ tenant : "varsayılan"
  currency ||--o{ fx_rate : "base / quote"
  fx_source ||--o{ fx_rate : "kaynak"
  tenant ||--o| tenant_branding : "logo + marka rengi"
  tenant ||--o{ tenant_domain : "white-label alan adı"
  tenant ||--o{ agency : "sahip"
  agency ||--o{ agency : "alt acente"
  tenant ||--o{ app_user : ""
  agency ||--o{ app_user : "bağlı (platform_admin hariç)"
  tenant ||--o{ audit_log : ""
  app_user ||--o{ audit_log : "actor"
  tenant ||--o{ idempotency_key : ""

  tenant {
    uuid id PK
    text slug UK
    uuid plan_id FK
    tenant_status status
    char3 default_currency FK
  }
  agency {
    uuid id PK
    uuid tenant_id FK
    uuid parent_agency_id FK
    agency_type type
    bigint credit_limit
    int payment_term_days
  }
  app_user {
    uuid id PK
    uuid auth_user_id UK "auth.users"
    uuid tenant_id FK
    uuid agency_id FK
    user_role role
  }
```

`agency.balance` yok: `agency_balance` görünümü defterden hesaplar.

## 2. Ortak varlıklar

```mermaid
erDiagram
  tenant ||--o{ location_point : ""
  location_point ||--o| rental_point : "kind = rental"
  tenant ||--o{ cancellation_policy : ""
  cancellation_policy ||--o{ cancellation_cutoff : "gün eşiği → iade %"
  tenant ||--o{ media_asset : ""
  tour ||--o{ media_asset : "tam olarak"
  vehicle ||--o{ media_asset : "bir sahip"
  boat ||--o{ media_asset : "dolu"
  villa ||--o{ media_asset : ""

  location_point {
    uuid id PK
    uuid tenant_id FK
    location_point_kind kind "meeting | transfer | marina | rental"
    text name
    numeric lat
    numeric lng
  }
  media_asset {
    uuid id PK
    bool is_cover "sahip başına en fazla 1"
    int position
    text storage_path
  }
```

Dört modülün "buluşma noktası / transfer noktası / marina / kiralama noktası" alanları birebir aynı; tek tablo + `kind`.
Alt tablolar sabit değerli *generated* `kind` kolonuyla `(tenant_id, id, kind)` anahtarına bağlanır — bir marina alanına transfer noktası bağlanamaz.

## 3. Tedarikçi ve dış katalog

```mermaid
erDiagram
  tenant ||--o{ supplier : "sözleşme KİRACININ"
  supplier ||--o{ supplier_health_snapshot : "24 saatlik pencere"
  supplier ||--o{ supplier_product : "önbellek"
  supplier_product ||--o{ supplier_product_variant : ""
  supplier_product_variant ||--o| inventory : "quantity_available"
  tenant ||--o{ margin_rule : "varsayılan marj"
  agency o|--o{ margin_rule : "null = hepsi"
  supplier o|--o{ margin_rule : "null = hepsi"

  supplier {
    uuid id PK
    uuid tenant_id FK "NOT NULL"
    text code UK "2 harf"
    adapter_type adapter_type
    supplier_status status
    text credentials_ref "vault:// — sır burada değil"
  }
  supplier_product {
    uuid id PK
    text supplier_ref UK
    product_type type
    cancellation_type cancellation_type
  }
```

## 4. Tur

```mermaid
erDiagram
  agency ||--o{ tour : "sahip"
  tour }o--o| location_point : "buluşma (kind = meeting)"
  tour }o--o| cancellation_policy : ""
  tour }o--o{ tour_category : "tour_category_link"
  tour }o--o{ tour_tag : "tour_tag_link"
  tour ||--o{ itinerary_stop : "sıralı"
  tour ||--o{ accommodation_plan : ""
  accommodation_plan ||--o{ accommodation_night : ""
  tour ||--o{ tour_age_tier : "adult / child / infant"
  tour ||--o| tour_group_pricing : "grupBazli"
  tour ||--o{ seasonal_rule : "aralıklar çakışamaz"
  tour ||--o| tour_pricing_option : "erken / kademeli / acente net"
  tour }o--o{ tour_extra : "tour_extra_link"
  tour ||--o{ customer_info_field : "form builder"
  tour ||--o{ tour_translation : "locale"
  tour ||--o{ tour_departure : "ŞEMA EKLEMESİ"

  tour {
    uuid id PK
    text slug UK
    content_status status
    tour_pricing_model pricing_model
    payment_mode payment_mode
    int contract_version
  }
  tour_departure {
    uuid id PK
    timestamptz starts_at
    int capacity
    int booked_count "<= capacity"
    bool stop_sale
  }
```

`tour_departure` dokümanlarda yok; kontenjan kaydı olmadan çifte satış engellenemez. Sihirbaz spesifikasyonuna eklenmesi gerekiyor.

## 5. Transfer

```mermaid
erDiagram
  agency ||--o{ vehicle : "filo"
  vehicle }o--o{ vehicle_feature : "vehicle_feature_link"
  vehicle }o--o{ vehicle_extra : "vehicle_extra_link"
  vehicle ||--o{ vehicle_translation : ""
  location_point ||--o{ transfer_point_price : "from (kind = transfer)"
  location_point ||--o{ transfer_point_price : "to"
  map_zone ||--o{ zone_price : "from"
  map_zone ||--o{ zone_price : "to"
  tenant ||--o| km_formula : "bölge çifti tanımsızsa"
  tenant ||--o{ popular_route : "nokta XOR bölge"
  popular_route }o--o{ vehicle : "popular_route_vehicle"
  tenant ||--o{ time_margin_rule : "gece zammı / indirim"
  time_margin_rule }o--o{ vehicle : "boş = tüm araçlar"
  tenant ||--o| transfer_settings : ""

  vehicle {
    uuid id PK
    vehicle_pricing_model pricing_model "rotaBazli | saatlikKiralama"
    vehicle_type vehicle_type "private | shuttle"
    int seat_capacity
    bigint hourly_rate "saatlikKiralama'da zorunlu"
  }
  transfer_point_price {
    uuid from_point_id FK
    uuid to_point_id FK
    vehicle_type vehicle_type
    bigint price
  }
```

Üç satış modeli (nokta / harita / saatlik) aynı `vehicle` tablosunu paylaşır; fiyat kaynağı değişir.

## 6. Tekne, villa, vize

```mermaid
erDiagram
  agency ||--o{ boat : ""
  boat }o--o| boat_category : ""
  boat }o--o| location_point : "ana marina (kind = marina)"
  boat }o--o{ boat_feature : "boat_feature_link"
  boat }o--o{ boat_extra : "boat_extra_link"
  boat ||--o{ boat_hourly_tier : "saat eşiği → indirim"
  boat ||--o{ boat_translation : ""

  agency ||--o{ villa : ""
  villa }o--o| villa_category : ""
  villa }o--o{ villa_region : "villa_region_link"
  villa }o--o{ villa_feature : "villa_feature_link"
  villa ||--o{ villa_poi_distance : "denize 400 m"
  villa ||--o{ villa_booking_method_option : "çoklu seçim"
  villa ||--o{ villa_translation : ""

  agency ||--o{ visa_product : ""
  tenant ||--o{ visa_form : "üründen BAĞIMSIZ"
  visa_form ||--o{ visa_form_field : "sıralı"
  visa_form ||--o{ visa_application : "form_name_snapshot"
  visa_application ||--o{ visa_application_notification : ""

  boat {
    uuid id PK
    boat_pricing_model pricing_model "saatlik | cokGunlu | kisiBasi"
    captain_option captain_option
    bigint security_deposit
    int lifejacket_count "yasal denetim"
  }
  villa {
    uuid id PK
    text tourism_license_no "yasal zorunluluk"
    bigint nightly_rate
    int min_nights
  }
  visa_application {
    uuid id PK
    visa_application_status status
    jsonb answers "alan id → cevap"
  }
```

## 7. Pazaryeri — kiracılar arası

```mermaid
erDiagram
  agency ||--o| marketplace_profile : "tedarikçi vitrini"
  agency ||--o| marketplace_access : "plan özelliği"
  tenant ||--o{ marketplace_pricing_rule : "DEĞİŞMEZ satırlar"
  marketplace_pricing_rule ||--o{ marketplace_profile : "varsayılan"
  agency ||--o{ marketplace_listing : "supplier_agency"
  tour |o--o{ marketplace_listing : "tour_id XOR"
  vehicle |o--o{ marketplace_listing : "vehicle_id"
  marketplace_pricing_rule ||--o{ marketplace_listing : ""
  agency ||--o{ marketplace_contract : "supplier tarafı"
  agency ||--o{ marketplace_contract : "seller tarafı"
  marketplace_pricing_rule |o--o{ marketplace_contract : "agreed (onayda donar)"
  marketplace_contract }o--o{ marketplace_listing : "marketplace_contract_listing"

  marketplace_contract {
    uuid id PK
    uuid supplier_tenant_id FK "iki AYRI kiracı"
    uuid supplier_agency_id FK
    uuid seller_tenant_id FK
    uuid seller_agency_id FK
    contract_status status "canlı kontrat çift başına 1"
    uuid agreed_pricing_rule_id FK
  }
  marketplace_listing {
    uuid id PK
    listing_kind kind "tur | arac"
    bool is_active
    bigint list_price
  }
```

Diğer tüm tablolarda `tenant_id` izolasyon sınırıdır; **burada değildir**. Kontratın iki tarafı iki ayrı kiracıya aittir, bu yüzden tek `tenant_id` yok, her satır iki tarafı taşır. RLS politikası "iki taraftan biri benim acentem" biçiminde yazılacak.

Cüzdan / havuz hesap / ödeme tablosu **yok**: platform para taşımaz. `marketplace_settlement` görünümü yalnızca hakedişi hesaplar.

## 8. Rezervasyon ve finans

```mermaid
erDiagram
  agency ||--o{ customer : ""
  agency ||--o{ booking : ""
  customer |o--o{ booking : "DRAFT hariç zorunlu"
  supplier |o--o{ booking : "dış tedarikçi"
  marketplace_contract |o--o{ booking : "source_channel = pazaryeri"
  marketplace_pricing_rule |o--o{ booking : "applied (rezervasyonda donar)"
  booking ||--|{ booking_item : "satır"
  booking ||--o{ booking_status_history : "kim / ne zaman"
  supplier_product_variant |o--o{ booking_item : "item_kind ="
  tour |o--o{ booking_item : "supplier_product |"
  tour_departure |o--o{ booking_item : "tour |"
  vehicle |o--o{ booking_item : "transfer |"
  boat |o--o{ booking_item : "boat |"
  villa |o--o{ booking_item : "villa |"
  visa_product |o--o{ booking_item : "visa"
  booking_item ||--o{ booking_answer : "müşteri bilgi cevabı"
  booking_item ||--o| transfer_booking_detail : "sürücü, saat"
  booking_item ||--o| boat_booking_detail : "kaptan, depozito, ÇAKIŞMA KISITI"
  booking_item ||--o| villa_booking_detail : "giriş/çıkış, ÇAKIŞMA KISITI"
  booking_item ||--o| visa_booking_detail : "başvuru bağı"
  visa_application |o--o| visa_booking_detail : ""

  booking |o--o{ payment : "token, kart verisi YOK"
  agency ||--o{ invoice : ""
  agency ||--o{ ledger_entry : "çift kayıt"
  agency ||--o{ commission_rule : "aralıklar çakışamaz"

  booking {
    uuid id PK
    text ref UK "kiracı içinde tekil"
    booking_status status "UPPER_SNAKE — TDD Bölüm 3"
    numeric fx_rate_locked
    source_channel source_channel
    uuid contract_id FK
    uuid applied_pricing_rule_id FK
  }
  booking_item {
    uuid id PK
    booking_item_kind item_kind
    text title_snapshot
    text contract_snapshot
    bigint unit_net_price "satış = round(net × (1 + marj/100))"
    numeric margin_pct
    int quantity
  }
  ledger_entry {
    bigint id PK
    bigint debit "ya borç"
    bigint credit "ya alacak"
    ledger_reference_type reference_type
  }
```

**Tek rezervasyon tablosu.** Prototipteki modül başına rezervasyon listeleri arayüz kolaylığı; veri modelinde ortak başlık + satır + modüle özgü detay (bire bir). Beş ayrı tablo olsaydı cari beş yerden toplanır, voucher beş şablon olurdu.

---

## Spesifikasyonlardan sapmalar ve eklemeler

| Konu | Belge | Şema | Neden |
|---|---|---|---|
| `SUPPLIER.tenant_id` | TDD'de var, nullable mı belirsiz | **NOT NULL** | Tedarikçi sözleşmesi acentenin adına; platform yalnızca anahtarı bağlar (1618 / TÜRSAB) |
| Rezervasyon tabloları | Modül başına ayrı | Tek `booking` + tipli `booking_item` + detay | Cari, voucher, iptal tek yerden |
| `MARKETPLACE_LISTING` referansı | Polimorfik | Tipli FK (`tour_id` XOR `vehicle_id`) | Referans bütünlüğü + RLS |
| `CONTRACT.kapsam` | Tek alan | Çoka-çok tablo | Kapsam doğası gereği çoklu |
| Pazaryeri fiyat şartı | "Donmuş olabilir" | Kontratta + rezervasyonda iki kez donar | Parada "olabilir" olmaz |
| Pazaryeri para akışı | Tedarikçi → platform → satıcı | Taraflar arası; yalnız hakediş görünümü | Platform para taşımaz |
| `MARKETPLACE_SUBSCRIPTION` | Ayrı varlık | `plan_feature` + `marketplace_access` | İkinci faturalama yüzeyi açılmaz |
| Buluşma / transfer / marina / kiralama noktası | Dört ayrı varlık | Tek `location_point` + `kind` | Alan olarak birebir aynı |
| `Agency.balance` | Alan | `agency_balance` görünümü | Saklanan bakiye defterden ayrışır |
| `LedgerEntry.runningBalance` | Alan | Pencere fonksiyonu | Geçmiş tarihli kayıt girince saklanan değer yanlış olur |
| Kapak görseli | `coverImageId` üründe | `media_asset.is_cover` + kısmi tekil indeks | Karşılıklı FK döngüsü olmaz |
| Tekne / villa çakışma kontrolü | JavaScript `checkOverlap` | `EXCLUDE USING gist` | Eşzamanlı iki istek uygulama kontrolünü birlikte geçebilir |

**Eklenen, belgelerde olmayan tablolar** (her biri `comment on` ile işaretli):

- `tour_departure` — tur kalkış / kontenjan. Olmadan çifte satış engellenemez.
- `margin_rule` — arayüzdeki `defaultMarginPct` değerinin kaynağı.
- `tenant_domain`, `tenant_branding` — white-label; sonradan eklemek kiracı çözümleme yolunu değiştirirdi.
- `booking_status_history`, `audit_log`, `idempotency_key` — mutabakat, KVKK, tekrar gönderim.
- `supplier_health_snapshot` — sağlık paneli için pencere geçmişi.

## Kimlik köprüsü (0014) ve politikalar (0015)

- **Davetle giriş, veritabanında zorunlu.** `auth.users`'a `app_user` karşılığı olmayan satır girilemez — tetikleyici geri alır. Anon anahtarla `signUp` çağıran biri bile kayıt olamaz.
- **JWT talepleri** `custom_access_token_hook` ile: `app_user_id`, `tenant_id`, `agency_id`, `app_role`, `scopes[]`. Devre dışı ya da bağlantısız kullanıcıya token verilmez (403).
- **RLS sınırı kiracıdır.** `tenant_id` taşıyan her tabloda tek politika: `tenant_id = app_tenant_id()` ya da platform yöneticisi. Pazaryeri tabloları iki taraflı (`supplier_*` / `seller_*`). Abonelik duvarı da RLS'te: abone olmayan listeleme fiyatını sorgulayamaz.
- **Kiracı içi ince yetki** (satışçı yalnız rezervasyon yazar) `scopes` ile uygulama katmanında — henüz politika değil.

## Bilinçli olarak yazılmayanlar

- **Scope bazlı yazma politikaları.** Kiracı izolasyonu var; "muhasebe rezervasyon silemez" kuralı şimdilik uygulamada.
- **Tetikleyiciler.** `updated_at` güncelleme, `booking_item.status` → `*_booking_detail.is_blocking`, `tour_departure.booked_count` artırma. Kural şemada, mekanizma bağlama aşamasında.
- **Sepet tablosu.** Sepet sekme başına istemcide; sunucu tarafı taslak `booking(status = DRAFT)` olarak karşılanır.
- **Pazaryeri iptal/iade sorumluluğu.** Spesifikasyonda yok; karar verilmeden tablo yazılmaz.
