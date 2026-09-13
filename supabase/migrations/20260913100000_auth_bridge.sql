-- =====================================================================
-- 0014 — Kimlik köprüsü: auth.users ↔ app_user, JWT talepleri
--
-- MODEL: DAVETLE GİRİŞ. Açık kayıt yok. Bir kullanıcı ancak önce
-- `app_user` satırı (status = invited) açılmış ve e-postasına davet
-- gönderilmişse Auth'ta var olabilir. Bunu uygulama değil, veritabanı
-- garanti eder: auth.users'a app_user karşılığı olmayan bir satır
-- girilirse tetikleyici işlemi geri alır — anon anahtarla signUp
-- çağıran biri bile kayıt olamaz.
--
-- JWT'ye eklenen talepler (custom access token hook):
--   app_user_id, tenant_id, agency_id, app_role, scopes[]
-- `role` adı Supabase tarafından ayrılmış (anon/authenticated); bizim
-- rol `app_role` adıyla taşınır.
--
-- Bu dosya uygulandıktan sonra Dashboard'da tek bir el işi kalır:
-- Authentication → Hooks → Custom Access Token → public.custom_access_token_hook
-- =====================================================================

-- --- JWT okuyucular ---------------------------------------------------
-- RLS politikaları bunları çağırır. `stable` + tek satır: planlayıcı
-- sorgu başına bir kez değerlendirir.

create or replace function public.app_tenant_id()
returns uuid language sql stable
as $$ select nullif(auth.jwt() ->> 'tenant_id', '')::uuid $$;

create or replace function public.app_agency_id()
returns uuid language sql stable
as $$ select nullif(auth.jwt() ->> 'agency_id', '')::uuid $$;

create or replace function public.app_role()
returns user_role language sql stable
as $$ select nullif(auth.jwt() ->> 'app_role', '')::user_role $$;

create or replace function public.app_user_id()
returns uuid language sql stable
as $$ select nullif(auth.jwt() ->> 'app_user_id', '')::uuid $$;

create or replace function public.app_has_scope(required text)
returns boolean language sql stable
as $$
  select coalesce(
    (auth.jwt() -> 'scopes') ? required
    or (auth.jwt() -> 'scopes') ? '*:read' and required like '%:read',
    false
  )
$$;

create or replace function public.is_platform_admin()
returns boolean language sql stable
as $$ select public.app_role() = 'platform_admin' $$;

-- --- Custom access token hook ----------------------------------------
-- Her token üretiminde (giriş, yenileme) çalışır. Kullanıcının
-- app_user satırı yoksa ya da devre dışıysa girişi REDDEDER.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims jsonb;
  u record;
  scope_list jsonb;
begin
  select id, tenant_id, agency_id, role, status
    into u
    from public.app_user
   where auth_user_id = (event ->> 'user_id')::uuid;

  if not found then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'Bu hesap bir acenteye bağlı değil. Acente yöneticinizden davet isteyin.'
    ));
  end if;

  if u.status = 'disabled' then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'Hesabınız devre dışı bırakılmış.'
    ));
  end if;

  select coalesce(jsonb_agg(scope order by scope), '[]'::jsonb)
    into scope_list
    from public.role_scope
   where role = u.role;

  claims := event -> 'claims';
  claims := claims
    || jsonb_build_object(
         'app_user_id', u.id,
         'tenant_id',   u.tenant_id,
         'agency_id',   u.agency_id,
         'app_role',    u.role,
         'scopes',      scope_list
       );

  return jsonb_build_object('claims', claims);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- Hook `security definer` ama tablolar `force row level security`:
-- sahibi bile politika olmadan okuyamaz. Auth admin için açık politika.
grant select on public.app_user, public.role_scope to supabase_auth_admin;
create policy auth_admin_reads_app_user on public.app_user
  for select to supabase_auth_admin using (true);
create policy auth_admin_reads_role_scope on public.role_scope
  for select to supabase_auth_admin using (true);

-- --- auth.users → app_user bağlama ------------------------------------
-- Davet: uygulama önce app_user (invited) açar, sonra
-- auth.admin.inviteUserByEmail(email, { data: { app_user_id } }) çağırır.
-- Auth kaydı oluşunca bu tetikleyici iki satırı bağlar. Eşleşme yoksa
-- kayıt REDDEDİLİR — davetsiz kayıt yolu veritabanında kapalı.

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
  matched integer;
begin
  target_id := nullif(new.raw_user_meta_data ->> 'app_user_id', '')::uuid;

  if target_id is not null then
    update public.app_user
       set auth_user_id = new.id
     where id = target_id
       and auth_user_id is null
       and lower(email) = lower(new.email);
    get diagnostics matched = row_count;
  else
    -- Meta veri yoksa e-postayla eşle; birden çok kiracıda aynı e-posta
    -- varsa belirsizlik var, reddet.
    select count(*) into matched
      from public.app_user
     where lower(email) = lower(new.email) and auth_user_id is null;
    if matched = 1 then
      update public.app_user
         set auth_user_id = new.id
       where lower(email) = lower(new.email) and auth_user_id is null;
    end if;
  end if;

  if matched <> 1 then
    raise exception 'Davetsiz kayıt: % için bekleyen bir davet yok', new.email
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_created();

-- İlk giriş: davetli → aktif, son görülme güncellenir.
create or replace function public.handle_auth_user_signed_in()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at then
    update public.app_user
       set last_seen_at = new.last_sign_in_at,
           status = case when status = 'invited' then 'active' else status end
     where auth_user_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_signed_in on auth.users;
create trigger on_auth_user_signed_in
  after update of last_sign_in_at on auth.users
  for each row execute function public.handle_auth_user_signed_in();

-- Auth kaydı silinirse uygulama kullanıcısı devre dışı kalır, silinmez
-- (rezervasyon geçmişi, denetim izi ona bakıyor).
create or replace function public.handle_auth_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.app_user
     set auth_user_id = null, status = 'disabled'
   where auth_user_id = old.id;
  return old;
end;
$$;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.handle_auth_user_deleted();
