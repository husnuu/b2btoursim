-- =====================================================================
-- 0020 — Site yapılandırması (vitrin karakteri) ve modül vitrinleri
--
-- tenant_site: acentenin müşteri sitesinin tasarımı. Tek bir JSON:
-- bölüm sırası, açık/kapalı, başlıklar, tema, menü, altbilgi, SEO.
-- İki kopya: `draft` (editör) ve `published` (müşteri). Yapının şeması
-- uygulamada (`src/lib/site/config.ts`) doğrulanır; burada jsonb olması
-- kasıtlı — bölüm türleri sık değişecek, her seferinde migration
-- yazılmamalı. `version` alanı ileriye taşımayı mümkün kılar.
--
-- Ayrıca vitrin modül bölümleri için anonim okuma: yayındaki tekne,
-- villa, araç ve vize ürünleri. Yalnız `aktif` kayıtlar.
-- =====================================================================

create table tenant_site (
  tenant_id    uuid primary key references tenant(id) on delete cascade,
  draft        jsonb not null default '{}'::jsonb,
  published    jsonb,
  published_at timestamptz,
  updated_at   timestamptz not null default now()
);
comment on table tenant_site is 'Vitrin tasarımı: bölümler, sıra, tema, menü, altbilgi. draft editörün, published müşterinin gördüğü.';

alter table tenant_site enable row level security;
alter table tenant_site force row level security;
grant select, insert, update on tenant_site to authenticated;
grant select on tenant_site to anon;

create policy tenant_isolation on tenant_site
  for all to authenticated
  using (tenant_id = (select public.app_tenant_id()) or (select public.is_platform_admin()))
  with check (tenant_id = (select public.app_tenant_id()) or (select public.is_platform_admin()));
-- Anon yalnız yayınlananı okuyabilmeli; satır düzeyinde ayrım yapılamaz,
-- bu yüzden taslağı gizleyen bir görünüm üzerinden okur.
create policy storefront_site on tenant_site
  for select to anon using (true);

create view tenant_site_public as
  select tenant_id, published, published_at from tenant_site where published is not null;
alter view tenant_site_public set (security_invoker = on);
grant select on tenant_site_public to anon, authenticated;
revoke select on tenant_site from anon;
-- Görünüm security_invoker: anon'un tabloya doğrudan SELECT'i yok ama
-- görünüm... invoker olduğu için tabloya da hak gerekir. Bu yüzden anon'a
-- tabloda yalnız `published` kolonunu açıyoruz: kolon düzeyi yetki.
grant select (tenant_id, published, published_at) on tenant_site to anon;

-- --- Modül vitrinleri: anonim okuma ------------------------------------
grant select on boat, boat_category, villa, villa_category, vehicle, visa_product to anon;

create policy storefront_boat on boat
  for select to anon using (status = 'aktif');
create policy storefront_boat_category on boat_category
  for select to anon using (true);
create policy storefront_villa on villa
  for select to anon using (status = 'aktif');
create policy storefront_villa_category on villa_category
  for select to anon using (true);
create policy storefront_vehicle on vehicle
  for select to anon using (status = 'aktif');
create policy storefront_visa on visa_product
  for select to anon using (status = 'aktif');
