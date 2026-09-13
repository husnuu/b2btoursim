-- =====================================================================
-- 0013 — Referans verisi
--
-- Yalnızca platform sözlükleri: para birimi, plan, rol yetkileri.
-- İŞ VERİSİ YOK — kiracı, acente, ürün, rezervasyon tohumlanmaz.
-- =====================================================================

insert into currency (code, name, is_base) values
  ('TRY', 'Türk lirası',        true),
  ('EUR', 'Euro',               false),
  ('USD', 'ABD doları',         false),
  ('GBP', 'İngiliz sterlini',   false)
on conflict (code) do nothing;

insert into fx_source (code, name, is_selected) values
  ('tcmb',   'TCMB (Türkiye Cumhuriyet Merkez Bankası)', true),
  ('ecb',    'ECB (Avrupa Merkez Bankası)',              false),
  ('manual', 'Elle girilen kur tablosu',                 false)
on conflict (code) do nothing;

insert into plan (code, name, monthly_price, currency, booking_quota, agency_quota, supplier_quota) values
  ('starter',    'Starter',      990000, 'TRY',   500,  3,  2),
  ('growth',     'Growth',      2490000, 'TRY',  5000, 25,  8),
  ('enterprise', 'Enterprise',  7800000, 'TRY',    -1, -1, -1)
on conflict (code) do nothing;

insert into plan_feature (plan_id, code, label)
select p.id, f.code, f.label
from plan p
join (values
  ('starter',    'b2b_extranet',   'B2B Extranet'),
  ('starter',    'b2c_storefront', 'Tek B2C vitrin'),
  ('growth',     'b2b_extranet',   'B2B Extranet'),
  ('growth',     'b2c_storefront', 'B2C vitrin'),
  ('growth',     'sub_agency',     'Alt acente yönetimi'),
  ('growth',     'white_label',    'White-label'),
  ('growth',     'marketplace',    'B2B Pazaryeri'),
  ('enterprise', 'b2b_extranet',   'B2B Extranet'),
  ('enterprise', 'b2c_storefront', 'B2C vitrin'),
  ('enterprise', 'sub_agency',     'Sınırsız alt acente'),
  ('enterprise', 'white_label',    'White-label'),
  ('enterprise', 'custom_domain',  'Özel domain'),
  ('enterprise', 'marketplace',    'B2B Pazaryeri')
) as f(plan_code, code, label) on f.plan_code = p.code
on conflict (plan_id, code) do nothing;

insert into role_scope (role, scope) values
  ('platform_admin', 'admin:tenants'),
  ('platform_admin', 'admin:suppliers'),
  ('platform_admin', 'admin:billing'),
  ('platform_admin', '*:read'),
  ('agency_admin',   'bookings:read'),
  ('agency_admin',   'bookings:write'),
  ('agency_admin',   'finance:read'),
  ('agency_admin',   'users:write'),
  ('agency_admin',   'settings:write'),
  ('sales',          'bookings:read'),
  ('sales',          'bookings:write'),
  ('accounting',     'bookings:read'),
  ('accounting',     'finance:read'),
  ('accounting',     'finance:write')
on conflict do nothing;
