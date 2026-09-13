-- =====================================================================
-- 0002 — Platform katmanı: para birimi, plan, kiracı, acente, kullanıcı
--
-- KONVANSİYONLAR (tüm şema boyunca geçerli):
--   * Para: `bigint`, minor unit (kuruş). Asla numeric/float değil.
--     Her tutar alanının yanında bir `*_currency` alanı ya da tablonun
--     kendi para birimi alanı bulunur.
--   * Yüzde: `numeric(6,3)` — 12.500 = %12,5.
--   * An (instant): `timestamptz`, UTC saklanır.
--   * Takvim tarihi/saati (transfer saati, check-in): `date` / `time` —
--     bunlar yerel takvim değerleridir, zaman dilimine çevrilmez.
--   * Kiracı izolasyonu: iş verisi taşıyan her tablo `tenant_id` taşır ve
--     `unique (tenant_id, id)` ile bileşik anahtar sunar. Alt tablolar
--     üst tabloya `(tenant_id, parent_id)` bileşik yabancı anahtarıyla
--     bağlanır — böylece bir kiracının kaydı başka kiracının kaydına
--     bağlanamaz. RLS politikası yazılmadan önce bile veri sızması
--     veritabanı düzeyinde imkânsızdır.
-- =====================================================================

-- --- Referans veri (platform geneli, kiracısız) -----------------------

create table currency (
  code        char(3) primary key,
  name        text    not null,
  is_base     boolean not null default false
);
comment on table currency is 'Platform geneli para birimi sözlüğü. Tutar alanları buraya FK ile bağlanır.';

-- Aynı anda yalnızca bir taban para birimi olabilir.
create unique index currency_single_base on currency (is_base) where is_base;

create table fx_source (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,          -- tcmb | ecb | manual
  name        text not null,
  is_selected boolean not null default false,
  updated_at  timestamptz
);

create table fx_rate (
  id          uuid primary key default gen_random_uuid(),
  source_id   uuid not null references fx_source(id) on delete cascade,
  base_code   char(3) not null references currency(code),
  quote_code  char(3) not null references currency(code),
  rate        numeric(18,8) not null check (rate > 0),
  valid_from  timestamptz not null,
  fetched_at  timestamptz not null default now(),
  constraint fx_rate_unique unique (source_id, base_code, quote_code, valid_from),
  constraint fx_rate_distinct check (base_code <> quote_code)
);
comment on table fx_rate is 'Kur geçmişi. Rezervasyonda kilitlenen kur (booking.fx_rate_locked) buradan kopyalanır; kur değişince geçmiş rezervasyon değişmez.';

-- --- Abonelik planı ---------------------------------------------------

