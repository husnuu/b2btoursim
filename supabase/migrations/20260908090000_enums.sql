-- =====================================================================
-- 0001 — Sözlük tipleri (enum)
--
-- Değerler frontend'deki TypeScript birlik tipleriyle BİREBİR aynı
-- yazılmıştır (Türkçe değerler dahil). Amaç: API katmanında değer
-- çevirisi yapan bir sözlük olmasın. Tek istisna BOOKING.status —
-- TDD Bölüm 3 UPPER_SNAKE dayatıyor, `booking-status.ts` içindeki
-- `apiValue` alanı da zaten bu değeri taşıyor.
-- =====================================================================

-- Tarih aralığı çakışma kısıtları (EXCLUDE ... USING gist) için gerekli.
create extension if not exists btree_gist with schema extensions;

-- --- Kiracı, kullanıcı, acente ---------------------------------------
create type tenant_status          as enum ('trial','active','suspended','closed');
create type user_role              as enum ('platform_admin','agency_admin','sales','accounting');
create type user_status            as enum ('active','invited','disabled');
create type agency_type            as enum ('master','sub_agency');

-- --- Tedarikçi ve dış katalog ----------------------------------------
create type adapter_type           as enum ('gds','ndc','bedbank','own_contracted','payment','tax','marketplace');
create type supplier_status        as enum ('sandbox','active','degraded','disabled');
create type product_type           as enum ('hotel','tour','transfer','flight','package');
create type board_type             as enum ('room_only','breakfast','half_board','all_inclusive');
create type cancellation_type      as enum ('free','nonRefundable');

-- --- Rezervasyon ve finans -------------------------------------------
create type booking_status         as enum ('DRAFT','PENDING','CONFIRMED','PARTIALLY_CANCELLED','CANCELLED','REFUNDED','FAILED','COMPLETED');
create type booking_item_kind      as enum ('supplier_product','tour','transfer','boat','villa','visa');
create type source_channel         as enum ('direkt','pazaryeri');
create type payment_method         as enum ('card','bank_transfer','vcc','agency_credit');
create type payment_status         as enum ('pending','succeeded','failed','refunded');
create type invoice_status         as enum ('draft','sent','paid','overdue');
create type ledger_reference_type  as enum ('booking','payment','invoice','adjustment');
create type commission_rule_type   as enum ('percentage','fixed','tiered');

-- --- Kendi envanteri: ortak ------------------------------------------
create type content_status         as enum ('taslak','aktif','pasif','arsivlendi');
create type cancellation_template  as enum ('esnek','orta','kati','ozel');
create type payment_mode           as enum ('anindaTamOdeme','kaporaBakiye','sadeceRezervasyon','cariHesap','yerindeOdeme','havaleEft');
create type charge_type            as enum ('perPerson','perBooking');
create type sell_phase             as enum ('duringBooking','afterBooking');
create type form_field_type        as enum ('text','date','file','select');
create type customer_field_scope   as enum ('bookingOwner','eachParticipant');
create type location_point_kind    as enum ('meeting','transfer','marina','rental');
create type media_kind             as enum ('image','video');
create type distance_unit          as enum ('m','km');
create type duration_unit          as enum ('dakika','saat');
create type operation_status       as enum ('planlamaBekliyor','aktifTransfer','tamamlandi');

-- --- Tur --------------------------------------------------------------
create type tour_kind              as enum ('gunubirlik','cokGunlu','ozel','konaklamali');
create type program_type           as enum ('tur','aktivite','transfer','bilet');
create type difficulty             as enum ('kolay','orta','zor','uzman');
create type tour_pricing_model     as enum ('kisiBasi','grupBazli','konaklamaBazli');
create type age_tier_key           as enum ('adult','child','infant');
create type date_discount_type     as enum ('earlyBird','lastMinute');

-- --- Transfer ---------------------------------------------------------
create type vehicle_pricing_model  as enum ('rotaBazli','saatlikKiralama');
create type vehicle_type           as enum ('private','shuttle');
create type transfer_booking_model as enum ('nokta','harita','saatlik');
create type booking_approval_mode  as enum ('otomatik','manuel');
create type route_scope            as enum ('point','zone');
create type rental_point_role      as enum ('pickup','dropoff','both');

-- --- Tekne ------------------------------------------------------------
create type boat_pricing_model     as enum ('saatlik','cokGunlu','kisiBasi');
create type captain_option         as enum ('kaptanli','kaptansiz','herIkisi');
create type captain_fee_unit       as enum ('saatlik','gunluk');
create type captain_payment_method as enum ('limandaNakit','platform');
create type multiday_unit          as enum ('gece','gun');
create type deposit_block_timing   as enum ('onayAninda','checkinde');
create type deposit_refund_timing  as enum ('checkoutSonrasi','hasarDegerlendirmesiSonrasi');
create type security_deposit_status as enum ('bloke','iadeEdildi','kesintiYapildi');

-- --- Villa ------------------------------------------------------------
create type villa_booking_method   as enum ('talepTopla','onlineOdemeIleAl','belirliOranOdeme','belirliOranOdemeYuvarla');

-- --- Vize -------------------------------------------------------------
create type visa_application_status as enum ('yeni','inceleniyor','belgeBekleniyor','konsoloslugaIletildi','tamamlandi','reddedildi');

-- --- Pazaryeri --------------------------------------------------------
create type marketplace_pricing_model as enum ('komisyon','netFiyat');
create type listing_kind           as enum ('tur','arac');
create type contract_status        as enum ('beklemede','onaylandi','reddedildi','sonlandirildi');
