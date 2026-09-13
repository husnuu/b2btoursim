-- =====================================================================
-- 0022 — İlan detay sayfaları: anon okuma genişlemesi + çok türlü sipariş
--
-- 1) Detay sayfaları alt tabloları okur: tekne kademeleri/özellikleri,
--    villa özellikleri/bölgeleri/mesafeleri, araç özellikleri.
--    Yalnız yayındaki (aktif) ana kaydın alt kayıtları görünür.
--
-- 2) create_storefront_booking v2: tur dışında tekne, villa, transfer ve
--    vize talebi de alır. Fiyat yine sunucuda hesaplanır:
--      tekne  : saatlik → saat × ücret (+ kademe indirimi), çok günlü →
--               birim × ücret, kişi başı → kişi × ücret; kaptanlı ise ücret
--      villa  : gece × gecelik (min_nights kontrolü)
--      transfer: saatlik kiralama → saat × ücret; rota bazlı → 0 (teklif)
--      vize   : kişi × ücret
--    Tekne ve villada takvim çakışması EXCLUDE kısıtıyla veritabanında
--    engellenir; fonksiyon bunu DATES_TAKEN olarak raporlar.
-- =====================================================================

grant select on
  boat_hourly_tier, boat_feature, boat_feature_link, boat_extra, boat_extra_link, boat_translation,
  villa_feature, villa_feature_link, villa_region, villa_region_link, villa_poi_distance,
  villa_booking_method_option, villa_translation,
  vehicle_feature, vehicle_feature_link, vehicle_translation
to anon;

create or replace function public.boat_is_public(p uuid) returns boolean
language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.boat b where b.id = p and b.status = 'aktif') $$;
create or replace function public.villa_is_public(p uuid) returns boolean
language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.villa v where v.id = p and v.status = 'aktif') $$;
create or replace function public.vehicle_is_public(p uuid) returns boolean
language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.vehicle v where v.id = p and v.status = 'aktif') $$;

create policy storefront_boat_tier on boat_hourly_tier for select to anon using (public.boat_is_public(boat_id));
create policy storefront_boat_feature on boat_feature for select to anon using (true);
create policy storefront_boat_feature_link on boat_feature_link for select to anon using (public.boat_is_public(boat_id));
create policy storefront_boat_extra on boat_extra for select to anon using (true);
create policy storefront_boat_extra_link on boat_extra_link for select to anon using (public.boat_is_public(boat_id));
create policy storefront_boat_translation on boat_translation for select to anon using (public.boat_is_public(boat_id));
create policy storefront_villa_feature on villa_feature for select to anon using (true);
create policy storefront_villa_feature_link on villa_feature_link for select to anon using (public.villa_is_public(villa_id));
create policy storefront_villa_region on villa_region for select to anon using (true);
create policy storefront_villa_region_link on villa_region_link for select to anon using (public.villa_is_public(villa_id));
create policy storefront_villa_poi on villa_poi_distance for select to anon using (public.villa_is_public(villa_id));
create policy storefront_villa_method on villa_booking_method_option for select to anon using (public.villa_is_public(villa_id));
create policy storefront_villa_translation on villa_translation for select to anon using (public.villa_is_public(villa_id));
create policy storefront_vehicle_feature on vehicle_feature for select to anon using (true);
create policy storefront_vehicle_feature_link on vehicle_feature_link for select to anon using (public.vehicle_is_public(vehicle_id));
create policy storefront_vehicle_translation on vehicle_translation for select to anon using (public.vehicle_is_public(vehicle_id));

-- Görseller: tur dışındaki sahiplerin de yayındaki görselleri okunur.
drop policy storefront_media on media_asset;
create policy storefront_media on media_asset for select to anon using (
  (tour_id is not null and public.tour_is_public(tour_id)) or
  (boat_id is not null and public.boat_is_public(boat_id)) or
  (villa_id is not null and public.villa_is_public(villa_id)) or
  (vehicle_id is not null and public.vehicle_is_public(vehicle_id)));

-- --- Çok türlü sipariş ------------------------------------------------

