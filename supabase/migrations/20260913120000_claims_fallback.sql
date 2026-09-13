-- =====================================================================
-- 0016 — Talep yedeği: hook olmadan da çalış
--
-- 0014'teki custom_access_token_hook, Dashboard'da elle seçilmesi
-- gereken bir ayara bağlıydı. Sistemin doğruluğu bir panel toggle'ına
-- bağlı olmamalı. Bu dosya JWT okuyucularını iki kademeli yapar:
--
--   1) JWT'de talep varsa (hook açık) onu kullan — sorgu yok.
--   2) Yoksa app_user tablosuna auth.uid() ile bak.
--
-- Fonksiyonlar `security definer` (sahibi postgres, bypassrls yetkili):
-- app_user'ın kendi RLS politikası bu fonksiyonu çağırdığı için, fonksiyon
-- RLS'e takılsaydı sonsuz özyineleme olurdu.
--
-- Politikalar `(select fn())` biçimine çevrildi: planlayıcı fonksiyonu
-- satır başına değil, sorgu başına bir kez değerlendirir.
-- =====================================================================

create or replace function public.app_user_id()
returns uuid language sql stable security definer set search_path = ''
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'app_user_id', '')::uuid,
    (select u.id from public.app_user u
      where u.auth_user_id = auth.uid() and u.status <> 'disabled' limit 1)
  )
$$;

create or replace function public.app_tenant_id()
returns uuid language sql stable security definer set search_path = ''
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'tenant_id', '')::uuid,
    (select u.tenant_id from public.app_user u
      where u.auth_user_id = auth.uid() and u.status <> 'disabled' limit 1)
  )
$$;

create or replace function public.app_agency_id()
returns uuid language sql stable security definer set search_path = ''
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'agency_id', '')::uuid,
    (select u.agency_id from public.app_user u
      where u.auth_user_id = auth.uid() and u.status <> 'disabled' limit 1)
  )
$$;

create or replace function public.app_role()
returns public.user_role language sql stable security definer set search_path = ''
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'app_role', '')::public.user_role,
    (select u.role from public.app_user u
      where u.auth_user_id = auth.uid() and u.status <> 'disabled' limit 1)
  )
$$;

create or replace function public.app_has_scope(required text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select case
    when auth.jwt() ? 'scopes' then
      coalesce(
        (auth.jwt() -> 'scopes') ? required
        or ((auth.jwt() -> 'scopes') ? '*:read' and required like '%:read'),
        false)
    else exists (
      select 1
        from public.app_user u
        join public.role_scope rs on rs.role = u.role
       where u.auth_user_id = auth.uid()
         and u.status <> 'disabled'
         and (rs.scope = required or (rs.scope = '*:read' and required like '%:read'))
    )
  end
$$;

-- is_platform_admin app_role()'ü çağırır; yeniden tanımlamaya gerek yok.

-- Kiracı izolasyon politikalarını sorgu başına tek değerlendirmeye çevir.
do $$
declare t record;
begin
  for t in
    select tablename from pg_policies
     where schemaname = 'public' and policyname = 'tenant_isolation'
  loop
    execute format('drop policy tenant_isolation on public.%I', t.tablename);
    execute format(
      'create policy tenant_isolation on public.%I for all to authenticated
         using (tenant_id = (select public.app_tenant_id()) or (select public.is_platform_admin()))
         with check (tenant_id = (select public.app_tenant_id()) or (select public.is_platform_admin()))',
      t.tablename);
  end loop;
end $$;

drop policy tenant_self on public.tenant;
create policy tenant_self on public.tenant
  for select to authenticated
  using (id = (select public.app_tenant_id()) or (select public.is_platform_admin()));
