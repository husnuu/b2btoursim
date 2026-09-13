-- =====================================================================
-- 0005 — Tur / aktivite (acentenin kendi yazdığı envanter)
--
-- Kaynak: "Tur Oluşturma Sihirbazı Alan Bazlı UI Spesifikasyonu"
-- Bölüm 3-5 ve Bölüm 7'deki varlık listesi.
--
-- `supplier_product` ile karıştırılmaz: o, dış tedarikçiden gelen
-- envanterin önbelleğidir; bu, acentenin sahibi olduğu üründür.
--
-- LİSTE ALANLARI: "Dahil olanlar", "Hariç olanlar", "Güzergâh durakları"
-- gibi yalnızca sıralı metinden ibaret listeler `text[]` olarak tutulur.
-- Satırın kendi nitelikleri varsa (süre, fiyat, yüzde) ayrı tablo açılır.
-- Kural budur; tabloların sayısı keyfî değil.
-- =====================================================================

create table tour (
  id                           uuid primary key default gen_random_uuid(),
  tenant_id                    uuid not null references tenant(id) on delete cascade,
  agency_id                    uuid not null,
  status                       content_status not null default 'taslak',
  featured                     boolean not null default false,

  -- 3.1 Başlık ve tür
  title                        text not null,
  slug                         text not null,
  tour_kind                    tour_kind,
  program_type                 program_type,
  show_on_website              boolean not null default true,
  ask_for_price                boolean not null default false,
  forced_currency              boolean not null default false,
  list_currency_override       char(3) references currency(code),

  -- 3.3 Program
  start_location               text not null default '',
  end_location                 text not null default '',
  route_stops                  text[] not null default '{}',

  -- 3.5 / 3.8 / 3.9 Metinler
  description                  text not null default '',
  extra_notes                  text not null default '',
  includes                     text[] not null default '{}',
  excludes                     text[] not null default '{}',
  know_before_you_go           text not null default '',
  what_to_bring                text not null default '',
  difficulty                   difficulty,
  video_url                    text,

  -- 3.10 Buluşma ve alış
  meeting_point_id             uuid,
  meeting_point_kind           location_point_kind not null generated always as ('meeting'::location_point_kind) stored,
  meeting_time_minutes_before  integer check (meeting_time_minutes_before >= 0),
  pickup_enabled               boolean not null default false,
  pickup_regions               text not null default '',
  pickup_extra_fee             bigint not null default 0 check (pickup_extra_fee >= 0),

  -- 4.1 Fiyatlandırma
  pricing_model                tour_pricing_model not null default 'kisiBasi',
  pricing_currency             char(3) not null references currency(code),
  alternate_display_currency   char(3) references currency(code),
  tax_included_in_price        boolean not null default true,

  -- 5.1 / 5.2 Rezervasyon ve iptal
  payment_mode                 payment_mode not null default 'anindaTamOdeme',
  cancellation_policy_id       uuid,

  -- 5.4 Sosyal medya taslağı (AI çıktısı; üretim izleri kayıtta kalır)
  social_post_text             text,
  social_post_generated_at     timestamptz,

  -- 5.6 Sözleşme — sürüm numarası artar, geçmiş metin rezervasyonda
  -- snapshot'lanır (bkz. booking_item)
  contract_text                text,
  contract_version             integer not null default 0,
  contract_updated_at          timestamptz,

  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now(),

  constraint tour_tenant_key unique (tenant_id, id),
  constraint tour_slug_unique unique (tenant_id, slug),
  constraint tour_agency_fk foreign key (tenant_id, agency_id)
    references agency (tenant_id, id) on delete restrict,
  -- NOT: üretilmiş (generated) kolon içeren yabancı anahtarda Postgres
  -- ON DELETE SET NULL kabul etmez; RESTRICT kullanıldı — kullanımdaki
  -- bir buluşma noktası silinemez, önce turdan kaldırılır.
  constraint tour_meeting_point_fk foreign key (tenant_id, meeting_point_id, meeting_point_kind)
    references location_point (tenant_id, id, kind) on delete restrict,
  constraint tour_cancellation_fk foreign key (tenant_id, cancellation_policy_id)
    references cancellation_policy (tenant_id, id) on delete set null,
  -- Yayına alınmış turda zorunlu alanlar dolu olmalı (canPublish ile aynı kural).
  constraint tour_publishable check (
    status <> 'aktif' or (
      length(btrim(title)) > 0 and
      length(btrim(slug)) > 0 and
      length(btrim(description)) > 0
    )
  )
);
create index tour_tenant_status_idx on tour (tenant_id, status);
create index tour_agency_idx on tour (agency_id);

-- --- Sınıflandırma ----------------------------------------------------

create table tour_category (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  title     text not null,
  slug      text not null,
  constraint tour_category_tenant_key unique (tenant_id, id),
  constraint tour_category_slug_unique unique (tenant_id, slug)
);

