-- =====================================================================
-- 0011 — Finans
--
-- İKİ İLKE:
--
-- 1) BAKİYE SAKLANMAZ, TÜRETİLİR. Arayüzdeki `Agency.balance` bir alan
--    gibi görünüyor ama tabloda yok: çift kayıt defterinden (ledger)
--    hesaplanır. Saklanan bakiye ile defter er geç ayrışır ve hangisinin
--    doğru olduğu bilinemez. `agency_balance` görünümü tek doğruyu üretir.
--
-- 2) PLATFORM PARA TAŞIMAZ. Kart verisi sistemimize hiç girmez
--    (`gateway_reference` sağlayıcı token'ıdır, PCI SAQ-A sınırı).
--    Her kiracı kendi üye iş yeri anlaşmasını getirir; POS platformun
--    değildir (1618 sayılı Seyahat Acentaları Kanunu / TÜRSAB).
-- =====================================================================

create table payment (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenant(id) on delete cascade,
  booking_id        uuid,
  amount            bigint not null check (amount <> 0),
  currency          char(3) not null references currency(code),
  method            payment_method not null,
  status            payment_status not null default 'pending',
  -- Sağlayıcının verdiği referans/token. KART NUMARASI, CVV, son kullanma
  -- tarihi HİÇBİR ZAMAN saklanmaz — bu tabloda böyle bir kolon yok ve
  -- eklenmemelidir.
  gateway_reference text,
  paid_at           timestamptz,
  created_at        timestamptz not null default now(),
  constraint payment_tenant_key unique (tenant_id, id),
  constraint payment_booking_fk foreign key (tenant_id, booking_id)
    references booking (tenant_id, id) on delete restrict,
  constraint payment_succeeded_at check (status <> 'succeeded' or paid_at is not null)
);
create index payment_booking_idx on payment (booking_id);
create index payment_status_idx on payment (tenant_id, status, created_at desc);

create table invoice (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenant(id) on delete cascade,
  agency_id     uuid not null,
  number        text not null,
  period_start  date not null,
  period_end    date not null,
  amount        bigint not null check (amount >= 0),
  tax_amount    bigint not null default 0 check (tax_amount >= 0),
  currency      char(3) not null references currency(code),
  status        invoice_status not null default 'draft',
  due_date      date not null,
  -- GİB e-fatura/e-arşiv referansı; belge platformda üretilmez.
  e_invoice_ref text,
  created_at    timestamptz not null default now(),
  constraint invoice_tenant_key unique (tenant_id, id),
  constraint invoice_number_unique unique (tenant_id, number),
  constraint invoice_agency_fk foreign key (tenant_id, agency_id)
    references agency (tenant_id, id) on delete restrict,
  constraint invoice_period check (period_end >= period_start)
);
create index invoice_agency_idx on invoice (agency_id, status);

-- Çift kayıt defteri. Her satır bir hesabın borç ya da alacağıdır;
-- `running_balance` SAKLANMAZ (görünümde pencere fonksiyonuyla üretilir),
-- çünkü araya geçmiş tarihli bir kayıt girdiğinde saklanan değer yanlış olur.
create table ledger_entry (
  id             bigint generated always as identity primary key,
  tenant_id      uuid not null references tenant(id) on delete cascade,
  agency_id      uuid not null,
  entry_date     date not null default current_date,
  account        text not null,
  description    text not null default '',
  debit          bigint not null default 0 check (debit >= 0),
  credit         bigint not null default 0 check (credit >= 0),
  currency       char(3) not null references currency(code),
  reference_type ledger_reference_type not null,
  reference_id   text not null,
  created_at     timestamptz not null default now(),
  constraint ledger_entry_agency_fk foreign key (tenant_id, agency_id)
    references agency (tenant_id, id) on delete restrict,
  -- Bir satır ya borç ya alacaktır, ikisi birden değil.
  constraint ledger_entry_side check ((debit = 0) <> (credit = 0))
);
create index ledger_entry_agency_date_idx on ledger_entry (agency_id, entry_date, id);
create index ledger_entry_reference_idx on ledger_entry (reference_type, reference_id);

create table commission_rule (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenant(id) on delete cascade,
  agency_id  uuid not null,
  rule_type  commission_rule_type not null,
  value      numeric(14,3) not null,          -- yüzde ya da sabit tutar (minor unit)
  currency   char(3) references currency(code),
  valid_from date not null,
  valid_to   date,
  constraint commission_rule_agency_fk foreign key (tenant_id, agency_id)
    references agency (tenant_id, id) on delete cascade,
  constraint commission_rule_period check (valid_to is null or valid_to > valid_from),
  -- Sabit tutarlı kuralda para birimi zorunlu, yüzdede anlamsız.
  constraint commission_rule_currency check (
    (rule_type = 'fixed' and currency is not null) or
    (rule_type <> 'fixed' and currency is null)
  )
);
-- Aynı acente için tarih aralıkları çakışamaz: iki komisyon oranı aynı
-- güne denk gelirse hangisinin geçerli olduğu belirsizleşir.
alter table commission_rule add constraint commission_rule_no_overlap
  exclude using gist (
    agency_id with =,
    daterange(valid_from, coalesce(valid_to, 'infinity'::date), '[)') with &&
  );

-- =====================================================================
-- Türetilmiş görünümler
-- =====================================================================

-- Acentenin cari durumu. `available` = limit + defter bakiyesi.
create view agency_balance as
select
  a.id            as agency_id,
  a.tenant_id,
  a.currency,
  a.credit_limit,
  coalesce(sum(l.credit - l.debit), 0)                  as balance,
  a.credit_limit + coalesce(sum(l.credit - l.debit), 0) as available
from agency a
left join ledger_entry l on l.agency_id = a.id
group by a.id, a.tenant_id, a.currency, a.credit_limit;

comment on view agency_balance is
  'Bakiye tek kaynak: defter. Arayüzdeki "kullanılabilir bakiye" göstergesi buradan okur.';

-- Ekstre: yürüyen bakiye pencere fonksiyonuyla ANLIK hesaplanır.
create view agency_statement as
select
  l.*,
  sum(l.credit - l.debit) over (
    partition by l.agency_id order by l.entry_date, l.id
  ) as running_balance
from ledger_entry l;

-- Rezervasyon toplamları. Satış fiyatı formülü tek yerde:
-- round(net * (1 + marj/100)) — frontend'deki salePrice() ile aynı.
create view booking_totals as
select
  b.id as booking_id,
  b.tenant_id,
  b.agency_id,
  b.currency,
  sum(i.unit_net_price * i.quantity)                                    as net_total,
  sum(round(i.unit_net_price * (1 + i.margin_pct / 100)) * i.quantity)  as sale_total,
  sum(round(i.unit_net_price * (1 + i.margin_pct / 100)) * i.quantity)
    - sum(i.unit_net_price * i.quantity)                                as margin_total,
  sum(i.quantity)                                                       as total_quantity
from booking b
join booking_item i on i.booking_id = b.id
group by b.id, b.tenant_id, b.agency_id, b.currency;

-- Pazaryeri hakediş/mutabakat. PLATFORM BU PARAYI TAHSİL ETMEZ:
-- bu görünüm yalnızca "satıcı tedarikçiye ne ödemeli" sorusunu
-- cevaplar. Taraflar ödemeyi aralarında yapar, bu tablo mutabakat
-- belgesidir.
create view marketplace_settlement as
select
  b.id                        as booking_id,
  b.ref,
  b.created_at,
  c.id                        as contract_id,
  c.supplier_agency_id,
  c.seller_agency_id,
  b.currency,
  t.sale_total,
  r.model                     as pricing_model,
  case r.model
    when 'netFiyat' then r.net_amount * t.total_quantity
    when 'komisyon' then round(t.sale_total * (1 - r.commission_pct / 100))
  end                         as supplier_payout,
  case r.model
    when 'netFiyat' then t.sale_total - (r.net_amount * t.total_quantity)
    when 'komisyon' then t.sale_total - round(t.sale_total * (1 - r.commission_pct / 100))
  end                         as seller_earning
from booking b
join marketplace_contract c        on c.id = b.contract_id
join marketplace_pricing_rule r    on r.id = b.applied_pricing_rule_id
join booking_totals t              on t.booking_id = b.id
where b.source_channel = 'pazaryeri'
  and b.status in ('CONFIRMED','COMPLETED');
