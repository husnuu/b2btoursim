import "server-only";

import { createStorefrontClient } from "./tenant";

/**
 * "BUGÜNÜN KALKIŞLARI" — vitrin ana sayfasının koyu bandı.
 *
 * `toResult()`'taki "sıradaki kalkış" mantığından bilerek farklı: burada
 * BUGÜNÜN tüm program tablosu gösterilir, geçmiş saatler de dahil
 * ("KALKTI" olarak) — tur operatörü sitelerinde alışılmış, günün akışını
 * anlatan bir pano. Saat dilimi sabit: Türkiye DST kullanmıyor, UTC+3.
 */
export type DepartureRow = {
  id: string;
  tourId: string;
  tourSlug: string;
  title: string;
  startsAt: string;
  remaining: number;
  status: "kalkti" | "sonKoltuklar" | "musait";
};

export type TodayBoard = {
  rows: DepartureRow[];
  /** Yarının en erken, kontenjanı açık kalkışı — kapanış çağrısı için. */
  tomorrowNext: { title: string; tourSlug: string; startsAt: string; remaining: number } | null;
};

const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3, DST yok.

function istanbulDayRangeUtc(dayOffset: number): { startUtc: string; endUtc: string } {
  const now = new Date();
  const ist = new Date(now.getTime() + ISTANBUL_OFFSET_MS);
  const y = ist.getUTCFullYear(), m = ist.getUTCMonth(), d = ist.getUTCDate() + dayOffset;
  const startUtcMs = Date.UTC(y, m, d, 0, 0, 0) - ISTANBUL_OFFSET_MS;
  return { startUtc: new Date(startUtcMs).toISOString(), endUtc: new Date(startUtcMs + 24 * 60 * 60 * 1000).toISOString() };
}

export async function getTodayBoard(tenantId: string): Promise<TodayBoard> {
  const db = createStorefrontClient();
  const today = istanbulDayRangeUtc(0);
  const tomorrow = istanbulDayRangeUtc(1);
  const nowIso = new Date().toISOString();

  const [todayRes, tomorrowRes] = await Promise.all([
    db
      .from("tour_departure")
      .select("id, starts_at, capacity, booked_count, stop_sale, tour:tour!inner(id, slug, title, tenant_id, status, show_on_website)")
      .eq("tour.tenant_id", tenantId)
      .eq("tour.status", "aktif")
      .eq("tour.show_on_website", true)
      .gte("starts_at", today.startUtc)
      .lt("starts_at", today.endUtc)
      .eq("stop_sale", false)
      .order("starts_at", { ascending: true })
      .limit(8),
    db
      .from("tour_departure")
      .select("starts_at, capacity, booked_count, tour:tour!inner(slug, title, tenant_id, status, show_on_website)")
      .eq("tour.tenant_id", tenantId)
      .eq("tour.status", "aktif")
      .eq("tour.show_on_website", true)
      .gte("starts_at", tomorrow.startUtc)
      .lt("starts_at", tomorrow.endUtc)
      .eq("stop_sale", false)
      .order("starts_at", { ascending: true })
      .limit(1),
  ]);

  type Row = { id: string; starts_at: string; capacity: number; booked_count: number; stop_sale: boolean; tour: { id: string; slug: string; title: string } | { id: string; slug: string; title: string }[] };
  const one = <T,>(x: T | T[]): T => (Array.isArray(x) ? x[0] : x);

  const rows: DepartureRow[] = ((todayRes.data ?? []) as unknown as Row[]).map((r) => {
    const tour = one(r.tour);
    const remaining = Math.max(0, r.capacity - r.booked_count);
    const status: DepartureRow["status"] = r.starts_at < nowIso ? "kalkti" : remaining <= 6 ? "sonKoltuklar" : "musait";
    return { id: r.id, tourId: tour.id, tourSlug: tour.slug, title: tour.title, startsAt: r.starts_at, remaining, status };
  });

  type TRow = { starts_at: string; capacity: number; booked_count: number; tour: { slug: string; title: string } | { slug: string; title: string }[] };
  const tRow = (tomorrowRes.data as unknown as TRow[] | null)?.[0];
  const tomorrowNext = tRow
    ? { title: one(tRow.tour).title, tourSlug: one(tRow.tour).slug, startsAt: tRow.starts_at, remaining: Math.max(0, tRow.capacity - tRow.booked_count) }
    : null;

  return { rows, tomorrowNext };
}