create table plan (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,        -- starter | growth | enterprise
  name           text not null,
  monthly_price  bigint not null check (monthly_price >= 0),
  currency       char(3) not null references currency(code),
  -- -1 = sınırsız (Enterprise). Kota alanları planın satış vaadidir,
  -- kullanım sayacı değildir; sayaçlar türetilir.
  booking_quota  integer not null,
  agency_quota   integer not null,
  supplier_quota integer not null,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create table plan_feature (
  id       uuid primary key default gen_random_uuid(),
  plan_id  uuid not null references plan(id) on delete cascade,
  code     text not null,                     -- ör. marketplace | white_label
  label    text not null,
  constraint plan_feature_unique unique (plan_id, code)
);
comment on column plan_feature.code is
  'Özellik bayrağı. Pazaryeri erişimi ayrı bir abonelik varlığı değil, burada bir satırdır (marketplace_access bunu yansıtır).';

-- --- Kiracı -----------------------------------------------------------

create table tenant (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  plan_id          uuid not null references plan(id),
  status           tenant_status not null default 'trial',
  default_currency char(3) not null references currency(code),
  created_at       timestamptz not null default now(),
  closed_at        timestamptz
);
comment on table tenant is 'Platformdaki bir müşteri şirket (tur operatörü / ana acente). Tüm iş verisinin izolasyon kökü.';

create table tenant_branding (
  tenant_id    uuid primary key references tenant(id) on delete cascade,
  brand_color  text not null,                 -- BRAND_PALETTE içinden bir hex
  logo_path    text,                          -- Storage yolu; dosyanın kendisi DB'de değil
  updated_at   timestamptz not null default now()
);

create table tenant_domain (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenant(id) on delete cascade,
  hostname    text not null unique,
  kind        text not null check (kind in ('storefront','extranet')),
  verified_at timestamptz,
  created_at  timestamptz not null default now()
);
comment on table tenant_domain is
  'White-label alan adları. MVP kapsamı dışında ama şema seviyesinde şimdi ayrıldı: sonradan eklemek kiracı çözümleme yolunu değiştirmeyi gerektirirdi.';

-- --- Acente -----------------------------------------------------------

create table agency (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenant(id) on delete cascade,
  parent_agency_id  uuid,
  name              text not null,
  type              agency_type not null,
  credit_limit      bigint not null default 0 check (credit_limit >= 0),
  currency          char(3) not null references currency(code),
  payment_term_days integer not null default 0 check (payment_term_days >= 0),
  created_at        timestamptz not null default now(),
  constraint agency_tenant_key unique (tenant_id, id),
  -- Alt acente aynı kiracının içinde kalmak zorunda.
  constraint agency_parent_fk foreign key (tenant_id, parent_agency_id)
    references agency (tenant_id, id) on delete restrict,
  -- Ana acentenin üstü olmaz, alt acentenin üstü olmak zorunda.
  constraint agency_hierarchy check (
    (type = 'master'     and parent_agency_id is null) or
    (type = 'sub_agency' and parent_agency_id is not null)
  )
);
comment on column agency.credit_limit is
  'Cari limit. Kullanılabilir bakiye burada TUTULMAZ; ledger''dan türetilir (bkz. agency_balance görünümü).';

create index agency_tenant_idx on agency (tenant_id);
create index agency_parent_idx on agency (parent_agency_id);

-- --- Kullanıcı --------------------------------------------------------

create table app_user (
  id           uuid primary key default gen_random_uuid(),
  -- Supabase Auth kaydıyla bağ. Davet edilmiş ama henüz giriş yapmamış
  -- kullanıcıda null olur; bu yüzden auth.users birincil anahtar değil.
  auth_user_id uuid unique,
  tenant_id    uuid not null references tenant(id) on delete cascade,
  agency_id    uuid,
  role         user_role not null,
  email        text not null,
  full_name    text not null,
  status       user_status not null default 'invited',
  last_seen_at timestamptz,
  created_at   timestamptz not null default now(),
  constraint app_user_tenant_key unique (tenant_id, id),
  constraint app_user_agency_fk foreign key (tenant_id, agency_id)
    references agency (tenant_id, id) on delete restrict,
  -- Platform yöneticisi bir acenteye bağlı değildir; diğer roller bağlıdır.
  constraint app_user_agency_rule check (
    (role = 'platform_admin' and agency_id is null) or
    (role <> 'platform_admin' and agency_id is not null)
  )
);

create unique index app_user_email_per_tenant on app_user (tenant_id, lower(email));
create index app_user_agency_idx on app_user (agency_id);

-- --- Rol → yetki şablonu (platform geneli) ---------------------------

create table role_scope (
  role  user_role not null,
  scope text not null,                        -- ör. bookings:write
  primary key (role, scope)
);
comment on table role_scope is
  'JWT''ye yazılacak scope listesi. Roller sabit sayıda olduğu için kiracıya özel rol tanımı YOK — kasıtlı sadeleştirme.';

-- --- Denetim izi ------------------------------------------------------

create table audit_log (
  id           bigint generated always as identity primary key,
  tenant_id    uuid references tenant(id) on delete set null,
  actor_user_id uuid references app_user(id) on delete set null,
  action       text not null,                 -- ör. booking.cancel
  entity_type  text not null,
  entity_id    text not null,
  before       jsonb,
  after        jsonb,
  ip           inet,
  at           timestamptz not null default now()
);
comment on table audit_log is
  'KVKK ve mutabakat için değişmez kayıt. Kişisel veri maskelenerek yazılır (log.ts''teki redact ile aynı kural).';

create index audit_log_tenant_at_idx on audit_log (tenant_id, at desc);
create index audit_log_entity_idx on audit_log (entity_type, entity_id);

-- --- Idempotency ------------------------------------------------------

create table idempotency_key (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenant(id) on delete cascade,
  key           text not null,
  endpoint      text not null,
  request_hash  text not null,
  response_body jsonb,
  status_code   integer,
  created_at    timestamptz not null default now(),
  constraint idempotency_unique unique (tenant_id, endpoint, key)
);
comment on table idempotency_key is
  'Rezervasyon oluşturma gibi tekrar gönderilebilen çağrıların ikinci kez çalışmasını engeller: aynı anahtar aynı yanıtı döndürür.';
