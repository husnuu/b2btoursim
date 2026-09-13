-- =====================================================================
-- 0004 — Tedarikçi ve dış katalog
--
-- KARAR: `supplier.tenant_id` ZORUNLU (nullable değil).
-- Gerekçe: Hotelbeds/GetYourGuide/GDS sözleşmesi platformun değil,
-- acentenin adına yapılır (satıcı sıfatı acentededir — 1618 sayılı kanun
-- ve TÜRSAB mevzuatı gereği). Platform yalnızca acentenin kendi
-- anahtarını bağlar. Platformun ortak bir tedarikçi anlaşması olsaydı
-- bile her kiracı için ayrı satır açılırdı: anahtar, limit ve kontenjan
-- kiracıya aittir.
--
-- Anahtarın kendisi ASLA burada durmaz: `credentials_ref` bir Vault /
-- secrets-manager referansıdır (PCI SAQ-A ve KVKK sınırı).
-- =====================================================================

create table supplier (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenant(id) on delete cascade,
  name            text not null,
  code            text not null,             -- dar kolonlarda görünen 2 harf
  adapter_type    adapter_type not null,
  status          supplier_status not null default 'sandbox',
  credentials_ref text,                      -- vault://... — sır burada DEĞİL
  created_at      timestamptz not null default now(),
  constraint supplier_tenant_key unique (tenant_id, id),
  constraint supplier_code_unique unique (tenant_id, code),
  -- Pazaryeri "tedarikçisi" bir dış adaptör değil, platform içi bir
  -- acentedir; kimlik bilgisi taşımaz.
  constraint supplier_marketplace_no_credentials check (
    adapter_type <> 'marketplace' or credentials_ref is null
  )
);
create index supplier_tenant_status_idx on supplier (tenant_id, status);

-- Süper Admin sağlık panelindeki 24 saatlik pencere. Anlık değerler
-- tabloda tutulmaz; her pencere bir satırdır, geçmiş korunur.
create table supplier_health_snapshot (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenant(id) on delete cascade,
  supplier_id    uuid not null,
  window_start   timestamptz not null,
  window_end     timestamptz not null,
  uptime_pct     numeric(6,3) not null check (uptime_pct between 0 and 100),
  avg_latency_ms integer not null check (avg_latency_ms >= 0),
  error_rate_pct numeric(6,3) not null check (error_rate_pct between 0 and 100),
  constraint supplier_health_supplier_fk foreign key (tenant_id, supplier_id)
    references supplier (tenant_id, id) on delete cascade,
  constraint supplier_health_unique unique (supplier_id, window_start),
  constraint supplier_health_window check (window_end > window_start)
);

-- --- Dış katalog önbelleği -------------------------------------------
--
-- Tedarikçiden gelen ürün. Kaynak sistemin kopyası olduğu için
-- `supplier_ref` + `cached_at` taşır ve gerçek kaynak değildir:
-- fiyat/kontenjan her aramada tedarikçiden yeniden doğrulanır.

create table supplier_product (
  id                        uuid primary key default gen_random_uuid(),
  tenant_id                 uuid not null references tenant(id) on delete cascade,
  supplier_id               uuid not null,
  supplier_ref              text not null,
  type                      product_type not null,
  title                     text not null,
  summary                   text not null default '',
  destination               text not null default '',
  duration_minutes          integer check (duration_minutes >= 0),
  languages                 text[] not null default '{}',
  meeting_point             text,
  includes                  text[] not null default '{}',
  excludes                  text[] not null default '{}',
  cancellation_type         cancellation_type not null default 'nonRefundable',
  cancellation_hours_before integer,
  rating                    numeric(3,2) check (rating between 0 and 5),
  review_count              integer not null default 0 check (review_count >= 0),
  image_tone                text,
  stars                     smallint check (stars between 1 and 5),
  address                   text,
  cached_at                 timestamptz not null default now(),
  constraint supplier_product_tenant_key unique (tenant_id, id),
  constraint supplier_product_supplier_fk foreign key (tenant_id, supplier_id)
    references supplier (tenant_id, id) on delete cascade,
  constraint supplier_product_ref_unique unique (supplier_id, supplier_ref),
  -- Ücretsiz iptalde saat eşiği zorunlu, iade edilmeyende anlamsız.
  constraint supplier_product_cancellation check (
    (cancellation_type = 'free' and cancellation_hours_before is not null) or
    (cancellation_type = 'nonRefundable' and cancellation_hours_before is null)
  ),
  -- Yıldız yalnızca otelde anlamlı.
  constraint supplier_product_stars check (stars is null or type = 'hotel')
);
create index supplier_product_search_idx on supplier_product (tenant_id, type, destination);

