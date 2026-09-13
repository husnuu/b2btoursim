-- =====================================================================
-- 0009 — B2B Pazaryeri
--
-- Kaynak: "B2B Pazaryeri Modülü Spesifikasyonu" Bölüm 4-7.
--
-- ŞEMANIN EN ÖNEMLİ YAPISAL FARKI: pazaryeri KİRACILAR ARASIDIR.
-- Diğer tüm tablolarda `tenant_id` bir izolasyon sınırıdır; burada
-- değildir. Bir kontratın iki tarafı iki AYRI kiracıya aittir, bu yüzden
-- bu tablolarda tek bir `tenant_id` yoktur — her satır iki tarafı da
-- taşır (`supplier_*` / `seller_*`). RLS politikası da bu yüzden
-- "tenant_id = benim kiracım" değil, "iki taraftan biri benim" biçiminde
-- yazılacak. Tek tenant_id konulsaydı karşı taraf kendi kontratını
-- göremezdi.
--
-- PARA AKIŞI: platform para taşımaz. Burada hesaplanan yalnızca
-- HAKEDİŞTİR; tahsilat taraflar arasında gerçekleşir (1618 sayılı kanun
-- ve TÜRSAB mevzuatı gerekçesi). Bu yüzden pazaryerine ait bir "cüzdan",
-- "havuz hesap" veya "ödeme" tablosu YOK — kasıtlı.
-- =====================================================================

-- Fiyat kuralı ayrı bir tablodur çünkü DEĞİŞMEZ SATIRLAR üretir:
-- listeleme kuralı değiştiğinde eski kural silinmez, kontrat ve
-- rezervasyon eski satıra bakmaya devam eder. Fiyat şartı iki kademede
-- dondurulur: kontrat onayında bir kez, her rezervasyonda bir kez daha.
create table marketplace_pricing_rule (
  id             uuid primary key default gen_random_uuid(),
  owner_tenant_id uuid not null references tenant(id) on delete cascade,
  model          marketplace_pricing_model not null,
  commission_pct numeric(6,3) check (commission_pct between 0 and 100),
  net_amount     bigint check (net_amount >= 0),
  currency       char(3) not null references currency(code),
  created_at     timestamptz not null default now(),
  -- Modelin gerektirdiği alan dolu, diğeri boş olmalı.
  constraint marketplace_pricing_rule_shape check (
    (model = 'komisyon' and commission_pct is not null and net_amount is null) or
    (model = 'netFiyat' and net_amount is not null and commission_pct is null)
  )
);

-- Tedarikçi vitrini — kurulum sihirbazının ürettiği kayıt (Bölüm 2).
create table marketplace_profile (
  agency_id               uuid primary key references agency(id) on delete cascade,
  tenant_id               uuid not null references tenant(id) on delete cascade,
  country                 text not null default '',
  city                    text not null default '',
  description             text not null default '',
  contact_email           text,
  contact_phone           text,
  default_pricing_rule_id uuid references marketplace_pricing_rule(id) on delete restrict,
  -- Bölüm 2.6: kapatmak yalnızca YENİ kontrat isteklerini durdurur;
  -- mevcut kontratlar ve süren satışlar etkilenmez.
  is_visible              boolean not null default false,
  setup_completed_at      timestamptz,
  constraint marketplace_profile_agency_fk foreign key (tenant_id, agency_id)
    references agency (tenant_id, id) on delete cascade
);

-- Pazaryeri erişimi ayrı bir abonelik varlığı DEĞİL, planın özelliği
-- (plan_feature.code = 'marketplace'). Durum yine de burada açıkça
-- taşınıyor ki abonelik duvarı tek bir yerden karar versin ve plan
-- dışı istisnalar (deneme süresi, kampanya) kaydedilebilsin.
create table marketplace_access (
  agency_id   uuid primary key references agency(id) on delete cascade,
  tenant_id   uuid not null references tenant(id) on delete cascade,
  active      boolean not null default false,
  via_plan    text,
  valid_until timestamptz,
  constraint marketplace_access_agency_fk foreign key (tenant_id, agency_id)
    references agency (tenant_id, id) on delete cascade
);

