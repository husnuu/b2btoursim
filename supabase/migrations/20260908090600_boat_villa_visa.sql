-- =====================================================================
-- 0007 — Tekne kiralama, villa kiralama, vize
--
-- Üçü de aynı kalıbı izler: kiracıya ait bir "kendi envanteri" tablosu +
-- kütüphane tabloları (kategori/özellik/ekstra) + çeviri. Kalıbı
-- bozan yerler yorumla işaretlendi.
-- =====================================================================

-- =========================== TEKNE ===================================

create table boat_category (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  title     text not null,
  slug      text not null,
  constraint boat_category_tenant_key unique (tenant_id, id),
  constraint boat_category_slug_unique unique (tenant_id, slug)
);

create table boat_feature (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  name      text not null,
  constraint boat_feature_tenant_key unique (tenant_id, id),
  constraint boat_feature_name_unique unique (tenant_id, name)
);

create table boat_extra (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  name      text not null,
  price     bigint not null check (price >= 0),
  currency  char(3) not null references currency(code),
  type      charge_type not null,
  constraint boat_extra_tenant_key unique (tenant_id, id)
);

create table boat (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references tenant(id) on delete cascade,
  agency_id                uuid not null,
  status                   content_status not null default 'taslak',

  -- Kimlik
  title                    text not null,
  slug                     text not null,
  internal_short_name      text not null default '',
  category_id              uuid,
  legal_capacity           integer not null check (legal_capacity > 0),
  main_marina_id           uuid,
  main_marina_kind         location_point_kind not null generated always as ('marina'::location_point_kind) stored,

  -- Teknik
  brand_model              text not null default '',
  build_year               integer check (build_year between 1900 and 2100),
  length_meters            numeric(6,2) check (length_meters > 0),
  engine_info              text not null default '',
  cabin_count              integer not null default 0 check (cabin_count >= 0),
  bed_count                integer not null default 0 check (bed_count >= 0),

  -- İçerik
  description              text not null default '',
  what_to_bring            text not null default '',
  includes                 text[] not null default '{}',
  excludes                 text[] not null default '{}',
  video_url                text,

  -- Güvenlik donanımı (yasal zorunluluk — tekne kiralamada denetim konusu)
  lifejacket_count         integer not null default 0 check (lifejacket_count >= 0),
  has_life_raft            boolean not null default false,
  has_fire_extinguisher    boolean not null default false,
  safety_notes             text not null default '',

  -- Kaptan
  captain_option           captain_option not null default 'kaptanli',
  captain_fee              bigint check (captain_fee >= 0),
  captain_fee_unit         captain_fee_unit not null default 'gunluk',
  captain_payment_method   captain_payment_method not null default 'limandaNakit',
  captain_language         text not null default '',

  -- Fiyatlandırma: üç modelden biri seçilir, ilgili alanlar dolar
  pricing_model            boat_pricing_model not null default 'saatlik',
  currency                 char(3) not null references currency(code),
  hourly_rate              bigint check (hourly_rate > 0),
  multiday_unit            multiday_unit,
  multiday_unit_price      bigint check (multiday_unit_price > 0),
  multiday_min_units       integer check (multiday_min_units > 0),
  multiday_max_units       integer check (multiday_max_units > 0),
  per_person_price         bigint check (per_person_price > 0),
  per_person_min_group     integer check (per_person_min_group > 0),
  min_rental_hours         integer not null default 1 check (min_rental_hours > 0),

  -- Depozito ve politika
  security_deposit         bigint not null default 0 check (security_deposit >= 0),
  fuel_policy_included     boolean not null default false,
  weather_cancellation_enabled boolean not null default true,
  payment_mode             payment_mode not null default 'anindaTamOdeme',
  deposit_block_timing     deposit_block_timing not null default 'onayAninda',
  deposit_refund_timing    deposit_refund_timing not null default 'checkoutSonrasi',
  cancellation_policy_id   uuid,

  -- Yolcu bilgisi toplama
  require_captain_license  boolean not null default false,
  collect_passenger_list   boolean not null default true,
  collect_emergency_contact boolean not null default true,

  -- Sözleşme
  contract_text            text,
  contract_version         integer not null default 0,
  contract_updated_at      timestamptz,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  constraint boat_tenant_key unique (tenant_id, id),
  constraint boat_slug_unique unique (tenant_id, slug),
  constraint boat_agency_fk foreign key (tenant_id, agency_id)
    references agency (tenant_id, id) on delete restrict,
  constraint boat_category_fk foreign key (tenant_id, category_id)
    references boat_category (tenant_id, id) on delete set null,
  constraint boat_marina_fk foreign key (tenant_id, main_marina_id, main_marina_kind)
    references location_point (tenant_id, id, kind) on delete restrict,
  constraint boat_cancellation_fk foreign key (tenant_id, cancellation_policy_id)
    references cancellation_policy (tenant_id, id) on delete set null,
  -- Seçilen fiyat modelinin alanları dolu olmalı.
  constraint boat_pricing_hourly check (
    pricing_model <> 'saatlik' or hourly_rate is not null
  ),
  constraint boat_pricing_multiday check (
    pricing_model <> 'cokGunlu' or
    num_nulls(multiday_unit, multiday_unit_price, multiday_min_units, multiday_max_units) = 0
  ),
  constraint boat_pricing_per_person check (
    pricing_model <> 'kisiBasi' or
    num_nulls(per_person_price, per_person_min_group) = 0
  ),
  constraint boat_multiday_range check (
    multiday_max_units is null or multiday_min_units is null or multiday_max_units >= multiday_min_units
  ),
  -- Kaptanlı seçenekte ücret tanımı zorunlu.
  constraint boat_captain_fee check (
    captain_option = 'kaptansiz' or captain_fee is not null
  )
);
create index boat_tenant_status_idx on boat (tenant_id, status);