create or replace function public.create_storefront_booking(
  p_tenant_id uuid,
  p_customer  jsonb,
  p_items     jsonb
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
  v_kind     text;
  v_qty      integer;
  v_price    bigint;
  v_starts   timestamptz;
  v_title    text;
  v_item_id  uuid;
  v_item_cur char(3);
  t          record;
  d          record;
  b          record;
  v          record;
  vh         record;
  vs         record;
  v_from     timestamp;
  v_to       timestamp;
  v_hours    numeric;
  v_units    integer;
  v_tier_pct numeric := 0;
begin
  if jsonb_array_length(p_items) = 0 then raise exception 'EMPTY_CART'; end if;

  select id into v_agency from public.agency
   where tenant_id = p_tenant_id and type = 'master' order by created_at limit 1;
  if v_agency is null then raise exception 'NO_AGENCY'; end if;

  insert into public.customer (tenant_id, agency_id, full_name, email, phone)
  values (p_tenant_id, v_agency, btrim(p_customer ->> 'full_name'),
          nullif(lower(btrim(p_customer ->> 'email')), ''), nullif(btrim(p_customer ->> 'phone'), ''))
  returning id into v_customer;

  loop
    v_ref := 'KNT-' || upper(substr(translate(encode(extensions.gen_random_bytes(9), 'base64'), '+/=0O1Il', 'ABCDEFGH'), 1, 6));
    exit when not exists (select 1 from public.booking bk where bk.tenant_id = p_tenant_id and bk.ref = v_ref);
  end loop;

  -- Başlık satırı; para birimi ilk kalemden gelir (aşağıda set edilir).
  insert into public.booking (tenant_id, agency_id, ref, customer_id, status, currency, source_channel)
  values (p_tenant_id, v_agency, v_ref, v_customer, 'PENDING', 'TRY', 'direkt')
  returning id into v_booking;

  for item in select * from jsonb_array_elements(p_items) loop
    v_kind := coalesce(item ->> 'kind', 'tour');
    v_qty  := coalesce((item ->> 'adults')::int, 0) + coalesce((item ->> 'children')::int, 0);
    if v_qty <= 0 then raise exception 'NO_PAX'; end if;
    v_starts := null; d := null; v_tier_pct := 0;

    if v_kind = 'tour' then
      select tr.id, tr.title, tr.pricing_currency,
             (select ag.price from public.tour_age_tier ag where ag.tour_id = tr.id and ag.key = 'adult' and ag.enabled) as adult_price,
             (select ag.price from public.tour_age_tier ag where ag.tour_id = tr.id and ag.key = 'child' and ag.enabled) as child_price
        into t from public.tour tr
       where tr.tenant_id = p_tenant_id and tr.slug = (item ->> 'slug') and tr.status = 'aktif' and tr.show_on_website;
      if t.id is null then raise exception 'TOUR_NOT_FOUND'; end if;
      v_item_id := t.id; v_title := t.title; v_item_cur := t.pricing_currency;
      -- Çocuk kademesi varsa ayrı fiyat; yoksa yetişkin fiyatı.
      v_price := coalesce(t.adult_price, 0);
      if nullif(item ->> 'departure_id', '') is not null then
        select * into d from public.tour_departure dp
         where dp.id = (item ->> 'departure_id')::uuid and dp.tour_id = t.id for update;
        if d.id is null then raise exception 'DEPARTURE_NOT_FOUND'; end if;
        if d.stop_sale then raise exception 'STOP_SALE'; end if;
        if d.booked_count + v_qty > d.capacity then raise exception 'SOLD_OUT'; end if;
        update public.tour_departure set booked_count = booked_count + v_qty where id = d.id;
        v_price := coalesce(d.price_override, v_price);
        v_starts := d.starts_at;
      end if;
      if v_price <= 0 then raise exception 'NO_PRICE'; end if;
      insert into public.booking_item (tenant_id, booking_id, item_kind, tour_id, tour_departure_id, title_snapshot, starts_at, quantity, unit_net_price, margin_pct, currency, status)
      values (p_tenant_id, v_booking, 'tour', t.id, d.id, v_title, v_starts, v_qty, v_price, 0, v_item_cur, 'PENDING');
      v_total := v_total + v_price * v_qty;

    elsif v_kind = 'boat' then
      select * into b from public.boat bt where bt.tenant_id = p_tenant_id and bt.slug = (item ->> 'slug') and bt.status = 'aktif';
      if b.id is null then raise exception 'BOAT_NOT_FOUND'; end if;
      v_from := ((item -> 'detail' ->> 'from_date') || ' ' || coalesce(item -> 'detail' ->> 'from_time', '10:00'))::timestamp;
      v_to   := ((item -> 'detail' ->> 'to_date')   || ' ' || coalesce(item -> 'detail' ->> 'to_time',   '18:00'))::timestamp;
      if v_to <= v_from then raise exception 'BAD_PERIOD'; end if;
      v_hours := extract(epoch from (v_to - v_from)) / 3600;
      if b.pricing_model = 'saatlik' then
        if v_hours < b.min_rental_hours then raise exception 'MIN_HOURS'; end if;
        select coalesce(max(discount_pct), 0) into v_tier_pct from public.boat_hourly_tier ht where ht.boat_id = b.id and ht.after_hours <= v_hours;
        v_price := round(b.hourly_rate * v_hours * (1 - v_tier_pct / 100)); v_units := 1;
      elsif b.pricing_model = 'cokGunlu' then
        v_units := greatest(1, ceil(v_hours / 24))::int;
        if v_units < coalesce(b.multiday_min_units, 1) then raise exception 'MIN_UNITS'; end if;
        v_price := b.multiday_unit_price * v_units; v_units := 1;
      else
        if v_qty < coalesce(b.per_person_min_group, 1) then raise exception 'MIN_GROUP'; end if;
        v_price := b.per_person_price; v_units := v_qty;
      end if;
      if (item -> 'detail' ->> 'captain') = 'kaptanli' and b.captain_fee is not null then
        v_price := v_price + case when b.captain_fee_unit = 'saatlik' then round(b.captain_fee * v_hours) else b.captain_fee * greatest(1, ceil(v_hours / 24))::int end;
      end if;
      if v_price <= 0 then raise exception 'NO_PRICE'; end if;
      insert into public.booking_item (tenant_id, booking_id, item_kind, boat_id, title_snapshot, starts_at, quantity, unit_net_price, margin_pct, currency, status)
      values (p_tenant_id, v_booking, 'boat', b.id, b.title, v_from at time zone 'Europe/Istanbul', coalesce(v_units, 1), v_price, 0, b.currency, 'PENDING')
      returning id into v_item_id;
      begin
        insert into public.boat_booking_detail (booking_item_id, tenant_id, boat_id, from_date, from_time, to_date, to_time, captain_option, security_deposit)
        values (v_item_id, p_tenant_id, b.id, v_from::date, v_from::time, v_to::date, v_to::time,
                case when (item -> 'detail' ->> 'captain') = 'kaptansiz' then 'kaptansiz'::public.captain_option else 'kaptanli'::public.captain_option end,
                b.security_deposit);
      exception when exclusion_violation then
        raise exception 'DATES_TAKEN';
      end;
      v_item_cur := b.currency; v_total := v_total + v_price * coalesce(v_units, 1);

    elsif v_kind = 'villa' then
      select * into v from public.villa vl where vl.tenant_id = p_tenant_id and vl.slug = (item ->> 'slug') and vl.status = 'aktif';
      if v.id is null then raise exception 'VILLA_NOT_FOUND'; end if;
      v_from := (item -> 'detail' ->> 'check_in')::date; v_to := (item -> 'detail' ->> 'check_out')::date;
      v_units := (v_to::date - v_from::date);
      if v_units < 1 then raise exception 'BAD_PERIOD'; end if;
      if v_units < v.min_nights then raise exception 'MIN_NIGHTS'; end if;
      if v_qty > v.capacity then raise exception 'CAPACITY'; end if;
      v_price := v.nightly_rate;
      if v_price <= 0 then raise exception 'NO_PRICE'; end if;
      insert into public.booking_item (tenant_id, booking_id, item_kind, villa_id, title_snapshot, starts_at, quantity, unit_net_price, margin_pct, currency, status)
      values (p_tenant_id, v_booking, 'villa', v.id, v.title, v_from at time zone 'Europe/Istanbul', v_units, v_price, 0, v.price_currency, 'PENDING')
      returning id into v_item_id;
      begin
        insert into public.villa_booking_detail (booking_item_id, tenant_id, villa_id, check_in_date, check_out_date, guests, booking_method)
        values (v_item_id, p_tenant_id, v.id, v_from::date, v_to::date, v_qty, 'talepTopla');
      exception when exclusion_violation then
        raise exception 'DATES_TAKEN';
      end;
      v_item_cur := v.price_currency; v_total := v_total + v_price * v_units;

    elsif v_kind = 'transfer' then
      select * into vh from public.vehicle ve where ve.tenant_id = p_tenant_id and ve.id = (item ->> 'id')::uuid and ve.status = 'aktif';
      if vh.id is null then raise exception 'VEHICLE_NOT_FOUND'; end if;
      if v_qty > vh.seat_capacity then raise exception 'CAPACITY'; end if;
      v_from := ((item -> 'detail' ->> 'date') || ' ' || coalesce(item -> 'detail' ->> 'time', '09:00'))::timestamp;
      v_hours := coalesce((item -> 'detail' ->> 'hours')::numeric, 0);
      -- Saatlik kiralama fiyatlanır; rota bazlı transfer teklif olarak açılır (fiyat 0).
      v_price := case when vh.pricing_model = 'saatlikKiralama' and v_hours > 0 then round(vh.hourly_rate * v_hours) else 0 end;
      insert into public.booking_item (tenant_id, booking_id, item_kind, vehicle_id, title_snapshot, starts_at, quantity, unit_net_price, margin_pct, currency, status)
      values (p_tenant_id, v_booking, 'transfer', vh.id, vh.title, v_from at time zone 'Europe/Istanbul', 1, v_price, 0, coalesce(vh.hourly_currency, 'TRY'), 'PENDING')
      returning id into v_item_id;
      insert into public.transfer_booking_detail (booking_item_id, tenant_id, model, from_label, to_label, one_way, pickup_date, pickup_time, adults, children)
      values (v_item_id, p_tenant_id,
              case when vh.pricing_model = 'saatlikKiralama' then 'saatlik'::public.transfer_booking_model else 'nokta'::public.transfer_booking_model end,
              coalesce(item -> 'detail' ->> 'from', ''), coalesce(item -> 'detail' ->> 'to', ''), true,
              v_from::date, v_from::time, coalesce((item ->> 'adults')::int, 0), coalesce((item ->> 'children')::int, 0));
      v_item_cur := coalesce(vh.hourly_currency, 'TRY'); v_total := v_total + v_price;

    elsif v_kind = 'visa' then
      select * into vs from public.visa_product vp where vp.tenant_id = p_tenant_id and vp.id = (item ->> 'id')::uuid and vp.status = 'aktif';
      if vs.id is null then raise exception 'VISA_NOT_FOUND'; end if;
      v_price := vs.price;
      if v_price <= 0 then raise exception 'NO_PRICE'; end if;
      insert into public.booking_item (tenant_id, booking_id, item_kind, visa_product_id, title_snapshot, quantity, unit_net_price, margin_pct, currency, status)
      values (p_tenant_id, v_booking, 'visa', vs.id, vs.title, v_qty, v_price, 0, vs.currency, 'PENDING')
      returning id into v_item_id;
      insert into public.visa_booking_detail (booking_item_id, tenant_id) values (v_item_id, p_tenant_id);
      v_item_cur := vs.currency; v_total := v_total + v_price * v_qty;
    else
      raise exception 'BAD_KIND';
    end if;

    if v_currency is null then v_currency := v_item_cur;
    elsif v_currency <> v_item_cur then raise exception 'MIXED_CURRENCY'; end if;
  end loop;

  update public.booking set currency = v_currency where id = v_booking;
  insert into public.booking_status_history (tenant_id, booking_id, from_status, to_status, reason)
  values (p_tenant_id, v_booking, null, 'PENDING', 'vitrin siparişi');

  return query select v_booking, v_ref, v_total, v_currency;
end;
$$;

revoke execute on function public.create_storefront_booking(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_storefront_booking(uuid, jsonb, jsonb) to service_role;