create table tour_category_link (
  tenant_id   uuid not null references tenant(id) on delete cascade,
  tour_id     uuid not null,
  category_id uuid not null,
  primary key (tour_id, category_id),
  constraint tour_category_link_tour_fk foreign key (tenant_id, tour_id)
    references tour (tenant_id, id) on delete cascade,
  constraint tour_category_link_category_fk foreign key (tenant_id, category_id)
    references tour_category (tenant_id, id) on delete cascade
);

create table tour_tag (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  name      text not null,
  constraint tour_tag_tenant_key unique (tenant_id, id),
  constraint tour_tag_name_unique unique (tenant_id, name)
);

create table tour_tag_link (
  tenant_id uuid not null references tenant(id) on delete cascade,
  tour_id   uuid not null,
  tag_id    uuid not null,
  primary key (tour_id, tag_id),
  constraint tour_tag_link_tour_fk foreign key (tenant_id, tour_id)
    references tour (tenant_id, id) on delete cascade,
  constraint tour_tag_link_tag_fk foreign key (tenant_id, tag_id)
    references tour_tag (tenant_id, id) on delete cascade
);

-- --- 3.3 Program durakları -------------------------------------------

create table itinerary_stop (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenant(id) on delete cascade,
  tour_id          uuid not null,
  position         integer not null check (position > 0),
  name             text not null,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  description      text not null default '',
  constraint itinerary_stop_tour_fk foreign key (tenant_id, tour_id)
    references tour (tenant_id, id) on delete cascade,
  constraint itinerary_stop_position_unique unique (tour_id, position)
);

-- --- 3.4 Konaklama programı ------------------------------------------

create table accommodation_plan (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  tour_id   uuid not null,
  name      text not null,
  price     bigint not null default 0 check (price >= 0),
  constraint accommodation_plan_tenant_key unique (tenant_id, id),
  constraint accommodation_plan_tour_fk foreign key (tenant_id, tour_id)
    references tour (tenant_id, id) on delete cascade
);

create table accommodation_night (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenant(id) on delete cascade,
  plan_id             uuid not null,
  night_no            integer not null check (night_no > 0),
  accommodation_name  text not null,
  constraint accommodation_night_plan_fk foreign key (tenant_id, plan_id)
    references accommodation_plan (tenant_id, id) on delete cascade,
  constraint accommodation_night_unique unique (plan_id, night_no)
);

-- --- 4.1 Yaş kademeleri / grup fiyatı --------------------------------

create table tour_age_tier (
  tenant_id uuid not null references tenant(id) on delete cascade,
  tour_id   uuid not null,
  key       age_tier_key not null,
  enabled   boolean not null default false,
  min_age   integer not null check (min_age >= 0),
  max_age   integer not null check (max_age >= 0),
  price     bigint not null default 0 check (price >= 0),
  primary key (tour_id, key),
  constraint tour_age_tier_tour_fk foreign key (tenant_id, tour_id)
    references tour (tenant_id, id) on delete cascade,
  constraint tour_age_tier_range check (max_age >= min_age)
);

create table tour_group_pricing (
  tour_id   uuid primary key,
  tenant_id uuid not null references tenant(id) on delete cascade,
  min_size  integer not null check (min_size > 0),
  max_size  integer not null check (max_size > 0),
  price     bigint not null check (price >= 0),
  constraint tour_group_pricing_tour_fk foreign key (tenant_id, tour_id)
    references tour (tenant_id, id) on delete cascade,
  constraint tour_group_pricing_range check (max_size >= min_size)
);
comment on table tour_group_pricing is
  'Yalnızca pricing_model = grupBazli olan turlarda satır bulunur (1:0..1).';

-- --- 4.2 Ücretlendirme seçenekleri -----------------------------------

create table seasonal_rule (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenant(id) on delete cascade,
  tour_id        uuid not null,
  start_date     date not null,
  end_date       date not null,
  adjustment_pct numeric(6,3) not null,       -- + artış / - indirim
  constraint seasonal_rule_tour_fk foreign key (tenant_id, tour_id)
    references tour (tenant_id, id) on delete cascade,
  constraint seasonal_rule_period check (end_date >= start_date)
);
-- Aynı tur için tarih aralıkları çakışamaz: iki kural aynı güne
-- uygulanırsa hangi fiyatın geçerli olduğu belirsizleşir.
alter table seasonal_rule add constraint seasonal_rule_no_overlap
  exclude using gist (
    tour_id with =,
    daterange(start_date, end_date, '[]') with &&
  );