create table boat_feature_link (
  tenant_id  uuid not null references tenant(id) on delete cascade,
  boat_id    uuid not null,
  feature_id uuid not null,
  primary key (boat_id, feature_id),
  constraint boat_feature_link_boat_fk foreign key (tenant_id, boat_id)
    references boat (tenant_id, id) on delete cascade,
  constraint boat_feature_link_feature_fk foreign key (tenant_id, feature_id)
    references boat_feature (tenant_id, id) on delete cascade
);

create table boat_extra_link (
  tenant_id  uuid not null references tenant(id) on delete cascade,
  boat_id    uuid not null,
  extra_id   uuid not null,
  required   boolean not null default false,
  sell_phase sell_phase not null default 'duringBooking',
  primary key (boat_id, extra_id),
  constraint boat_extra_link_boat_fk foreign key (tenant_id, boat_id)
    references boat (tenant_id, id) on delete cascade,
  constraint boat_extra_link_extra_fk foreign key (tenant_id, extra_id)
    references boat_extra (tenant_id, id) on delete cascade
);

-- Saatlik kiralamada süre uzadıkça inen indirim kademeleri.
create table boat_hourly_tier (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenant(id) on delete cascade,
  boat_id      uuid not null,
  after_hours  integer not null check (after_hours > 0),
  discount_pct numeric(6,3) not null check (discount_pct between 0 and 100),
  constraint boat_hourly_tier_boat_fk foreign key (tenant_id, boat_id)
    references boat (tenant_id, id) on delete cascade,
  constraint boat_hourly_tier_unique unique (boat_id, after_hours)
);

create table boat_translation (
  tenant_id     uuid not null references tenant(id) on delete cascade,
  boat_id       uuid not null,
  locale        text not null,
  title         text not null default '',
  description   text not null default '',
  what_to_bring text not null default '',
  includes      text[] not null default '{}',
  excludes      text[] not null default '{}',
  auto          boolean not null default true,
  updated_at    timestamptz not null default now(),
  primary key (boat_id, locale),
  constraint boat_translation_boat_fk foreign key (tenant_id, boat_id)
    references boat (tenant_id, id) on delete cascade
);

-- =========================== VİLLA ===================================

