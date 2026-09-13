-- =====================================================================
-- 0018 — Vitrin profili ve vitrinden rezervasyon
--
-- 1) tenant_profile: vitrinde görünen iletişim/hakkımızda/TÜRSAB bilgisi.
--    Kimlik (tenant) ile karıştırılmaz: bunlar pazarlama metnidir,
--    acente yöneticisi düzenler, anon okur.
--
-- 2) create_storefront_booking: müşteri giriş yapmadan sipariş verir.
--    anon'un booking/customer tablolarında hakkı YOK; sipariş yalnız bu
--    fonksiyonla, sunucu tarafından (service_role) açılır. Fiyat İSTEMCİDEN
--    ALINMAZ — fonksiyon turun güncel fiyatını kendisi okur (READINESS
--    kırmızı çizgi 3: "para hesabı yalnız istemcide" burada kapanır).
--    Kalkışlı turda kontenjan satır kilidiyle düşülür: iki eşzamanlı
--    sipariş aynı koltuğu alamaz.
-- =====================================================================

create table tenant_profile (
  tenant_id     uuid primary key references tenant(id) on delete cascade,
  about         text not null default '',
  contact_email text,
  contact_phone text,
  phone_hours   text,
  address       text,
  tursab_no     text,
  updated_at    timestamptz not null default now()
);
comment on table tenant_profile is 'Vitrinde görünen acente bilgileri. Kimlik değil, pazarlama metni; acente yöneticisi düzenler, anon okur.';

alter table tenant_profile enable row level security;
alter table tenant_profile force row level security;
grant select, insert, update on tenant_profile to authenticated;
grant select on tenant_profile to anon;

create policy tenant_isolation on tenant_profile
  for all to authenticated
  using (tenant_id = (select public.app_tenant_id()) or (select public.is_platform_admin()))
  with check (tenant_id = (select public.app_tenant_id()) or (select public.is_platform_admin()));
create policy storefront_profile on tenant_profile
  for select to anon using (true);

-- Marka: vitrin rengi acente yöneticisince de yazılabilsin (insert/update
-- yetkisi 0015'te verildi; politika tenant_isolation zaten var).

-- --- Vitrinden sipariş ------------------------------------------------

create or replace function public.create_storefront_booking(
  p_tenant_id uuid,
  p_customer  jsonb,   -- {full_name, email, phone}
  p_items     jsonb    -- [{slug, departure_id|null, adults, children}]
)
returns table (booking_id uuid, ref text, total bigint, currency char(3))
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_agency   uuid;
  v_customer uuid;
  v_booking  uuid;
  v_ref      text;
  v_currency char(3);
  v_total    bigint := 0;
  item       jsonb;
  t          record;
  d          record;
  v_qty      integer;
  v_price    bigint;
  v_starts   timestamptz;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  select id into v_agency from public.agency
   where tenant_id = p_tenant_id and type = 'master'
   order by created_at limit 1;
  if v_agency is null then raise exception 'NO_AGENCY'; end if;

  insert into public.customer (tenant_id, agency_id, full_name, email, phone)
  values (p_tenant_id, v_agency,
          btrim(p_customer ->> 'full_name'),
          nullif(lower(btrim(p_customer ->> 'email')), ''),
          nullif(btrim(p_customer ->> 'phone'), ''))
  returning id into v_customer;

  -- Kiracı içinde tekil, okunabilir referans: KNT-XXXXXX
  loop
    -- Karışabilen karakterler (0/O, 1/I/l) ve base64 işaretleri elenir.
    v_ref := 'KNT-' || upper(substr(
      translate(encode(extensions.gen_random_bytes(9), 'base64'), '+/=0O1Il', 'ABCDEFGH'), 1, 6));
    exit when not exists (select 1 from public.booking b where b.tenant_id = p_tenant_id and b.ref = v_ref);
  end loop;

  -- Para birimi ilk kalemin turundan; karışık para birimi reddedilir.
  select tr.pricing_currency into v_currency
    from public.tour tr
   where tr.tenant_id = p_tenant_id and tr.slug = (p_items -> 0 ->> 'slug');
  if v_currency is null then raise exception 'TOUR_NOT_FOUND'; end if;

  insert into public.booking (tenant_id, agency_id, ref, customer_id, status, currency, source_channel)
  values (p_tenant_id, v_agency, v_ref, v_customer, 'PENDING', v_currency, 'direkt')
  returning id into v_booking;

  for item in select * from jsonb_array_elements(p_items) loop
    select tr.id, tr.title, tr.pricing_currency,
           (select ag.price from public.tour_age_tier ag
             where ag.tour_id = tr.id and ag.key = 'adult' and ag.enabled) as adult_price
      into t
      from public.tour tr
     where tr.tenant_id = p_tenant_id and tr.slug = (item ->> 'slug')
       and tr.status = 'aktif' and tr.show_on_website;
    if t.id is null then raise exception 'TOUR_NOT_FOUND'; end if;
    if t.pricing_currency <> v_currency then raise exception 'MIXED_CURRENCY'; end if;

    v_qty := coalesce((item ->> 'adults')::int, 0) + coalesce((item ->> 'children')::int, 0);
    if v_qty <= 0 then raise exception 'NO_PAX'; end if;

    v_price := coalesce(t.adult_price, 0);
    v_starts := null;

    if nullif(item ->> 'departure_id', '') is not null then
      -- Satır kilidi: eşzamanlı iki sipariş aynı koltuğu alamaz.
      select * into d from public.tour_departure dp
       where dp.id = (item ->> 'departure_id')::uuid and dp.tour_id = t.id
       for update;
      if d.id is null then raise exception 'DEPARTURE_NOT_FOUND'; end if;
      if d.stop_sale then raise exception 'STOP_SALE'; end if;
      if d.booked_count + v_qty > d.capacity then raise exception 'SOLD_OUT'; end if;
      update public.tour_departure set booked_count = booked_count + v_qty where id = d.id;
      v_price  := coalesce(d.price_override, v_price);
      v_starts := d.starts_at;
    end if;

    if v_price <= 0 then raise exception 'NO_PRICE'; end if;

    insert into public.booking_item
      (tenant_id, booking_id, item_kind, tour_id, tour_departure_id,
       title_snapshot, starts_at, quantity, unit_net_price, margin_pct, currency, status)
    values
      (p_tenant_id, v_booking, 'tour', t.id, d.id,
       t.title, v_starts, v_qty, v_price, 0, v_currency, 'PENDING');

    v_total := v_total + v_price * v_qty;
    d := null;
  end loop;

  insert into public.booking_status_history (tenant_id, booking_id, from_status, to_status, reason)
  values (p_tenant_id, v_booking, null, 'PENDING', 'vitrin siparişi');

  return query select v_booking, v_ref, v_total, v_currency;
end;
$$;

revoke execute on function public.create_storefront_booking(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_storefront_booking(uuid, jsonb, jsonb) to service_role;
