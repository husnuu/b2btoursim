-- =====================================================================
-- 0006 — Transfer modülü
--
-- Kaynak: "Transfer Modülü Spesifikasyonu" Bölüm 1-6.
-- Ortak bir araç filosu üzerine kurulu ÜÇ paralel satış modeli:
--   A) Nokta bazlı  — noktadan noktaya fiyat matrisi
--   B) Harita bazlı — bölgeden bölgeye matris + km formülü
--   C) Saatlik kiralama
-- Üçü de aynı `vehicle` tablosunu kullanır; fiyat kaynağı farklıdır.
-- =====================================================================

create table vehicle (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenant(id) on delete cascade,
  agency_id        uuid not null,
  status           content_status not null default 'aktif',
  pricing_model    vehicle_pricing_model not null default 'rotaBazli',
  title            text not null,
  description      text not null default '',
  vehicle_type     vehicle_type not null default 'private',
  seat_capacity    integer not null check (seat_capacity > 0),
  luggage_capacity integer not null default 0 check (luggage_capacity >= 0),
  -- Saatlik kiralama modelinde zorunlu, diğerinde anlamsız.
  hourly_rate      bigint check (hourly_rate > 0),
  hourly_currency  char(3) references currency(code),
  video_url        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint vehicle_tenant_key unique (tenant_id, id),
  constraint vehicle_agency_fk foreign key (tenant_id, agency_id)
    references agency (tenant_id, id) on delete restrict,
  constraint vehicle_hourly_rate check (
    (pricing_model = 'saatlikKiralama' and hourly_rate is not null and hourly_currency is not null) or
    (pricing_model = 'rotaBazli'       and hourly_rate is null     and hourly_currency is null)
  )
);
create index vehicle_tenant_status_idx on vehicle (tenant_id, status);

create table vehicle_feature (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  name      text not null,
  constraint vehicle_feature_tenant_key unique (tenant_id, id),
  constraint vehicle_feature_name_unique unique (tenant_id, name)
);

create table vehicle_feature_link (
  tenant_id  uuid not null references tenant(id) on delete cascade,
  vehicle_id uuid not null,
  feature_id uuid not null,
  primary key (vehicle_id, feature_id),
  constraint vehicle_feature_link_vehicle_fk foreign key (tenant_id, vehicle_id)
    references vehicle (tenant_id, id) on delete cascade,
  constraint vehicle_feature_link_feature_fk foreign key (tenant_id, feature_id)
    references vehicle_feature (tenant_id, id) on delete cascade
);

-- Transfer ekstraları tur ekstralarından AYRI bir kütüphanedir
-- (spesifikasyon Bölüm 1.3'ün kendi ayrımı): araç ekstrası bebek koltuğu,
-- tur ekstrası müze bileti. Aynı listede karışmaları operatörü yavaşlatır.
create table vehicle_extra (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  name      text not null,
  price     bigint not null check (price >= 0),
  currency  char(3) not null references currency(code),
  type      charge_type not null,
  constraint vehicle_extra_tenant_key unique (tenant_id, id)
);

create table vehicle_extra_link (
  tenant_id  uuid not null references tenant(id) on delete cascade,
  vehicle_id uuid not null,
  extra_id   uuid not null,
  required   boolean not null default false,
  sell_phase sell_phase not null default 'duringBooking',
  primary key (vehicle_id, extra_id),
  constraint vehicle_extra_link_vehicle_fk foreign key (tenant_id, vehicle_id)
    references vehicle (tenant_id, id) on delete cascade,
  constraint vehicle_extra_link_extra_fk foreign key (tenant_id, extra_id)
    references vehicle_extra (tenant_id, id) on delete cascade
);

create table vehicle_translation (
  tenant_id   uuid not null references tenant(id) on delete cascade,
  vehicle_id  uuid not null,
  locale      text not null,
  title       text not null default '',
  description text not null default '',
  auto        boolean not null default true,
  updated_at  timestamptz not null default now(),
  primary key (vehicle_id, locale),
  constraint vehicle_translation_vehicle_fk foreign key (tenant_id, vehicle_id)
    references vehicle (tenant_id, id) on delete cascade
);

-- --- A) Nokta bazlı fiyat matrisi ------------------------------------
--
-- N×N matris tek tabloda: yalnızca TANIMLI çiftler satır olur. Arayüz
-- (Bölüm 2.2) seçilen noktadan ulaşılabilen hedefleri gösterir; boş
-- hücre yok, satır yok demektir.