create table villa_category (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  title     text not null,
  constraint villa_category_tenant_key unique (tenant_id, id),
  constraint villa_category_title_unique unique (tenant_id, title)
);

create table villa_region (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  name      text not null,
  constraint villa_region_tenant_key unique (tenant_id, id),
  constraint villa_region_name_unique unique (tenant_id, name)
);

create table villa_feature (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  name      text not null,
  constraint villa_feature_tenant_key unique (tenant_id, id),
  constraint villa_feature_name_unique unique (tenant_id, name)
);

create table villa (
  id                        uuid primary key default gen_random_uuid(),
  tenant_id                 uuid not null references tenant(id) on delete cascade,
  agency_id                 uuid not null,
  status                    content_status not null default 'taslak',

  title                     text not null,
  slug                      text not null,
  description               text not null default '',
  category_id               uuid,
  -- Turizm işletme belgesi numarası: villa kiralamada yasal zorunluluk.
  tourism_license_no        text not null default '',

  -- Fiyat
  price_currency            char(3) not null references currency(code),
  nightly_rate              bigint not null default 0 check (nightly_rate >= 0),
  ask_for_price             boolean not null default false,
  forced_currency           boolean not null default false,
  list_currency_override    char(3) references currency(code),
  list_price                bigint check (list_price >= 0),

  -- Konum
  province                  text not null default '',
  district                  text not null default '',
  address_detail            text not null default '',
  map_lat                   numeric(9,6),
  map_lng                   numeric(9,6),

  -- Kapasite ve kurallar
  capacity                  integer not null default 1 check (capacity > 0),
  check_in_time             time not null default '16:00',
  check_out_time            time not null default '10:00',
  pets_allowed              boolean not null default false,
  min_nights                integer not null default 1 check (min_nights > 0),
  booking_cutoff_days       integer not null default 0 check (booking_cutoff_days >= 0),

  cancellation_policy_id    uuid,

  collect_estimated_arrival boolean not null default false,
  collect_guest_breakdown   boolean not null default false,
  collect_special_requests  boolean not null default false,

  video_url                 text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  constraint villa_tenant_key unique (tenant_id, id),
  constraint villa_slug_unique unique (tenant_id, slug),
  constraint villa_agency_fk foreign key (tenant_id, agency_id)
    references agency (tenant_id, id) on delete restrict,
  constraint villa_category_fk foreign key (tenant_id, category_id)
    references villa_category (tenant_id, id) on delete set null,
  constraint villa_cancellation_fk foreign key (tenant_id, cancellation_policy_id)
    references cancellation_policy (tenant_id, id) on delete set null
);
create index villa_tenant_status_idx on villa (tenant_id, status);

create table villa_region_link (
  tenant_id uuid not null references tenant(id) on delete cascade,
  villa_id  uuid not null,
  region_id uuid not null,
  primary key (villa_id, region_id),
  constraint villa_region_link_villa_fk foreign key (tenant_id, villa_id)
    references villa (tenant_id, id) on delete cascade,
  constraint villa_region_link_region_fk foreign key (tenant_id, region_id)
    references villa_region (tenant_id, id) on delete cascade
);

create table villa_feature_link (
  tenant_id  uuid not null references tenant(id) on delete cascade,
  villa_id   uuid not null,
  feature_id uuid not null,
  primary key (villa_id, feature_id),
  constraint villa_feature_link_villa_fk foreign key (tenant_id, villa_id)
    references villa (tenant_id, id) on delete cascade,
  constraint villa_feature_link_feature_fk foreign key (tenant_id, feature_id)
    references villa_feature (tenant_id, id) on delete cascade
);

-- Villa satışında belirleyici olan "denize 400 m" tipi mesafeler.
create table villa_poi_distance (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  villa_id  uuid not null,
  label     text not null,
  distance  numeric(8,2) not null check (distance >= 0),
  unit      distance_unit not null default 'm',
  constraint villa_poi_villa_fk foreign key (tenant_id, villa_id)
    references villa (tenant_id, id) on delete cascade
);