create table tour_pricing_option (
  tour_id                 uuid primary key,
  tenant_id               uuid not null references tenant(id) on delete cascade,
  -- Erken rezervasyon / son dakika (null = kapalı)
  date_discount_type      date_discount_type,
  date_discount_days      integer check (date_discount_days > 0),
  date_discount_pct       numeric(6,3) check (date_discount_pct between 0 and 100),
  -- Kademeli grup indirimi (null = kapalı)
  tiered_min_size         integer check (tiered_min_size > 1),
  tiered_discount_pct     numeric(6,3) check (tiered_discount_pct between 0 and 100),
  -- Acenteye özel net fiyat (null = kapalı)
  agency_net_price        bigint check (agency_net_price >= 0),
  agency_markup_pct       numeric(6,3) check (agency_markup_pct >= 0),
  constraint tour_pricing_option_tour_fk foreign key (tenant_id, tour_id)
    references tour (tenant_id, id) on delete cascade,
  -- Üç seçeneğin her biri ya tamamen dolu ya tamamen boş olmalı.
  constraint tour_pricing_option_date check (
    num_nulls(date_discount_type, date_discount_days, date_discount_pct) in (0,3)
  ),
  constraint tour_pricing_option_tiered check (
    num_nulls(tiered_min_size, tiered_discount_pct) in (0,2)
  ),
  constraint tour_pricing_option_agency check (
    num_nulls(agency_net_price, agency_markup_pct) in (0,2)
  )
);

-- --- 5.5 Ekstra kütüphanesi ------------------------------------------

create table tour_extra (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  name      text not null,
  price     bigint not null check (price >= 0),
  currency  char(3) not null references currency(code),
  type      charge_type not null,
  constraint tour_extra_tenant_key unique (tenant_id, id)
);
comment on table tour_extra is
  'Kütüphane kaydı: bir kez tanımlanır, birden çok tura bağlanır (tour_extra_link).';

create table tour_extra_link (
  tenant_id  uuid not null references tenant(id) on delete cascade,
  tour_id    uuid not null,
  extra_id   uuid not null,
  required   boolean not null default false,
  sell_phase sell_phase not null default 'duringBooking',
  primary key (tour_id, extra_id),
  constraint tour_extra_link_tour_fk foreign key (tenant_id, tour_id)
    references tour (tenant_id, id) on delete cascade,
  constraint tour_extra_link_extra_fk foreign key (tenant_id, extra_id)
    references tour_extra (tenant_id, id) on delete cascade
);

-- --- 5.3 Müşteriden istenecek bilgiler -------------------------------

create table customer_info_field (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  tour_id   uuid not null,
  position  integer not null check (position > 0),
  label     text not null,
  type      form_field_type not null,
  required  boolean not null default false,
  scope     customer_field_scope not null default 'bookingOwner',
  constraint customer_info_field_tour_fk foreign key (tenant_id, tour_id)
    references tour (tenant_id, id) on delete cascade,
  constraint customer_info_field_position_unique unique (tour_id, position)
);

-- --- Çeviri -----------------------------------------------------------

create table tour_translation (
  tenant_id          uuid not null references tenant(id) on delete cascade,
  tour_id            uuid not null,
  locale             text not null,           -- 'en', 'de', ...
  title              text not null default '',
  description        text not null default '',
  includes           text[] not null default '{}',
  excludes           text[] not null default '{}',
  know_before_you_go text not null default '',
  what_to_bring      text not null default '',
  -- true: makine çevirisi, elle düzenlenmedi. Elle düzenleme false yapar
  -- ve bir daha otomatik üretim bu satırın üzerine yazmaz.
  auto               boolean not null default true,
  updated_at         timestamptz not null default now(),
  primary key (tour_id, locale),
  constraint tour_translation_tour_fk foreign key (tenant_id, tour_id)
    references tour (tenant_id, id) on delete cascade
);

-- --- Kalkış / kontenjan ----------------------------------------------
--
-- ŞEMA EKLEMESİ — dokümanlarda YOK, bilinçli olarak ekledim.
-- Sihirbaz spesifikasyonu bir turun hangi tarihlerde kaç kişilik
-- kontenjanla satılacağını hiç tanımlamıyor. Kontenjan kaydı olmadan:
--   * aynı kontenjan iki kez satılabilir (README'deki "çifte satış"),
--   * pazaryerinde satıcı acente kapasiteyi göremez,
--   * "kalan yer" bilgisi üretilemez.
-- `booked_count` türetilebilir bir sayaç olduğu için burada tutuluyor:
-- eşzamanlı satışta satır kilidi (SELECT ... FOR UPDATE) bu satırda alınır.
create table tour_departure (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenant(id) on delete cascade,
  tour_id        uuid not null,
  starts_at      timestamptz not null,
  capacity       integer not null check (capacity >= 0),
  booked_count   integer not null default 0 check (booked_count >= 0),
  stop_sale      boolean not null default false,
  price_override bigint check (price_override >= 0),
  constraint tour_departure_tenant_key unique (tenant_id, id),
  constraint tour_departure_tour_fk foreign key (tenant_id, tour_id)
    references tour (tenant_id, id) on delete cascade,
  constraint tour_departure_unique unique (tour_id, starts_at),
  constraint tour_departure_not_oversold check (booked_count <= capacity)
);
create index tour_departure_lookup_idx on tour_departure (tenant_id, starts_at) where not stop_sale;