create table transfer_point_price (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenant(id) on delete cascade,
  from_point_id  uuid not null,
  to_point_id    uuid not null,
  vehicle_type   vehicle_type not null,
  price          bigint not null check (price >= 0),
  currency       char(3) not null references currency(code),
  from_point_kind location_point_kind not null generated always as ('transfer'::location_point_kind) stored,
  to_point_kind   location_point_kind not null generated always as ('transfer'::location_point_kind) stored,
  constraint transfer_point_price_from_fk foreign key (tenant_id, from_point_id, from_point_kind)
    references location_point (tenant_id, id, kind) on delete cascade,
  constraint transfer_point_price_to_fk foreign key (tenant_id, to_point_id, to_point_kind)
    references location_point (tenant_id, id, kind) on delete cascade,
  constraint transfer_point_price_unique unique (from_point_id, to_point_id, vehicle_type),
  -- Nokta kendine transfer olamaz.
  constraint transfer_point_price_distinct check (from_point_id <> to_point_id)
);
create index transfer_point_price_from_idx on transfer_point_price (tenant_id, from_point_id);

-- --- B) Harita bazlı --------------------------------------------------

create table map_zone (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenant(id) on delete cascade,
  name         text not null,
  city_country text not null,
  -- Gerçek polygon yerine adres eşleştirme anahtar kelimeleri.
  -- Geocoding servisi bağlanınca buraya `geometry(Polygon,4326)` eklenir;
  -- tablo ve ilişkiler değişmez.
  keywords     text not null default '',
  constraint map_zone_tenant_key unique (tenant_id, id),
  constraint map_zone_name_unique unique (tenant_id, name)
);

create table zone_price (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenant(id) on delete cascade,
  from_zone_id uuid not null,
  to_zone_id   uuid not null,
  vehicle_type vehicle_type not null,
  price        bigint not null check (price >= 0),
  currency     char(3) not null references currency(code),
  constraint zone_price_from_fk foreign key (tenant_id, from_zone_id)
    references map_zone (tenant_id, id) on delete cascade,
  constraint zone_price_to_fk foreign key (tenant_id, to_zone_id)
    references map_zone (tenant_id, id) on delete cascade,
  constraint zone_price_unique unique (from_zone_id, to_zone_id, vehicle_type),
  constraint zone_price_distinct check (from_zone_id <> to_zone_id)
);

-- Tanımsız bölge çiftlerinde devreye giren km formülü — kiracı başına tek kayıt.
create table km_formula (
  tenant_id           uuid primary key references tenant(id) on delete cascade,
  enabled             boolean not null default false,
  base_fare           bigint not null default 0 check (base_fare >= 0),
  per_km              bigint not null default 0 check (per_km >= 0),
  private_multiplier  numeric(6,3) not null default 1 check (private_multiplier > 0),
  shuttle_multiplier  numeric(6,3) not null default 0.7 check (shuttle_multiplier > 0),
  currency            char(3) not null references currency(code)
);

-- --- Popüler rotalar (hem nokta hem bölge) ---------------------------

create table popular_route (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null references tenant(id) on delete cascade,
  kind                        route_scope not null,
  title                       text not null default '',
  slug                        text not null,
  description                 text not null default '',
  duration_minutes            integer not null default 30 check (duration_minutes > 0),
  duration_unit               duration_unit not null default 'dakika',
  -- Nokta rotasında point, bölge rotasında zone dolu olur (tipli FK).
  start_point_id              uuid,
  end_point_id                uuid,
  start_zone_id               uuid,
  end_zone_id                 uuid,
  price_override              bigint check (price_override >= 0),
  currency                    char(3) not null references currency(code),
  use_custom_title_in_listing boolean not null default false,
  start_point_kind            location_point_kind not null generated always as ('transfer'::location_point_kind) stored,
  end_point_kind              location_point_kind not null generated always as ('transfer'::location_point_kind) stored,
  constraint popular_route_tenant_key unique (tenant_id, id),
  constraint popular_route_slug_unique unique (tenant_id, slug),
  constraint popular_route_start_point_fk foreign key (tenant_id, start_point_id, start_point_kind)
    references location_point (tenant_id, id, kind) on delete restrict,
  constraint popular_route_end_point_fk foreign key (tenant_id, end_point_id, end_point_kind)
    references location_point (tenant_id, id, kind) on delete restrict,
  constraint popular_route_start_zone_fk foreign key (tenant_id, start_zone_id)
    references map_zone (tenant_id, id) on delete set null,
  constraint popular_route_end_zone_fk foreign key (tenant_id, end_zone_id)
    references map_zone (tenant_id, id) on delete set null,
  -- Rota türü hangi uçların dolabileceğini belirler; karışamaz.
  constraint popular_route_endpoints check (
    (kind = 'point' and start_zone_id is null and end_zone_id is null) or
    (kind = 'zone'  and start_point_id is null and end_point_id is null)
  )
);