create table supplier_product_variant (
  id                        uuid primary key default gen_random_uuid(),
  tenant_id                 uuid not null references tenant(id) on delete cascade,
  product_id                uuid not null,
  name                      text not null,
  starts_at                 timestamptz not null,
  base_price                bigint not null check (base_price >= 0),
  currency                  char(3) not null references currency(code),
  cancellation_type         cancellation_type not null,
  cancellation_hours_before integer,
  -- Otel aramasına özgü nitelikler
  board                     board_type,
  room_type                 text,
  constraint supplier_variant_tenant_key unique (tenant_id, id),
  constraint supplier_variant_product_fk foreign key (tenant_id, product_id)
    references supplier_product (tenant_id, id) on delete cascade,
  constraint supplier_variant_cancellation check (
    (cancellation_type = 'free' and cancellation_hours_before is not null) or
    (cancellation_type = 'nonRefundable' and cancellation_hours_before is null)
  )
);
create index supplier_variant_product_idx on supplier_product_variant (product_id, starts_at);

-- TDD: INVENTORY.quantity_available. Varyantla bire bir — kontenjan
-- varyantın kendi niteliği değil, zamanla değişen bir durum olduğu için
-- ayrı tabloda tutulur (sık güncellenir, ürün satırını kilitlemez).
create table inventory (
  variant_id         uuid primary key references supplier_product_variant(id) on delete cascade,
  tenant_id          uuid not null references tenant(id) on delete cascade,
  quantity_available integer not null default 0 check (quantity_available >= 0),
  stop_sale          boolean not null default false,
  updated_at         timestamptz not null default now(),
  constraint inventory_variant_fk foreign key (tenant_id, variant_id)
    references supplier_product_variant (tenant_id, id) on delete cascade
);

-- --- Varsayılan marj --------------------------------------------------
--
-- ŞEMA EKLEMESİ (dokümanlarda tablo olarak yok): arayüzde her arama
-- sonucu bir `defaultMarginPct` ile geliyor ama bu değerin nereden
-- geldiği hiçbir belgede tanımlı değil. Marj bir acente politikasıdır;
-- burada kural olarak saklanır. En dar eşleşen kural kazanır.
create table margin_rule (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references tenant(id) on delete cascade,
  agency_id          uuid,                    -- null = kiracı geneli
  supplier_id        uuid,                    -- null = tüm tedarikçiler
  product_type       product_type,            -- null = tüm ürün tipleri
  default_margin_pct numeric(6,3) not null check (default_margin_pct >= 0),
  valid_from         timestamptz not null default now(),
  valid_to           timestamptz,
  constraint margin_rule_agency_fk foreign key (tenant_id, agency_id)
    references agency (tenant_id, id) on delete cascade,
  constraint margin_rule_supplier_fk foreign key (tenant_id, supplier_id)
    references supplier (tenant_id, id) on delete cascade,
  constraint margin_rule_period check (valid_to is null or valid_to > valid_from)
);
create index margin_rule_lookup_idx on margin_rule (tenant_id, agency_id, supplier_id, product_type);
