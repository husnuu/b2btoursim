-- =====================================================================
-- 0008 — Görsel / video varlıkları
--
-- Dört modülün de fotoğraf galerisi ve tek bir kapak görseli var.
-- Dört ayrı tablo yerine tek tablo + tipli sahiplik kolonları.
--
-- KAPAK GÖRSELİ: ürün tablosunda `cover_media_id` YOK. Olsaydı ürün ile
-- medya arasında karşılıklı yabancı anahtar (döngü) oluşurdu; silme
-- sırası çözümsüz hale gelirdi. Bunun yerine kapak, medyanın kendi
-- niteliğidir ve kısmi tekil indeks sahip başına en fazla bir kapak
-- olmasını garanti eder.
--
-- Dosyanın kendisi burada değil: `storage_path` Supabase Storage yolunu
-- gösterir. `tone` prototipte gerçek görsel yerine kullanılan
-- deterministik renk tonudur; gerçek yükleme geldiğinde null kalır.
-- =====================================================================

create table media_asset (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenant(id) on delete cascade,
  kind         media_kind not null default 'image',
  storage_path text,
  external_url text,
  alt          text not null default '',
  tone         text,
  position     integer not null default 1 check (position > 0),
  is_cover     boolean not null default false,
  created_at   timestamptz not null default now(),

  -- Tipli sahiplik: tam olarak biri dolu.
  tour_id      uuid,
  vehicle_id   uuid,
  boat_id      uuid,
  villa_id     uuid,

  constraint media_asset_tour_fk foreign key (tenant_id, tour_id)
    references tour (tenant_id, id) on delete cascade,
  constraint media_asset_vehicle_fk foreign key (tenant_id, vehicle_id)
    references vehicle (tenant_id, id) on delete cascade,
  constraint media_asset_boat_fk foreign key (tenant_id, boat_id)
    references boat (tenant_id, id) on delete cascade,
  constraint media_asset_villa_fk foreign key (tenant_id, villa_id)
    references villa (tenant_id, id) on delete cascade,
  constraint media_asset_single_owner check (
    num_nonnulls(tour_id, vehicle_id, boat_id, villa_id) = 1
  ),
  -- Görsel ya depoda ya dış bağlantıdadır; ikisi birden ya da hiçbiri olmaz.
  constraint media_asset_source check (
    num_nonnulls(storage_path, external_url) = 1 or tone is not null
  )
);

create unique index media_asset_tour_cover   on media_asset (tour_id)    where is_cover and tour_id    is not null;
create unique index media_asset_vehicle_cover on media_asset (vehicle_id) where is_cover and vehicle_id is not null;
create unique index media_asset_boat_cover   on media_asset (boat_id)    where is_cover and boat_id    is not null;
create unique index media_asset_villa_cover  on media_asset (villa_id)   where is_cover and villa_id   is not null;

create index media_asset_tour_idx    on media_asset (tour_id, position)    where tour_id    is not null;
create index media_asset_vehicle_idx on media_asset (vehicle_id, position) where vehicle_id is not null;
create index media_asset_boat_idx    on media_asset (boat_id, position)    where boat_id    is not null;
create index media_asset_villa_idx   on media_asset (villa_id, position)   where villa_id   is not null;
