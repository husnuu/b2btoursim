-- =====================================================================
-- 0010 — Müşteri ve rezervasyon
--
-- TEK REZERVASYON TABLOSU. Prototipte her modülün kendi rezervasyon
-- listesi var (TransferBooking, BoatBooking, VillaBooking, VisaBooking);
-- bu arayüz kolaylığıdır, veri modeli değil. Beş ayrı rezervasyon
-- tablosu olsaydı: cari hesap beş yerden toplanır, voucher beş şablon
-- olur, iptal beş kez yazılırdı.
--
-- Yapı: ortak başlık (`booking`) + satırlar (`booking_item`) + modüle
-- özgü operasyon detayı (`*_booking_detail`, satırla bire bir).
-- Satırın hangi envantere baktığı TİPLİ FK ile tutulur; `item_kind`
-- ile tutarlılığı check kısıtı garanti eder.
-- =====================================================================

create table customer (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenant(id) on delete cascade,
  agency_id     uuid not null,
  full_name     text not null,
  email         text,
  phone         text,
  -- Pasaport numarası açık metin DEĞİL: uygulama katmanında alan bazlı
  -- şifrelenir, arayüzde maskeli gösterilir (KVKK).
  passport_no_encrypted text,
  created_at    timestamptz not null default now(),
  constraint customer_tenant_key unique (tenant_id, id),
  constraint customer_agency_fk foreign key (tenant_id, agency_id)
    references agency (tenant_id, id) on delete restrict
);
create index customer_agency_idx on customer (agency_id);
create index customer_email_idx on customer (tenant_id, lower(email));

