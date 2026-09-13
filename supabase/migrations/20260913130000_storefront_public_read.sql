-- =====================================================================
-- 0017 — Vitrin (B2C) için anonim okuma
--
-- Müşteri giriş yapmaz. Vitrin `anon` rolüyle okur; görebileceği şey
-- yalnız YAYINDAKİ envanter ve kiracının kamuya açık kimliği. Net fiyat,
-- marj, tedarikçi, rezervasyon, kullanıcı — hiçbiri bu politikalara
-- girmez; anon'un o tablolarda SELECT yetkisi bile yok.
--
-- "Yayında": tour.status = 'aktif' AND show_on_website. Alt tablolar bu
-- koşulu üst tablo üzerinden miras alır (exists ...).
-- =====================================================================

grant usage on schema public to anon;
grant select on
  public.tenant, public.tenant_branding, public.tenant_domain,
  public.tour, public.tour_age_tier, public.tour_departure, public.itinerary_stop,
  public.tour_category, public.tour_category_link, public.tour_translation,
  public.media_asset, public.cancellation_policy, public.cancellation_cutoff,
  public.location_point
to anon;

create or replace function public.tour_is_public(p_tour_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.tour t
     where t.id = p_tour_id and t.status = 'aktif' and t.show_on_website
  )
$$;

-- Kiracı kimliği: yalnız aktif kiracılar, vitrinde görünen alanlar.
create policy storefront_tenant on public.tenant
  for select to anon using (status = 'active');
create policy storefront_branding on public.tenant_branding
  for select to anon using (true);
create policy storefront_domain on public.tenant_domain
  for select to anon using (verified_at is not null);

-- Yayındaki turlar ve alt kayıtları.
create policy storefront_tour on public.tour
  for select to anon using (status = 'aktif' and show_on_website);
create policy storefront_tour_age_tier on public.tour_age_tier
  for select to anon using (public.tour_is_public(tour_id));
create policy storefront_tour_departure on public.tour_departure
  for select to anon using (not stop_sale and public.tour_is_public(tour_id));
create policy storefront_itinerary on public.itinerary_stop
  for select to anon using (public.tour_is_public(tour_id));
create policy storefront_category_link on public.tour_category_link
  for select to anon using (public.tour_is_public(tour_id));
create policy storefront_category on public.tour_category
  for select to anon using (true);
create policy storefront_translation on public.tour_translation
  for select to anon using (public.tour_is_public(tour_id));
create policy storefront_media on public.media_asset
  for select to anon using (tour_id is not null and public.tour_is_public(tour_id));
create policy storefront_policy on public.cancellation_policy
  for select to anon using (exists (
    select 1 from public.tour t
     where t.cancellation_policy_id = cancellation_policy.id
       and t.status = 'aktif' and t.show_on_website));
create policy storefront_cutoff on public.cancellation_cutoff
  for select to anon using (exists (
    select 1 from public.tour t
     where t.cancellation_policy_id = cancellation_cutoff.policy_id
       and t.status = 'aktif' and t.show_on_website));
create policy storefront_meeting_point on public.location_point
  for select to anon using (kind = 'meeting' and exists (
    select 1 from public.tour t
     where t.meeting_point_id = location_point.id
       and t.status = 'aktif' and t.show_on_website));