-- Listeleme: kendi envanterini pazaryerine açma kaydı.
-- Spesifikasyon polimorfik referans öneriyor; burada TİPLİ FK var
-- (tour_id XOR vehicle_id). Polimorfik alan referans bütünlüğünü kırar
-- ve RLS politikasını yazılamaz hale getirir.
create table marketplace_listing (
  id                 uuid primary key default gen_random_uuid(),
  supplier_tenant_id uuid not null references tenant(id) on delete cascade,
  supplier_agency_id uuid not null,
  kind               listing_kind not null,
  tour_id            uuid,
  vehicle_id         uuid,
  -- Liste ekranlarında görünen ad: kaynak kayıttan kopyalanır ki
  -- kaynak yeniden adlandırılsa bile satıcının gördüğü ad değişmesin.
  title              text not null,
  is_active          boolean not null default true,
  pricing_rule_id    uuid not null references marketplace_pricing_rule(id) on delete restrict,
  list_price         bigint not null check (list_price >= 0),
  currency           char(3) not null references currency(code),
  destination        text not null default '',
  image_tone         text,
  shared_at          timestamptz not null default now(),
  constraint marketplace_listing_agency_fk foreign key (supplier_tenant_id, supplier_agency_id)
    references agency (tenant_id, id) on delete cascade,
  constraint marketplace_listing_tour_fk foreign key (supplier_tenant_id, tour_id)
    references tour (tenant_id, id) on delete cascade,
  constraint marketplace_listing_vehicle_fk foreign key (supplier_tenant_id, vehicle_id)
    references vehicle (tenant_id, id) on delete cascade,
  -- Tam olarak bir kaynak dolu ve tür ile tutarlı olmalı.
  constraint marketplace_listing_source check (
    (kind = 'tur'  and tour_id is not null and vehicle_id is null) or
    (kind = 'arac' and vehicle_id is not null and tour_id is null)
  ),
  -- Aynı ürün iki kez listelenemez.
  constraint marketplace_listing_tour_unique unique (supplier_agency_id, tour_id),
  constraint marketplace_listing_vehicle_unique unique (supplier_agency_id, vehicle_id)
);
create index marketplace_listing_discovery_idx
  on marketplace_listing (kind, destination) where is_active;

-- Kontrat: iki acente arasındaki satış izni. İki taraf iki ayrı
-- kiracıda olabilir — tablonun tek bir sahibi yoktur.
create table marketplace_contract (
  id                     uuid primary key default gen_random_uuid(),
  supplier_tenant_id     uuid not null references tenant(id) on delete cascade,
  supplier_agency_id     uuid not null,
  seller_tenant_id       uuid not null references tenant(id) on delete cascade,
  seller_agency_id       uuid not null,
  status                 contract_status not null default 'beklemede',
  message                text,
  -- Kontrat kurulduğu andaki fiyat şartı. Tedarikçi listelemeyi sonradan
  -- değiştirse bile bu kontrat için geçerli koşul budur.
  agreed_pricing_rule_id uuid references marketplace_pricing_rule(id) on delete restrict,
  requested_at           timestamptz not null default now(),
  decided_at             timestamptz,
  constraint marketplace_contract_supplier_fk foreign key (supplier_tenant_id, supplier_agency_id)
    references agency (tenant_id, id) on delete cascade,
  constraint marketplace_contract_seller_fk foreign key (seller_tenant_id, seller_agency_id)
    references agency (tenant_id, id) on delete cascade,
  constraint marketplace_contract_distinct_parties check (supplier_agency_id <> seller_agency_id),
  -- Karar verilmiş kontratta karar anı ve (onaylıysa) fiyat şartı zorunlu.
  constraint marketplace_contract_decision check (
    (status = 'beklemede' and decided_at is null) or
    (status <> 'beklemede' and decided_at is not null)
  ),
  constraint marketplace_contract_agreed_pricing check (
    status <> 'onaylandi' or agreed_pricing_rule_id is not null
  )
);
-- Aynı iki acente arasında aynı anda yalnızca bir CANLI kontrat olabilir.
-- Reddedilmiş/sonlandırılmış kontratlar arşivde kalır ve yeni talebi
-- engellemez (durum makinesi: "taraflar yeniden anlaşabilir, ama bu yeni
-- bir kontrattır").
create unique index marketplace_contract_live_unique
  on marketplace_contract (supplier_agency_id, seller_agency_id)
  where status in ('beklemede','onaylandi');
create index marketplace_contract_seller_idx on marketplace_contract (seller_agency_id, status);
create index marketplace_contract_supplier_idx on marketplace_contract (supplier_agency_id, status);

-- Spesifikasyonda "kapsam" tek bir alandı; doğru hali çoka-çok:
-- bir kontrat birden çok listelemeyi kapsar, bir listeleme birden çok
-- kontratta satılır.
create table marketplace_contract_listing (
  contract_id uuid not null references marketplace_contract(id) on delete cascade,
  listing_id  uuid not null references marketplace_listing(id) on delete cascade,
  added_at    timestamptz not null default now(),
  primary key (contract_id, listing_id)
);
