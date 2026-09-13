-- =====================================================================
-- 0003 — Modüller arası ortak varlıklar
--
-- Tur, transfer ve tekne modüllerinin spesifikasyonlarında ayrı ayrı
-- geçen "Buluşma Noktası", "Transfer Noktası", "Marina" ve "Kiralama
-- Noktası" alan olarak birebir aynıdır (kodda da aynı tip yeniden
-- kullanılıyor: `TransferPoint = MeetingPoint`, `MarinaPoint = MeetingPoint`).
-- Dört özdeş tablo yerine tek tablo + `kind` ayracı kullanıldı.
-- =====================================================================

create table location_point (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenant(id) on delete cascade,
  kind        location_point_kind not null,
  name        text not null,
  address     text not null default '',
  description text not null default '',
  city        text,
  country     text,
  -- Gerçek geocoding servisi bağlanınca doldurulur; şu an null.
  lat         numeric(9,6),
  lng         numeric(9,6),
  created_at  timestamptz not null default now(),
  constraint location_point_tenant_key unique (tenant_id, id),
  -- `kind` bileşik anahtara dahil: böylece bir marina alanına transfer
  -- noktası, buluşma noktası alanına marina bağlanamaz. Alt tablolar
  -- sabit değerli üretilmiş (generated) bir kind kolonu taşıyıp bu
  -- anahtara bağlanır — kural veritabanında, uygulamada değil.
  constraint location_point_kind_key unique (tenant_id, id, kind)
);
create index location_point_tenant_kind_idx on location_point (tenant_id, kind);

-- Saatlik kiralamada nokta bir rol taşır (alış / bırakış / her ikisi).
-- Bu rol noktanın kendi özelliği değil, kiralama bağlamındaki rolüdür.
create table rental_point (
  point_id   uuid primary key references location_point(id) on delete cascade,
  tenant_id  uuid not null references tenant(id) on delete cascade,
  role       rental_point_role not null,
  point_kind location_point_kind not null generated always as ('rental'::location_point_kind) stored,
  constraint rental_point_point_fk foreign key (tenant_id, point_id, point_kind)
    references location_point (tenant_id, id, kind) on delete cascade
);

-- --- İptal / iade politikası -----------------------------------------
--
-- Tur, tekne, villa ve transfer ayarları aynı politika yapısını kullanır
-- (şablon + zaman dilimli kesinti kademeleri). Tur spesifikasyonu Bölüm 7
-- bunu zaten ayrı bir varlık (CANCELLATION_POLICY) olarak listeliyor.

create table cancellation_policy (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenant(id) on delete cascade,
  template          cancellation_template not null default 'orta',
  custom_text       text not null default '',
  no_show_no_refund boolean not null default true,
  created_at        timestamptz not null default now(),
  constraint cancellation_policy_tenant_key unique (tenant_id, id),
  -- "ozel" şablon serbest metin gerektirir; diğerleri gerektirmez.
  constraint cancellation_policy_custom_text check (
    template <> 'ozel' or length(btrim(custom_text)) > 0
  )
);

create table cancellation_cutoff (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenant(id) on delete cascade,
  policy_id   uuid not null,
  days_before integer not null check (days_before >= 0),
  refund_pct  numeric(6,3) not null check (refund_pct between 0 and 100),
  constraint cancellation_cutoff_policy_fk foreign key (tenant_id, policy_id)
    references cancellation_policy (tenant_id, id) on delete cascade,
  -- Aynı politikada aynı gün eşiği iki kez tanımlanamaz.
  constraint cancellation_cutoff_unique unique (policy_id, days_before)
);
comment on table cancellation_cutoff is
  'Ör. 7 gün öncesine kadar %100, 3 güne kadar %50. Kademeler gün eşiğine göre azalan sırada okunur.';
