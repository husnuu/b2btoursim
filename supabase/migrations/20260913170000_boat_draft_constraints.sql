-- =====================================================================
-- 0021 — Tekne kısıtları yalnız YAYINDA zorunlu
--
-- Taslak (fiyatı henüz girilmemiş tekne) tabloya yazılabilmeli; turdaki
-- tour_publishable ile aynı ilke: yayına alınan satır eksiksiz olmalı,
-- taslak olmayabilir.
-- =====================================================================

alter table boat drop constraint boat_pricing_hourly;
alter table boat drop constraint boat_pricing_multiday;
alter table boat drop constraint boat_pricing_per_person;
alter table boat drop constraint boat_captain_fee;

alter table boat add constraint boat_pricing_hourly check (
  status <> 'aktif' or pricing_model <> 'saatlik' or hourly_rate is not null);
alter table boat add constraint boat_pricing_multiday check (
  status <> 'aktif' or pricing_model <> 'cokGunlu' or
  num_nulls(multiday_unit, multiday_unit_price, multiday_min_units, multiday_max_units) = 0);
alter table boat add constraint boat_pricing_per_person check (
  status <> 'aktif' or pricing_model <> 'kisiBasi' or
  num_nulls(per_person_price, per_person_min_group) = 0);
alter table boat add constraint boat_captain_fee check (
  status <> 'aktif' or captain_option = 'kaptansiz' or captain_fee is not null);
alter table boat add constraint boat_publishable check (
  status <> 'aktif' or (length(btrim(title)) > 0 and length(btrim(slug)) > 0));
