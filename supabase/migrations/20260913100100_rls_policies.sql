-- =====================================================================
-- 0015 — RLS politikaları
--
-- Sınır KİRACIDIR. Kiracı içindeki ince yetki (satışçı yalnız
-- rezervasyon yazar, muhasebe finans yazar) `scopes` talebiyle uygulama
-- katmanında uygulanır; bu dosya "başkasının verisini görmek imkânsız"
-- garantisini verir, "kendi kiracında her şeyi yapabilirsin" demez —
-- ikinci kısım bir sonraki adımdır.
--
-- Platform yöneticisi (app_role = platform_admin) tüm kiracıları görür:
-- Süper Admin paneli bunun üstüne kurulu.
--
-- Pazaryeri tabloları kiracılar arası; politikaları elle yazıldı.
-- =====================================================================

-- --- Yetkiler ---------------------------------------------------------
-- Tablo düzeyinde izin ver; satır düzeyinde RLS süzsün.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;

-- Görünümler
grant select on public.agency_balance, public.agency_statement,
                public.booking_totals, public.marketplace_settlement to authenticated;

-- --- Kiracı tabloları: tek genel politika --------------------------
-- `tenant_id` kolonu olan her tablo. Pazaryeri ve ilk-taraf tabloları
-- aşağıda ayrıca ele alınır; burada atlanır.
do $$
declare
  t record;
  skip text[] := array[
    'marketplace_pricing_rule','marketplace_profile','marketplace_access',
    'marketplace_listing','marketplace_contract','marketplace_contract_listing',
    'audit_log'
  ];
begin
  for t in
    select c.table_name
      from information_schema.columns c
      join pg_tables p on p.tablename = c.table_name and p.schemaname = 'public'
     where c.table_schema = 'public' and c.column_name = 'tenant_id'
       and not (c.table_name = any(skip))
  loop
    execute format(
      'create policy tenant_isolation on public.%I for all to authenticated
         using (tenant_id = public.app_tenant_id() or public.is_platform_admin())
         with check (tenant_id = public.app_tenant_id() or public.is_platform_admin())',
      t.table_name);
  end loop;
end $$;

-- --- tenant: kendi kiracın (id) -------------------------------------
create policy tenant_self on public.tenant
  for select to authenticated
  using (id = public.app_tenant_id() or public.is_platform_admin());
create policy tenant_admin_write on public.tenant
  for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- --- Platform sözlükleri: herkes okur, yalnız platform yöneticisi yazar
do $$
declare t text;
begin
  foreach t in array array['currency','fx_source','fx_rate','plan','plan_feature','role_scope']
  loop
    execute format('create policy reference_read on public.%I for select to authenticated using (true)', t);
    execute format('create policy reference_admin_write on public.%I for all to authenticated
                      using (public.is_platform_admin()) with check (public.is_platform_admin())', t);
  end loop;
end $$;

-- --- audit_log: tenant_id nullable ----------------------------------
create policy audit_tenant_read on public.audit_log
  for select to authenticated
  using (tenant_id = public.app_tenant_id() or public.is_platform_admin());
create policy audit_tenant_insert on public.audit_log
  for insert to authenticated
  with check (tenant_id = public.app_tenant_id() or public.is_platform_admin());

-- --- Pazaryeri: iki taraflı politikalar ----------------------------

-- Erişim kaydı: kendi acentenin durumunu görürsün; platform yönetir.
create policy mp_access_read on public.marketplace_access
  for select to authenticated
  using (tenant_id = public.app_tenant_id() or public.is_platform_admin());
create policy mp_access_admin_write on public.marketplace_access
  for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create or replace function public.has_marketplace_access()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.marketplace_access a
     where a.agency_id = public.app_agency_id()
       and a.active
       and (a.valid_until is null or a.valid_until > now())
  ) or public.is_platform_admin()
$$;

-- Vitrin: görünür profiller herkese (duvarın önündeki önizleme),
-- kendi profilin her zaman; yazma yalnız sahibine.
create policy mp_profile_read on public.marketplace_profile
  for select to authenticated
  using (is_visible or tenant_id = public.app_tenant_id() or public.is_platform_admin());
create policy mp_profile_owner_write on public.marketplace_profile
  for all to authenticated
  using (tenant_id = public.app_tenant_id())
  with check (tenant_id = public.app_tenant_id());

-- Fiyat kuralı: sahibi yazar; okuyan ya sahibi ya abonelik duvarını
-- geçmiş biri (kuralın fiyatı listelemede zaten görünür).
create policy mp_rule_read on public.marketplace_pricing_rule
  for select to authenticated
  using (owner_tenant_id = public.app_tenant_id() or public.has_marketplace_access());
create policy mp_rule_owner_write on public.marketplace_pricing_rule
  for all to authenticated
  using (owner_tenant_id = public.app_tenant_id())
  with check (owner_tenant_id = public.app_tenant_id());

-- Listeleme: sahibi her şeyi görür/yazar; aboneler aktif olanları görür.
-- Abone olmayan fiyatı GÖREMEZ — duvar burada, arayüzde değil.
create policy mp_listing_read on public.marketplace_listing
  for select to authenticated
  using (
    supplier_tenant_id = public.app_tenant_id()
    or (is_active and public.has_marketplace_access())
  );
create policy mp_listing_owner_write on public.marketplace_listing
  for all to authenticated
  using (supplier_tenant_id = public.app_tenant_id())
  with check (supplier_tenant_id = public.app_tenant_id());

-- Kontrat: iki taraf da görür ve durum değiştirir; talebi satıcı açar.
create policy mp_contract_party_read on public.marketplace_contract
  for select to authenticated
  using (supplier_tenant_id = public.app_tenant_id()
      or seller_tenant_id = public.app_tenant_id()
      or public.is_platform_admin());
create policy mp_contract_seller_insert on public.marketplace_contract
  for insert to authenticated
  with check (seller_tenant_id = public.app_tenant_id()
          and seller_agency_id = public.app_agency_id()
          and public.has_marketplace_access());
create policy mp_contract_party_update on public.marketplace_contract
  for update to authenticated
  using (supplier_tenant_id = public.app_tenant_id()
      or seller_tenant_id = public.app_tenant_id())
  with check (supplier_tenant_id = public.app_tenant_id()
          or seller_tenant_id = public.app_tenant_id());

-- Kontrat kapsamı: kontratın tarafı olan görür; tedarikçi ekler/çıkarır.
create policy mp_contract_listing_read on public.marketplace_contract_listing
  for select to authenticated
  using (exists (
    select 1 from public.marketplace_contract c
     where c.id = contract_id
       and (c.supplier_tenant_id = public.app_tenant_id()
         or c.seller_tenant_id = public.app_tenant_id())
  ));
create policy mp_contract_listing_supplier_write on public.marketplace_contract_listing
  for all to authenticated
  using (exists (
    select 1 from public.marketplace_contract c
     where c.id = contract_id and c.supplier_tenant_id = public.app_tenant_id()
  ))
  with check (exists (
    select 1 from public.marketplace_contract c
     where c.id = contract_id and c.supplier_tenant_id = public.app_tenant_id()
  ));