-- Bir villada birden çok rezervasyon yöntemi açık olabilir (çoklu seçim).
create table villa_booking_method_option (
  tenant_id uuid not null references tenant(id) on delete cascade,
  villa_id  uuid not null,
  method    villa_booking_method not null,
  primary key (villa_id, method),
  constraint villa_booking_method_villa_fk foreign key (tenant_id, villa_id)
    references villa (tenant_id, id) on delete cascade
);

create table villa_translation (
  tenant_id   uuid not null references tenant(id) on delete cascade,
  villa_id    uuid not null,
  locale      text not null,
  title       text not null default '',
  description text not null default '',
  auto        boolean not null default true,
  updated_at  timestamptz not null default now(),
  primary key (villa_id, locale),
  constraint villa_translation_villa_fk foreign key (tenant_id, villa_id)
    references villa (tenant_id, id) on delete cascade
);

-- =========================== VİZE ====================================

create table visa_product (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenant(id) on delete cascade,
  agency_id           uuid not null,
  status              content_status not null default 'taslak',
  title               text not null,
  country             text not null,
  description         text not null default '',
  price               bigint not null default 0 check (price >= 0),
  currency            char(3) not null references currency(code),
  processing_days_min integer check (processing_days_min >= 0),
  processing_days_max integer check (processing_days_max >= 0),
  required_documents  text[] not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint visa_product_tenant_key unique (tenant_id, id),
  constraint visa_product_agency_fk foreign key (tenant_id, agency_id)
    references agency (tenant_id, id) on delete restrict,
  constraint visa_processing_range check (
    processing_days_max is null or processing_days_min is null or
    processing_days_max >= processing_days_min
  )
);

-- Başvuru formu vize ürününden BAĞIMSIZDIR: aynı form birden çok ülke
-- için kullanılabilir, form linki ürün yayınlanmadan da paylaşılabilir
-- (/basvuru/[formId] rotası).
create table visa_form (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references tenant(id) on delete cascade,
  name                  text not null,
  description           text not null default '',
  accepting_submissions boolean not null default true,
  thank_you_message     text not null default '',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint visa_form_tenant_key unique (tenant_id, id)
);

create table visa_form_field (
  id       uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  form_id  uuid not null,
  position integer not null check (position > 0),
  label    text not null,
  type     form_field_type not null,
  required boolean not null default false,
  options  text[] not null default '{}',      -- yalnızca type = 'select'
  constraint visa_form_field_form_fk foreign key (tenant_id, form_id)
    references visa_form (tenant_id, id) on delete cascade,
  constraint visa_form_field_position_unique unique (form_id, position),
  constraint visa_form_field_options check (
    type = 'select' or cardinality(options) = 0
  )
);

create table visa_application (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references tenant(id) on delete cascade,
  form_id                  uuid,
  -- Form silinse/yeniden adlandırılsa bile başvurunun hangi form ile
  -- alındığı kaybolmaz (veri bütünlüğü ilkesi: snapshot).
  form_name_snapshot       text not null,
  applicant_name           text not null,
  status                   visa_application_status not null default 'yeni',
  answers                  jsonb not null default '{}'::jsonb,
  document_names           text[] not null default '{}',
  extra_doc_request_sent_at timestamptz,
  submitted_at             timestamptz not null default now(),
  constraint visa_application_tenant_key unique (tenant_id, id),
  constraint visa_application_form_fk foreign key (tenant_id, form_id)
    references visa_form (tenant_id, id) on delete set null
);
create index visa_application_status_idx on visa_application (tenant_id, status, submitted_at desc);
comment on column visa_application.answers is
  'Alan kimliği → cevap. Form alanları kullanıcı tarafından tanımlandığı için şema serbest; dosya cevapları document_names içinde.';

create table visa_application_notification (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenant(id) on delete cascade,
  application_id uuid not null,
  message        text not null,
  sent_at        timestamptz not null default now(),
  constraint visa_application_notification_fk foreign key (tenant_id, application_id)
    references visa_application (tenant_id, id) on delete cascade
);