create table popular_route_vehicle (
  tenant_id  uuid not null references tenant(id) on delete cascade,
  route_id   uuid not null,
  vehicle_id uuid not null,
  primary key (route_id, vehicle_id),
  constraint popular_route_vehicle_route_fk foreign key (tenant_id, route_id)
    references popular_route (tenant_id, id) on delete cascade,
  constraint popular_route_vehicle_vehicle_fk foreign key (tenant_id, vehicle_id)
    references vehicle (tenant_id, id) on delete cascade
);

-- --- Saat marjları ----------------------------------------------------
--
-- Gece zammı / kampanya indirimi. Kurallar SIRAYLA uygulanır (kod:
-- applyTimeMargin), bu yüzden bir rota+saat için birden çok kural
-- eşleşebilir — çakışma kısıtı YOK, kasıtlı.

create table time_margin_rule (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references tenant(id) on delete cascade,
  scope              route_scope not null,
  start_point_id     uuid,
  end_point_id       uuid,
  start_zone_id      uuid,
  end_zone_id        uuid,
  start_time         time,
  end_time           time,
  percent_pct        numeric(6,3) not null,   -- + ek ücret / - indirim
  start_point_kind   location_point_kind not null generated always as ('transfer'::location_point_kind) stored,
  end_point_kind     location_point_kind not null generated always as ('transfer'::location_point_kind) stored,
  constraint time_margin_rule_tenant_key unique (tenant_id, id),
  constraint time_margin_rule_start_point_fk foreign key (tenant_id, start_point_id, start_point_kind)
    references location_point (tenant_id, id, kind) on delete cascade,
  constraint time_margin_rule_end_point_fk foreign key (tenant_id, end_point_id, end_point_kind)
    references location_point (tenant_id, id, kind) on delete cascade,
  constraint time_margin_rule_start_zone_fk foreign key (tenant_id, start_zone_id)
    references map_zone (tenant_id, id) on delete cascade,
  constraint time_margin_rule_end_zone_fk foreign key (tenant_id, end_zone_id)
    references map_zone (tenant_id, id) on delete cascade,
  constraint time_margin_rule_scope check (
    (scope = 'point' and start_zone_id is null and end_zone_id is null) or
    (scope = 'zone'  and start_point_id is null and end_point_id is null)
  ),
  -- Saat penceresi ya tam verilir ya hiç (gece yarısını saran pencere
  -- geçerlidir: 22:00-06:00).
  constraint time_margin_rule_window check (num_nulls(start_time, end_time) in (0,2))
);

create table time_margin_rule_vehicle (
  tenant_id  uuid not null references tenant(id) on delete cascade,
  rule_id    uuid not null,
  vehicle_id uuid not null,
  primary key (rule_id, vehicle_id),
  constraint time_margin_rule_vehicle_rule_fk foreign key (tenant_id, rule_id)
    references time_margin_rule (tenant_id, id) on delete cascade,
  constraint time_margin_rule_vehicle_vehicle_fk foreign key (tenant_id, vehicle_id)
    references vehicle (tenant_id, id) on delete cascade
);
comment on table time_margin_rule_vehicle is
  'Boş bırakılırsa kural TÜM araçlara uygulanır (kod: vehicleIds.length === 0).';

-- --- Modül ayarları ---------------------------------------------------

create table transfer_settings (
  tenant_id              uuid primary key references tenant(id) on delete cascade,
  default_currency       char(3) not null references currency(code),
  show_hourly_rental_tab boolean not null default true,
  booking_approval_mode  booking_approval_mode not null default 'otomatik',
  cancellation_policy_id uuid,
  constraint transfer_settings_cancellation_fk foreign key (tenant_id, cancellation_policy_id)
    references cancellation_policy (tenant_id, id) on delete set null
);
