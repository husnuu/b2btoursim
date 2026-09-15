-- 0024 — Rezervasyon → cari defter.
--
-- Bakiye tek kaynak defterdir (agency_balance). Onaylanan rezervasyon
-- acentenin carisine BORÇ yazar (satış toplamı: net × (1 + marj)); iptal
-- ya da iade aynı tutarı ALACAK olarak geri çevirir. Kayıt tetikleyicide:
-- uygulama unutamaz, iki yerde iki sonuç çıkmaz.
--
-- Platform para taşımaz: bu defter acentenin kiracıya olan hesabıdır,
-- ödeme kaydı (payment) ayrı satırla düşer.

create or replace function public.booking_ledger_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total bigint;
  v_posted bigint;
begin
  select coalesce(sale_total, 0) into v_total from public.booking_totals bt where bt.booking_id = new.id;
  select coalesce(sum(debit) - sum(credit), 0) into v_posted
    from public.ledger_entry l
   where l.reference_type = 'booking' and l.reference_id = new.id::text;

  if new.status in ('CONFIRMED', 'PARTIALLY_CANCELLED', 'COMPLETED') then
    -- Borç henüz yazılmadıysa yaz (onay bir kez düşer).
    if v_posted = 0 and v_total > 0 then
      insert into public.ledger_entry (tenant_id, agency_id, entry_date, account, description, debit, credit, currency, reference_type, reference_id)
      values (new.tenant_id, new.agency_id, current_date, 'Rezervasyon', 'Rezervasyon ' || new.ref, v_total, 0, new.currency, 'booking', new.id::text);
    end if;
  elsif new.status in ('CANCELLED', 'REFUNDED', 'FAILED') then
    -- Yazılmış borç varsa geri çevir.
    if v_posted > 0 then
      insert into public.ledger_entry (tenant_id, agency_id, entry_date, account, description, debit, credit, currency, reference_type, reference_id)
      values (new.tenant_id, new.agency_id, current_date, 'Rezervasyon', 'İptal ' || new.ref, 0, v_posted, new.currency, 'booking', new.id::text);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists booking_ledger_sync on public.booking;
create trigger booking_ledger_sync
  after insert or update of status on public.booking
  for each row execute function public.booking_ledger_sync();

-- Satırlar başlıktan sonra yazılır: RPC son adımda para birimini günceller,
-- o güncelleme tetikleyiciyi (status değişmeden) tetiklemez. Bu yüzden RPC'nin
-- CONFIRMED açtığı rezervasyon için deftere son bir dokunuş gerekir:
create or replace function public.booking_ledger_touch(p_booking_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.booking set status = status where id = p_booking_id;
$$;
revoke execute on function public.booking_ledger_touch(uuid) from public, anon, authenticated;
grant execute on function public.booking_ledger_touch(uuid) to service_role;
