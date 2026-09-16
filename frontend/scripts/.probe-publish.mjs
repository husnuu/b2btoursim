import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const tourId = "a11ead03-887b-4ecb-8cb8-73de5e859246";
const { data: tour } = await db.from("tour").select("tenant_id").eq("id", tourId).single();
const tenantId = tour.tenant_id;

// meeting point
const { data: mp } = await db.from("location_point").select("id").eq("tenant_id", tenantId).eq("name", "Buluşma Noktası").maybeSingle();
let meetingPointId = mp?.id;
if (!meetingPointId) {
  const { data: newMp, error } = await db.from("location_point").insert({ tenant_id: tenantId, kind: "meeting", name: "Buluşma Noktası", address: "Göreme Meydanı, Nevşehir" }).select("id").single();
  if (error) throw error;
  meetingPointId = newMp.id;
}

// cancellation policy
const { data: existingPolicy } = await db.from("tour").select("cancellation_policy_id").eq("id", tourId).single();
let policyId = existingPolicy?.cancellation_policy_id;
if (!policyId) {
  const { data: pol, error } = await db.from("cancellation_policy").insert({ tenant_id: tenantId, template: "orta", no_show_no_refund: true }).select("id").single();
  if (error) throw error;
  policyId = pol.id;
  await db.from("cancellation_cutoff").insert([
    { tenant_id: tenantId, policy_id: policyId, days_before: 1, refund_pct: 100 },
    { tenant_id: tenantId, policy_id: policyId, days_before: 0, refund_pct: 0 },
  ]);
}

const { error: upErr } = await db.from("tour").update({
  title: "Kapadokya Gün Doğumu Balon Turu",
  slug: "kapadokya-gun-dogumu-balon-turu",
  description: "Güneş doğarken peri bacaları üzerinde 60 dakikalık balon uçuşu. İniş töreni, sertifika ve otel transferi dahil.",
  status: "aktif",
  show_on_website: true,
  includes: ["60 dk balon uçuşu", "Otel transferi (gidiş-dönüş)", "Sertifika ve ikram"],
  excludes: ["Profesyonel fotoğraf paketi", "Bahşişler"],
  cancellation_policy_id: policyId,
  meeting_point_id: meetingPointId,
}).eq("id", tourId);
if (upErr) throw upErr;

await db.from("tour_age_tier").delete().eq("tour_id", tourId);
await db.from("tour_age_tier").insert({ tenant_id: tenantId, tour_id: tourId, key: "adult", enabled: true, min_age: 12, max_age: 99, price: 345000 });

await db.from("itinerary_stop").delete().eq("tour_id", tourId);
await db.from("itinerary_stop").insert([
  { tenant_id: tenantId, tour_id: tourId, position: 1, name: "Otelden alış", duration_minutes: 30, description: "Sürücü isim tabelasıyla resepsiyonda bekler." },
  { tenant_id: tenantId, tour_id: tourId, position: 2, name: "Uçuş", duration_minutes: 60, description: "Gün doğumuyla kalkış; vadiler üzerinde alçak ve yüksek geçişler." },
  { tenant_id: tenantId, tour_id: tourId, position: 3, name: "İniş töreni", duration_minutes: 20, description: "Sertifika, köpüklü içecek, fotoğraf." },
]);

await db.from("tour_departure").delete().eq("tour_id", tourId);
const dep1 = new Date(); dep1.setDate(dep1.getDate() + 3); dep1.setHours(4, 30, 0, 0);
const dep2 = new Date(); dep2.setDate(dep2.getDate() + 5); dep2.setHours(4, 30, 0, 0);
await db.from("tour_departure").insert([
  { tenant_id: tenantId, tour_id: tourId, starts_at: dep1.toISOString(), capacity: 20, booked_count: 15 },
  { tenant_id: tenantId, tour_id: tourId, starts_at: dep2.toISOString(), capacity: 20, booked_count: 2 },
]);

console.log(JSON.stringify({ tenantId, tourId, slug: "kapadokya-gun-dogumu-balon-turu" }));
