-- =====================================================================
-- 0012 — Varsayılan reddet (RLS)
--
-- Bu aşamada politika YAZILMIYOR: JWT talep yapısı (tenant_id, agency_id,
-- role, scopes) uygulama bağlanırken kesinleşecek. Ama tablolar
-- politikasız ve RLS'siz bırakılırsa, PostgREST üzerinden anon anahtarla
-- okunabilir hale gelirler.
--
-- Bu yüzden: her tabloda RLS AÇIK, politika YOK → hiç kimse (service_role
-- hariç) hiçbir satırı göremez. Güvenlik tarayıcısı bunu
-- "RLS Enabled No Policy" olarak bildirecek; şu an DOĞRU durum budur.
-- Politikalar bağlama aşamasında eklenecek.
--
-- Pazaryeri tabloları hatırlatma: oradaki politika "tenant_id = benim
-- kiracım" olamaz; iki taraflıdır (supplier_agency_id ya da
-- seller_agency_id benim acentem).
-- =====================================================================

do $$
declare t record;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('alter table public.%I force row level security', t.tablename);
  end loop;
end $$;

-- Görünümler sorgulayan kullanıcının haklarıyla çalışsın (görünümün
-- sahibi değil): altındaki tabloların RLS'i böylece atlanmaz.
alter view agency_balance          set (security_invoker = on);
alter view agency_statement        set (security_invoker = on);
alter view booking_totals          set (security_invoker = on);
alter view marketplace_settlement  set (security_invoker = on);

-- API rollerine tablo düzeyinde varsayılan yetki verilmiyor.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