create table booking (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenant(id) on delete cascade,
  agency_id       uuid not null,
  ref             text not null,             -- müşteriye/tedarikçiye verilen numara
  customer_id     uuid,
  supplier_id     uuid,                      -- dış tedarikçi; kendi envanterinde null
  status          booking_status not null default 'DRAFT',
  currency        char(3) not null references currency(code),
  -- Kur kilitleme: rezervasyon anındaki oran. Sonradan kur değişse de
  -- bu rezervasyonun tutarı değişmez.
  fx_rate_locked  numeric(18,8) check (fx_rate_locked > 0),
  travel_date     date,
  note            text,

  -- --- Pazaryeri kaynağı (spesifikasyon Bölüm 7: yeni tablo değil,
  -- mevcut BOOKING'e alan). Tek başlıkta tek kaynak olduğu için
  -- karışık sepet iki ayrı rezervasyona bölünür.
  source_channel            source_channel not null default 'direkt',
  contract_id               uuid references marketplace_contract(id) on delete restrict,
  listing_id                uuid references marketplace_listing(id) on delete restrict,
  applied_pricing_rule_id   uuid references marketplace_pricing_rule(id) on delete restrict,
  supplier_agency_name      text,            -- snapshot: sorumluluk kimde

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  confirmed_at    timestamptz,
  cancelled_at    timestamptz,

  constraint booking_tenant_key unique (tenant_id, id),
  constraint booking_ref_unique unique (tenant_id, ref),
  constraint booking_agency_fk foreign key (tenant_id, agency_id)
    references agency (tenant_id, id) on delete restrict,
  constraint booking_customer_fk foreign key (tenant_id, customer_id)
    references customer (tenant_id, id) on delete restrict,
  constraint booking_supplier_fk foreign key (tenant_id, supplier_id)
    references supplier (tenant_id, id) on delete restrict,
  -- Pazaryeri satışında kontrat ve uygulanan kural zorunlu; doğrudan
  -- satışta hiçbiri olamaz.
  constraint booking_marketplace_shape check (
    (source_channel = 'pazaryeri' and contract_id is not null
       and listing_id is not null and applied_pricing_rule_id is not null) or
    (source_channel = 'direkt' and contract_id is null
       and listing_id is null and applied_pricing_rule_id is null)
  ),
  -- Taslak dışındaki her rezervasyonun müşterisi olmalı.
  constraint booking_customer_required check (status = 'DRAFT' or customer_id is not null)
);
create index booking_agency_created_idx on booking (tenant_id, agency_id, created_at desc);
create index booking_status_idx on booking (tenant_id, status);
create index booking_travel_date_idx on booking (tenant_id, travel_date);
create index booking_contract_idx on booking (contract_id) where contract_id is not null;

comment on column booking.ref is
  'Kiracı içinde tekil. Voucher ve tedarikçi yazışmalarında görünen numara budur.';

-- --- Satırlar ---------------------------------------------------------

create table booking_item (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references tenant(id) on delete cascade,
  booking_id            uuid not null,
  item_kind             booking_item_kind not null,

  -- Tipli hedefler: item_kind hangisinin dolacağını belirler.
  supplier_variant_id   uuid,
  tour_id               uuid,
  tour_departure_id     uuid,
  vehicle_id            uuid,
  boat_id               uuid,
  villa_id              uuid,
  visa_product_id       uuid,

  -- Satın alma anındaki kopyalar. Ürün sonradan değişse/silinse bile
  -- rezervasyon ne satıldığını bilir (Veri Bütünlüğü İlkesi).
  title_snapshot        text not null,
  variant_name_snapshot text,
  contract_snapshot     text,                -- ürünün o günkü sözleşme metni
  starts_at             timestamptz,

  quantity              integer not null check (quantity > 0),
  unit_net_price        bigint not null check (unit_net_price >= 0),
  margin_pct            numeric(6,3) not null default 0 check (margin_pct >= 0),
  currency              char(3) not null references currency(code),
  supplier_reference    text,                -- tedarikçinin verdiği numara
  status                booking_status not null default 'PENDING',

  constraint booking_item_tenant_key unique (tenant_id, id),
  constraint booking_item_booking_fk foreign key (tenant_id, booking_id)
    references booking (tenant_id, id) on delete cascade,
  constraint booking_item_variant_fk foreign key (tenant_id, supplier_variant_id)
    references supplier_product_variant (tenant_id, id) on delete restrict,
  constraint booking_item_tour_fk foreign key (tenant_id, tour_id)
    references tour (tenant_id, id) on delete restrict,
  constraint booking_item_departure_fk foreign key (tenant_id, tour_departure_id)
    references tour_departure (tenant_id, id) on delete restrict,
  constraint booking_item_vehicle_fk foreign key (tenant_id, vehicle_id)
    references vehicle (tenant_id, id) on delete restrict,
  constraint booking_item_boat_fk foreign key (tenant_id, boat_id)
    references boat (tenant_id, id) on delete restrict,
  constraint booking_item_villa_fk foreign key (tenant_id, villa_id)
    references villa (tenant_id, id) on delete restrict,
  constraint booking_item_visa_fk foreign key (tenant_id, visa_product_id)
    references visa_product (tenant_id, id) on delete restrict,
  -- Tür ile hedef birebir tutarlı olmalı; tam olarak biri dolu.
  constraint booking_item_target check (
    case item_kind
      when 'supplier_product' then supplier_variant_id is not null and num_nonnulls(tour_id, vehicle_id, boat_id, villa_id, visa_product_id) = 0
      when 'tour'             then tour_id is not null and num_nonnulls(supplier_variant_id, vehicle_id, boat_id, villa_id, visa_product_id) = 0
      when 'transfer'         then vehicle_id is not null and num_nonnulls(supplier_variant_id, tour_id, boat_id, villa_id, visa_product_id) = 0
      when 'boat'             then boat_id is not null and num_nonnulls(supplier_variant_id, tour_id, vehicle_id, villa_id, visa_product_id) = 0
      when 'villa'            then villa_id is not null and num_nonnulls(supplier_variant_id, tour_id, vehicle_id, boat_id, visa_product_id) = 0
      when 'visa'             then visa_product_id is not null and num_nonnulls(supplier_variant_id, tour_id, vehicle_id, boat_id, villa_id) = 0
      else false
    end
  ),
  -- Kalkış yalnızca tur satırında anlamlı.
  constraint booking_item_departure_kind check (tour_departure_id is null or item_kind = 'tour')
);
create index booking_item_booking_idx on booking_item (booking_id);
create index booking_item_departure_idx on booking_item (tour_departure_id) where tour_departure_id is not null;

comment on column booking_item.unit_net_price is
  'Tedarikçi net fiyatı. Satış fiyatı TÜRETİLİR: round(net * (1 + margin_pct/100)) — salePrice() ile aynı formül, iki yerde iki sonuç çıkmasın diye burada saklanmaz.';

-- Müşteriden istenen bilgilerin cevapları (tur spesifikasyonu 5.3).
create table booking_answer (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenant(id) on delete cascade,
  booking_item_id uuid not null,
  field_id        uuid,                      -- alan sonradan silinebilir
  label_snapshot  text not null,
  value           text not null default '',
  participant_no  integer check (participant_no > 0),  -- katılımcı başına alanlarda
  constraint booking_answer_item_fk foreign key (tenant_id, booking_item_id)
    references booking_item (tenant_id, id) on delete cascade,
  constraint booking_answer_field_fk foreign key (field_id)
    references customer_info_field (id) on delete set null
);

-- --- Durum geçmişi ----------------------------------------------------

create table booking_status_history (
  id           bigint generated always as identity primary key,
  tenant_id    uuid not null references tenant(id) on delete cascade,
  booking_id   uuid not null,
  from_status  booking_status,
  to_status    booking_status not null,
  reason       text,
  changed_by   uuid references app_user(id) on delete set null,
  changed_at   timestamptz not null default now(),
  constraint booking_status_history_booking_fk foreign key (tenant_id, booking_id)
    references booking (tenant_id, id) on delete cascade
);
create index booking_status_history_booking_idx on booking_status_history (booking_id, changed_at);
comment on table booking_status_history is
  'Durum makinesinin izi. "Ne zaman kim iptal etti" sorusunun cevabı burada; booking.status yalnızca son durumu taşır.';

-- --- Modüle özgü operasyon detayları ---------------------------------
--
-- Satırla bire bir. Ortak alanlar (fiyat, adet, durum) booking_item'da;
-- yalnızca o modülün operasyonunu ilgilendiren alanlar burada.

create table transfer_booking_detail (
  booking_item_id     uuid primary key,
  tenant_id           uuid not null references tenant(id) on delete cascade,
  model               transfer_booking_model not null,
  from_label          text not null,
  to_label            text not null,
  one_way             boolean not null default true,
  pickup_date         date not null,
  pickup_time         time not null,
  return_date         date,
  return_time         time,
  adults              integer not null default 1 check (adults >= 0),
  children            integer not null default 0 check (children >= 0),
  operation_status    operation_status not null default 'planlamaBekliyor',
  assigned_driver_name text not null default '',
  assigned_driver_note text not null default '',
  constraint transfer_detail_item_fk foreign key (tenant_id, booking_item_id)
    references booking_item (tenant_id, id) on delete cascade,
  -- Gidiş-dönüşte dönüş zamanı zorunlu; tek yönde olamaz.
  constraint transfer_detail_return check (
    (one_way and return_date is null and return_time is null) or
    (not one_way and return_date is not null and return_time is not null)
  ),
  constraint transfer_detail_pax check (adults + children > 0)
);

create table boat_booking_detail (
  booking_item_id         uuid primary key,
  tenant_id               uuid not null references tenant(id) on delete cascade,
  -- Tekne kimliği burada TEKRAR EDİLİR (booking_item'da da var): çakışma
  -- kısıtı (EXCLUDE) tek tablo üzerinde çalışabilsin diye. Bileşik FK
  -- iki kolonun aynı kiracıda kalmasını garanti eder; tetikleyici
  -- booking_item ile eşitliğini korur.
  boat_id                 uuid not null,
  -- İptal edilen rezervasyon takvimi bloke etmez. booking_item.status
  -- değiştiğinde tetikleyici bu bayrağı günceller.
  is_blocking             boolean not null default true,
  from_date               date not null,
  from_time               time not null,
  to_date                 date not null,
  to_time                 time not null,
  captain_option          captain_option not null,
  assigned_captain_name   text not null default '',
  security_deposit        bigint not null default 0 check (security_deposit >= 0),
  security_deposit_status security_deposit_status not null default 'bloke',
  operation_status        operation_status not null default 'planlamaBekliyor',
  constraint boat_detail_item_fk foreign key (tenant_id, booking_item_id)
    references booking_item (tenant_id, id) on delete cascade,
  constraint boat_detail_boat_fk foreign key (tenant_id, boat_id)
    references boat (tenant_id, id) on delete restrict,
  constraint boat_detail_period check ((to_date, to_time) > (from_date, from_time)),
  -- Aynı tekne aynı aralıkta iki kez kiralanamaz. Prototipte bu kontrol
  -- JavaScript'te; doğru yeri burasıdır — eşzamanlı iki istek uygulama
  -- kontrolünü birlikte geçebilir, veritabanı kısıtını geçemez.
  constraint boat_no_double_booking exclude using gist (
    boat_id with =,
    tsrange((from_date + from_time), (to_date + to_time)) with &&
  ) where (is_blocking)
);

create table villa_booking_detail (
  booking_item_id  uuid primary key,
  tenant_id        uuid not null references tenant(id) on delete cascade,
  villa_id         uuid not null,            -- bkz. boat_booking_detail.boat_id notu
  is_blocking      boolean not null default true,
  check_in_date    date not null,
  check_out_date   date not null,
  guests           integer not null check (guests > 0),
  booking_method   villa_booking_method not null,
  operation_status operation_status not null default 'planlamaBekliyor',
  -- Gece sayısı TÜRETİLİR: iki tarihten hesaplanır, ayrıca saklanmaz.
  nights integer generated always as (check_out_date - check_in_date) stored,
  constraint villa_detail_item_fk foreign key (tenant_id, booking_item_id)
    references booking_item (tenant_id, id) on delete cascade,
  constraint villa_detail_villa_fk foreign key (tenant_id, villa_id)
    references villa (tenant_id, id) on delete restrict,
  constraint villa_detail_period check (check_out_date > check_in_date),
  -- Çıkış günü yeni girişe açıktır: aralık [giriş, çıkış) yarı açık.
  constraint villa_no_double_booking exclude using gist (
    villa_id with =,
    daterange(check_in_date, check_out_date, '[)') with &&
  ) where (is_blocking)
);

create table visa_booking_detail (
  booking_item_id  uuid primary key,
  tenant_id        uuid not null references tenant(id) on delete cascade,
  application_id   uuid,
  operation_status operation_status not null default 'planlamaBekliyor',
  constraint visa_detail_item_fk foreign key (tenant_id, booking_item_id)
    references booking_item (tenant_id, id) on delete cascade,
  constraint visa_detail_application_fk foreign key (tenant_id, application_id)
    references visa_application (tenant_id, id) on delete set null
);
comment on table visa_booking_detail is
  'Vize satışı ile başvuru kaydını bağlar. Başvuru rezervasyondan bağımsız da gelebilir (form linki), bu yüzden application_id nullable.';
