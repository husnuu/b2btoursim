/**
 * `seed-demo.mjs` üstüne ikinci katman: ek villalar, otel kataloğu
 * (tedarikçi + ürün + oda varyantları + envanter + marj kuralı), müşteriler
 * ve her türden rezervasyon (durum geçmişi, modül detayları, tahsilat),
 * alt acenteler ve komisyon kuralı, popüler transfer rotaları, bölge
 * fiyatları ve transfer ayarları, tur ekstraları ve müşteri bilgi alanları,
 * vize başvuru formu ve başvurular, pazaryeri profili ve listelemeleri,
 * marka rengi, tedarikçi sağlık kaydı.
 *
 * Önce `node scripts/seed-demo.mjs <slug>` çalıştırılmış olmalı.
 * Kullanım:  node scripts/seed-demo-more.mjs <tenant-slug>
 * Tekrar çalıştırılabilir: "demo" etiketli kayıtlar silinip yeniden yazılır.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const i = line.indexOf("=");
    if (i > 0 && !line.startsWith("#")) process.env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const slug = process.argv[2];
if (!url || !secret || !slug) {
  console.error("Kullanım: node scripts/seed-demo-more.mjs <tenant-slug>");
  process.exit(1);
}
const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const must = (r, what) => {
  if (r.error) {
    console.error(`${what}: ${r.error.message}`);
    process.exit(1);
  }
  return r.data;
};
const warn = (r, what) => r.error && console.warn(`${what}: ${r.error.message}`);

const tenant = must(await db.from("tenant").select("id, name, default_currency").eq("slug", slug).single(), "tenant");
const T = tenant.id;
const master = must(await db.from("agency").select("id, name").eq("tenant_id", T).eq("type", "master").limit(1).single(), "agency");
const A = master.id;
const CUR = tenant.default_currency || "TRY";
const BUCKET = "media";
const img = (f) => `${BUCKET}/${slug}/${f.replace("/", "-")}`;
const day = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const at = (n, h) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  d.setUTCHours(h - 3, 0, 0, 0);
  return d.toISOString();
};
console.log(`Kiracı: ${tenant.name}`);

/* --- Temizlik ------------------------------------------------------------- */
const oldBookings = must(await db.from("booking").select("id").eq("tenant_id", T).like("ref", "HT-DEMO-%"), "eski rezervasyon");
if (oldBookings.length) {
  const ids = oldBookings.map((b) => b.id);
  warn(await db.from("ledger_entry").delete().eq("tenant_id", T).in("reference_id", ids), "ledger temizlik");
  warn(await db.from("payment").delete().eq("tenant_id", T).in("booking_id", ids), "payment temizlik");
  must(await db.from("booking").delete().eq("tenant_id", T).in("id", ids), "booking temizlik");
}
warn(await db.from("customer").delete().eq("tenant_id", T).like("email", "%@demo.ornek"), "customer temizlik");
warn(await db.from("supplier").delete().eq("tenant_id", T).eq("code", "OT"), "supplier temizlik");
warn(await db.from("invoice").delete().eq("tenant_id", T).like("number", "DEMO-%"), "invoice temizlik");
warn(await db.from("ledger_entry").delete().eq("tenant_id", T).in("reference_type", ["adjustment", "payment"]).like("reference_id", "demo-%"), "ledger adj temizlik");
warn(await db.from("commission_rule").delete().eq("tenant_id", T), "commission temizlik");
warn(await db.from("agency").delete().eq("tenant_id", T).eq("type", "sub_agency").like("name", "Demo %"), "sub agency temizlik");
warn(await db.from("popular_route").delete().eq("tenant_id", T).like("slug", "demo-%"), "route temizlik");
warn(await db.from("map_zone").delete().eq("tenant_id", T), "zone temizlik");
warn(await db.from("tour_extra").delete().eq("tenant_id", T).like("name", "Demo %"), "extra temizlik");
warn(await db.from("visa_form").delete().eq("tenant_id", T).like("name", "Demo %"), "visa form temizlik");
warn(await db.from("visa_application").delete().eq("tenant_id", T).like("form_name_snapshot", "Demo %"), "visa app temizlik");
warn(await db.from("marketplace_listing").delete().eq("supplier_tenant_id", T), "listing temizlik");
warn(await db.from("villa").delete().eq("tenant_id", T).like("slug", "demo2-%"), "villa temizlik");

/* --- Referanslar (ilk script'ten) ---------------------------------------- */
const pick = async (tb, col, val, sel = "id") => (await db.from(tb).select(sel).eq("tenant_id", T).eq(col, val).limit(1).maybeSingle()).data;
const policyOrta = (await db.from("cancellation_policy").select("id").eq("tenant_id", T).eq("template", "orta").limit(1).maybeSingle()).data?.id ?? null;
const tours = must(await db.from("tour").select("id, slug, title, tour_departure(id, starts_at)").eq("tenant_id", T).like("slug", "demo-%").eq("status", "aktif"), "turlar");
const boats = must(await db.from("boat").select("id, slug, title, captain_option, security_deposit").eq("tenant_id", T).like("slug", "demo-%"), "tekneler");
const vehicles = must(await db.from("vehicle").select("id, title, vehicle_type").eq("tenant_id", T).like("description", "[demo]%"), "araçlar");
const visas = must(await db.from("visa_product").select("id, title, price").eq("tenant_id", T).like("description", "[demo]%"), "vizeler");
const points = must(await db.from("location_point").select("id, name, kind").eq("tenant_id", T).eq("kind", "transfer"), "transfer noktaları");
const P = Object.fromEntries(points.map((p) => [p.name, p.id]));
if (!tours.length) {
  console.error("Önce seed-demo.mjs çalıştırın.");
  process.exit(1);
}

/* --- Ek villalar ------------------------------------------------------------ */
const feat = async (name) => (await pick("villa_feature", "name", name))?.id ?? (await db.from("villa_feature").insert({ tenant_id: T, name }).select("id").single()).data.id;
const region = async (name) => (await pick("villa_region", "name", name))?.id ?? (await db.from("villa_region").insert({ tenant_id: T, name }).select("id").single()).data.id;
const vcat = async (title) => (await pick("villa_category", "title", title))?.id ?? (await db.from("villa_category").insert({ tenant_id: T, title }).select("id").single()).data.id;
const VF = { havuz: await feat("Özel havuz"), deniz: await feat("Deniz manzarası"), klima: await feat("Klima"), wifi: await feat("Wi-Fi"), barbeku: await feat("Barbekü"), sauna: await feat("Sauna"), muhafazakar: await feat("Muhafazakâr (kapalı havuz)"), cocuk: await feat("Çocuk havuzu") };
const MORE_VILLAS = [
  { slug: "demo2-villa-fethiye-koy", title: "Villa Likya — Fethiye Kayaköy, muhafazakâr", category: await vcat("Muhafazakâr villa"), region: await region("Fethiye"), province: "Muğla", district: "Fethiye", capacity: 6, nightly: 720000, min: 3, pets: false,
    description: "Kayaköy'de taş duvarlarla çevrili, dışarıdan görünmeyen kapalı havuzlu üç yatak odalı villa. Ölüdeniz'e 15 dakika.", features: [VF.havuz, VF.muhafazakar, VF.klima, VF.wifi, VF.barbeku], poi: [["Ölüdeniz", 9, "km"], ["Fethiye merkez", 8, "km"], ["Dalaman Havalimanı", 55, "km"]], images: ["v/oludeniz-2.jpg", "otel.jpg", "v/oludeniz.jpg"] },
  { slug: "demo2-villa-antalya-kas", title: "Villa Kaş Manzara — Kaş, deniz manzaralı", category: await vcat("Lüks villa"), region: await region("Kaş"), province: "Antalya", district: "Kaş", capacity: 8, nightly: 980000, min: 4, pets: true,
    description: "Kaş Çukurbağ Yarımadası'nda, Meis adasına bakan dört yatak odalı sonsuzluk havuzlu villa. Özel iskeleye yürüme mesafesi.", features: [VF.havuz, VF.deniz, VF.klima, VF.wifi, VF.sauna], poi: [["Kaş merkez", 3, "km"], ["Kaputaş Plajı", 20, "km"], ["Dalaman Havalimanı", 150, "km"]], images: ["v/antalya-2.jpg", "v/antalya.jpg", "otel.jpg"] },
  { slug: "demo2-villa-cesme-aile", title: "Villa Ilıca — Çeşme, çocuk havuzlu aile villası", category: await vcat("Aile villası"), region: await region("Çeşme"), province: "İzmir", district: "Çeşme", capacity: 10, nightly: 690000, min: 3, pets: false,
    description: "Ilıca plajına beş dakika, bahçeli ve çocuk havuzlu beş yatak odalı villa. Alaçatı'ya 10 dakika.", features: [VF.havuz, VF.cocuk, VF.klima, VF.wifi, VF.barbeku], poi: [["Ilıca Plajı", 1.2, "km"], ["Alaçatı", 7, "km"], ["İzmir Havalimanı", 80, "km"]], images: ["v/alacati.jpg", "otel.jpg", "v/alacati-2.jpg"] },
];
const villaIds = [];
for (const v of MORE_VILLAS) {
  const villa = must(await db.from("villa").insert({
    tenant_id: T, agency_id: A, status: "aktif", title: v.title, slug: v.slug, description: v.description, category_id: v.category, tourism_license_no: "TR-2024-" + v.slug.slice(-4).toUpperCase(),
    price_currency: CUR, nightly_rate: v.nightly, province: v.province, district: v.district, address_detail: `${v.district}, ${v.province}`, capacity: v.capacity, pets_allowed: v.pets, min_nights: v.min, cancellation_policy_id: policyOrta,
    collect_estimated_arrival: true, collect_guest_breakdown: true, collect_special_requests: true,
  }).select("id").single(), `villa ${v.slug}`);
  villaIds.push(villa.id);
  must(await db.from("villa_region_link").insert({ tenant_id: T, villa_id: villa.id, region_id: v.region }), "villa bölge");
  must(await db.from("villa_feature_link").insert(v.features.map((f) => ({ tenant_id: T, villa_id: villa.id, feature_id: f }))), "villa özellik");
  must(await db.from("villa_poi_distance").insert(v.poi.map(([label, distance, unit]) => ({ tenant_id: T, villa_id: villa.id, label, distance, unit }))), "villa poi");
  must(await db.from("villa_booking_method_option").insert([{ tenant_id: T, villa_id: villa.id, method: "talepTopla" }, { tenant_id: T, villa_id: villa.id, method: "belirliOranOdeme" }]), "villa yöntem");
  must(await db.from("media_asset").insert(v.images.map((f, i) => ({ tenant_id: T, villa_id: villa.id, kind: "image", storage_path: img(f), alt: v.title, position: i + 1, is_cover: i === 0 }))), "villa görsel");
}
const allVillas = must(await db.from("villa").select("id, slug, title, nightly_rate, capacity").eq("tenant_id", T).like("slug", "demo%"), "villalar");
console.log(`Villalar: +${MORE_VILLAS.length} (toplam ${allVillas.length})`);

/* --- Otel kataloğu --------------------------------------------------------- */
const supplier = must(await db.from("supplier").insert({ tenant_id: T, name: "Otel Anlaşmaları", code: "OT", adapter_type: "own_contracted", status: "active", credentials_ref: "vault://otel-anlasmalari" }).select("id").single(), "supplier");
must(await db.from("supplier_health_snapshot").insert({ tenant_id: T, supplier_id: supplier.id, window_start: at(-1, 0), window_end: at(0, 0), uptime_pct: 99.8, avg_latency_ms: 420, error_rate_pct: 0.4 }), "supplier health");
must(await db.from("margin_rule").insert({ tenant_id: T, supplier_id: supplier.id, product_type: "hotel", default_margin_pct: 15 }), "margin rule");
const HOTELS = [
  { ref: "HTL-GOREME-01", title: "Göreme Kaya Otel", summary: "Peribacalarının içine oyulmuş 18 odalı butik mağara otel; teraslardan balon izleme.", destination: "Kapadokya", stars: 4, address: "Göreme, Nevşehir", rating: 4.8, reviews: 1240, rooms: [["Standart mağara oda", 420000, "breakfast"], ["Deluxe mağara oda, teraslı", 640000, "breakfast"], ["Süit, jakuzili", 910000, "half_board"]] },
  { ref: "HTL-ALACATI-01", title: "Alaçatı Taş Konak", summary: "Çarşıya iki sokak, avlulu ve havuzlu 12 odalı taş konak.", destination: "Çeşme", stars: 4, address: "Alaçatı, Çeşme / İzmir", rating: 4.7, reviews: 860, rooms: [["Standart oda", 380000, "breakfast"], ["Bahçe manzaralı oda", 470000, "breakfast"]] },
  { ref: "HTL-BODRUM-01", title: "Bodrum Yalıkavak Resort", summary: "Özel plajlı, her şey dahil 180 odalı tatil köyü; çocuk kulübü ve 3 havuz.", destination: "Bodrum", stars: 5, address: "Yalıkavak, Bodrum / Muğla", rating: 4.5, reviews: 3120, rooms: [["Standart oda, her şey dahil", 820000, "all_inclusive"], ["Deniz manzaralı oda, her şey dahil", 1050000, "all_inclusive"], ["Aile odası, her şey dahil", 1380000, "all_inclusive"]] },
  { ref: "HTL-IST-01", title: "Sultanahmet Konağı", summary: "Ayasofya'ya yürüme mesafesinde restore edilmiş Osmanlı konağı; çatı terasında kahvaltı.", destination: "İstanbul", stars: 4, address: "Sultanahmet, Fatih / İstanbul", rating: 4.6, reviews: 2210, rooms: [["Standart oda", 350000, "breakfast"], ["Deniz manzaralı oda", 520000, "breakfast"]] },
  { ref: "HTL-FETHIYE-01", title: "Ölüdeniz Lagün Otel", summary: "Belcekız plajına 300 m, 40 odalı havuzlu otel; yamaç paraşütü inişi manzaralı.", destination: "Fethiye", stars: 3, address: "Ölüdeniz, Fethiye / Muğla", rating: 4.3, reviews: 980, rooms: [["Standart oda", 290000, "breakfast"], ["Havuz manzaralı oda", 360000, "half_board"]] },
  { ref: "HTL-ANTALYA-01", title: "Kaleiçi Konak", summary: "Tarihi Kaleiçi'nde avlulu, havuzlu 14 odalı konak; yat limanına 5 dakika.", destination: "Antalya", stars: 4, address: "Kaleiçi, Muratpaşa / Antalya", rating: 4.7, reviews: 1430, rooms: [["Standart oda", 420000, "breakfast"], ["Deniz manzaralı oda", 560000, "breakfast"]] },
];
let variantCount = 0;
const hotelVariantIds = [];
for (const h of HOTELS) {
  const prod = must(await db.from("supplier_product").insert({
    tenant_id: T, supplier_id: supplier.id, supplier_ref: h.ref, type: "hotel", title: h.title, summary: h.summary, destination: h.destination,
    languages: ["TR", "EN"], includes: ["Kahvaltı", "Wi-Fi", "Otopark"], excludes: ["Konaklama vergisi"], cancellation_type: "free", cancellation_hours_before: 48,
    rating: h.rating, review_count: h.reviews, image_tone: "oklch(0.62 0.09 40)", stars: h.stars, address: h.address,
  }).select("id").single(), `otel ${h.title}`);
  for (const [room, price, board] of h.rooms) {
    for (const n of [1, 8, 15, 22]) {
      const v = must(await db.from("supplier_product_variant").insert({
        tenant_id: T, product_id: prod.id, name: room, starts_at: at(n, 14), base_price: price, currency: CUR, cancellation_type: "free", cancellation_hours_before: 48, board, room_type: room,
      }).select("id").single(), `oda ${room}`);
      must(await db.from("inventory").insert({ tenant_id: T, variant_id: v.id, quantity_available: 3 + (n % 5) }), "envanter");
      hotelVariantIds.push({ id: v.id, title: h.title, room, price, startsAt: at(n, 14) });
      variantCount++;
    }
  }
}
console.log(`Oteller: ${HOTELS.length}, oda varyantı: ${variantCount}`);

/* --- Alt acenteler ve komisyon ------------------------------------------- */
const subs = [];
for (const [name, limit] of [["Demo Kapadokya Tur Ofisi", 5000000], ["Demo Ege Seyahat", 3000000]]) {
  const sub = must(await db.from("agency").insert({ tenant_id: T, parent_agency_id: A, name, type: "sub_agency", credit_limit: limit, currency: CUR, payment_term_days: 30 }).select("id").single(), `alt acente ${name}`);
  must(await db.from("commission_rule").insert({ tenant_id: T, agency_id: sub.id, rule_type: "percentage", value: name.includes("Kapadokya") ? 12 : 10, valid_from: day(-60) }), "komisyon");
  subs.push(sub.id);
}
console.log(`Alt acenteler: ${subs.length}`);

/* --- Müşteriler ------------------------------------------------------------- */
const CUSTOMERS = [
  ["Ayşe Yılmaz", "ayse.yilmaz@demo.ornek", "0532 100 10 01"], ["Mehmet Kaya", "mehmet.kaya@demo.ornek", "0533 200 20 02"], ["Elif Demir", "elif.demir@demo.ornek", "0542 300 30 03"],
  ["Can Öztürk", "can.ozturk@demo.ornek", "0505 400 40 04"], ["Zeynep Arslan", "zeynep.arslan@demo.ornek", "0536 500 50 05"], ["Hans Müller", "hans.mueller@demo.ornek", "+49 170 600 6006"],
  ["Sarah Johnson", "sarah.johnson@demo.ornek", "+44 7700 900 700"], ["Burak Şahin", "burak.sahin@demo.ornek", "0541 800 80 08"],
];
const customers = [];
for (const [full_name, email, phone] of CUSTOMERS) customers.push(must(await db.from("customer").insert({ tenant_id: T, agency_id: A, full_name, email, phone }).select("id, full_name").single(), `müşteri ${full_name}`));

/* --- Rezervasyonlar --------------------------------------------------------- */
const tourBy = (s) => tours.find((t) => t.slug === s);
const futureDep = (t) => [...t.tour_departure].filter((d) => d.starts_at > new Date().toISOString()).sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
let seq = 0;
const ref = () => `HT-DEMO-${String(++seq).padStart(4, "0")}`;
const history = [];
async function booking({ customer, status, travel, items, note, agency = A, paid = false, createdDaysAgo = 0 }) {
  const b = must(await db.from("booking").insert({ tenant_id: T, agency_id: agency, ref: ref(), customer_id: customer.id, status: "DRAFT", currency: CUR, travel_date: travel, note, created_at: at(-createdDaysAgo, 10) }).select("id, ref").single(), "booking");
  const rows = [];
  for (const it of items) {
    const row = must(await db.from("booking_item").insert({ tenant_id: T, booking_id: b.id, currency: CUR, margin_pct: 0, status: status === "CANCELLED" ? "CANCELLED" : status === "PENDING" ? "PENDING" : "CONFIRMED", ...it }).select("id").single(), "booking item");
    rows.push({ id: row.id, ...it });
  }
  must(await db.from("booking").update({ status, confirmed_at: ["CONFIRMED", "COMPLETED"].includes(status) ? at(-createdDaysAgo, 11) : null, cancelled_at: status === "CANCELLED" ? at(-createdDaysAgo + 1, 9) : null }).eq("id", b.id), "booking durum");
  history.push({ tenant_id: T, booking_id: b.id, from_status: null, to_status: "PENDING", reason: "Vitrinden talep", changed_at: at(-createdDaysAgo, 10) });
  if (status !== "PENDING") history.push({ tenant_id: T, booking_id: b.id, from_status: "PENDING", to_status: status, reason: status === "CANCELLED" ? "Müşteri talebi" : "Acente onayı", changed_at: at(-createdDaysAgo, 11) });
  if (paid) {
    // Satış tutarı = round(net × (1 + marj)) × adet — booking_totals görünümüyle aynı formül.
    const total = items.reduce((s, i) => s + Math.round(i.unit_net_price * (1 + (i.margin_pct ?? 0) / 100)) * i.quantity, 0);
    must(await db.from("payment").insert({ tenant_id: T, booking_id: b.id, amount: total, currency: CUR, method: "bank_transfer", status: "succeeded", gateway_reference: `HAVALE-${b.ref}`, paid_at: at(-createdDaysAgo, 15) }), "payment");
    // Tahsilat deftere alacak yazar; onay borcu (tetikleyici) ile kapanır.
    must(await db.from("ledger_entry").insert({ tenant_id: T, agency_id: agency, entry_date: day(-createdDaysAgo), account: "Tahsilat", description: `Havale ${b.ref}`, debit: 0, credit: total, currency: CUR, reference_type: "payment", reference_id: `demo-pay-${b.ref}` }), "tahsilat defter");
  }
  return { ...b, rows };
}

const balon = tourBy("demo-kapadokya-balon"), efes = tourBy("demo-efes-rehberli"), bogaz = tourBy("demo-bogaz-gun-batimi"), cesme = tourBy("demo-cesme-koylar");
const gulet = boats.find((b) => b.slug === "demo-gulet-halikarnas"), yat = boats.find((b) => b.slug === "demo-motoryat-ege");
const vito = vehicles.find((v) => v.title.startsWith("Mercedes Vito")), shuttle = vehicles.find((v) => v.vehicle_type === "shuttle");
const schengen = visas.find((v) => v.title.startsWith("Schengen")), dubai = visas.find((v) => v.title.startsWith("Dubai"));
const kalkan = allVillas.find((v) => v.slug === "demo-villa-kalkan-deniz") ?? allVillas[0];
const d1 = futureDep(balon), d2 = futureDep(efes), d3 = futureDep(bogaz), d4 = futureDep(cesme);

const B = [];
B.push(await booking({ customer: customers[0], status: "CONFIRMED", travel: d1.starts_at.slice(0, 10), paid: true, createdDaysAgo: 6, note: "Otel: Göreme Kaya Otel, 2 yetişkin.", items: [{ item_kind: "tour", tour_id: balon.id, tour_departure_id: d1.id, title_snapshot: balon.title, variant_name_snapshot: "Standart sepet", starts_at: d1.starts_at, quantity: 2, unit_net_price: 780000 }] }));
B.push(await booking({ customer: customers[1], status: "PENDING", travel: d2.starts_at.slice(0, 10), createdDaysAgo: 1, items: [{ item_kind: "tour", tour_id: efes.id, tour_departure_id: d2.id, title_snapshot: efes.title, variant_name_snapshot: "Küçük grup", starts_at: d2.starts_at, quantity: 4, unit_net_price: 245000 }] }));
B.push(await booking({ customer: customers[5], status: "CONFIRMED", travel: d3.starts_at.slice(0, 10), paid: true, createdDaysAgo: 3, items: [{ item_kind: "tour", tour_id: bogaz.id, tour_departure_id: d3.id, title_snapshot: bogaz.title, variant_name_snapshot: "Paylaşımlı tur", starts_at: d3.starts_at, quantity: 2, unit_net_price: 95000 }] }));
B.push(await booking({ customer: customers[2], status: "CANCELLED", travel: d4.starts_at.slice(0, 10), createdDaysAgo: 8, note: "Müşteri tarih değişikliği istedi; yeniden rezervasyon yapılacak.", items: [{ item_kind: "tour", tour_id: cesme.id, tour_departure_id: d4.id, title_snapshot: cesme.title, variant_name_snapshot: "Günlük tur", starts_at: d4.starts_at, quantity: 3, unit_net_price: 125000 }] }));
const bBoat = await booking({ customer: customers[3], status: "CONFIRMED", travel: day(12), paid: true, createdDaysAgo: 10, note: "Kaptan: Ahmet Reis. Mavi yolculuk, Gökova rotası.", items: [{ item_kind: "boat", boat_id: gulet.id, title_snapshot: gulet.title, variant_name_snapshot: "4 gece", starts_at: at(12, 10), quantity: 4, unit_net_price: 4500000 }] });
must(await db.from("boat_booking_detail").insert({ booking_item_id: bBoat.rows[0].id, tenant_id: T, boat_id: gulet.id, from_date: day(12), from_time: "10:00", to_date: day(16), to_time: "10:00", captain_option: "kaptanli", assigned_captain_name: "Ahmet Reis", security_deposit: gulet.security_deposit, operation_status: "planlamaBekliyor" }), "boat detail");
B.push(bBoat);
const bYat = await booking({ customer: customers[4], status: "PENDING", travel: day(5), createdDaysAgo: 0, items: [{ item_kind: "boat", boat_id: yat.id, title_snapshot: yat.title, variant_name_snapshot: "6 saat", starts_at: at(5, 11), quantity: 6, unit_net_price: 1200000 }] });
must(await db.from("boat_booking_detail").insert({ booking_item_id: bYat.rows[0].id, tenant_id: T, boat_id: yat.id, from_date: day(5), from_time: "11:00", to_date: day(5), to_time: "17:00", captain_option: "kaptanli", security_deposit: yat.security_deposit }), "yat detail");
B.push(bYat);
const bVilla = await booking({ customer: customers[6], status: "CONFIRMED", travel: day(20), paid: true, createdDaysAgo: 14, note: "Tahmini varış 16:00; 2 çocuk.", items: [{ item_kind: "villa", villa_id: kalkan.id, title_snapshot: kalkan.title, variant_name_snapshot: "7 gece", starts_at: at(20, 16), quantity: 7, unit_net_price: kalkan.nightly_rate }] });
must(await db.from("villa_booking_detail").insert({ booking_item_id: bVilla.rows[0].id, tenant_id: T, villa_id: kalkan.id, check_in_date: day(20), check_out_date: day(27), guests: 6, booking_method: "talepTopla" }), "villa detail");
B.push(bVilla);
const bTr = await booking({ customer: customers[0], status: "CONFIRMED", travel: day(4), paid: true, createdDaysAgo: 2, items: [{ item_kind: "transfer", vehicle_id: vito.id, title_snapshot: vito.title, variant_name_snapshot: "İstanbul Havalimanı → Sultanahmet", starts_at: at(4, 14), quantity: 1, unit_net_price: 220000 }] });
must(await db.from("transfer_booking_detail").insert({ booking_item_id: bTr.rows[0].id, tenant_id: T, model: "nokta", from_label: "İstanbul Havalimanı", to_label: "Sultanahmet", one_way: false, pickup_date: day(4), pickup_time: "14:30", return_date: day(9), return_time: "06:00", adults: 2, children: 1, assigned_driver_name: "Mustafa Yıldız" }), "transfer detail");
B.push(bTr);
const bSh = await booking({ customer: customers[7], status: "COMPLETED", travel: day(-3), paid: true, createdDaysAgo: 9, items: [{ item_kind: "transfer", vehicle_id: shuttle.id, title_snapshot: shuttle.title, variant_name_snapshot: "Sabiha Gökçen → Taksim", starts_at: at(-3, 9), quantity: 2, unit_net_price: 40000 }] });
must(await db.from("transfer_booking_detail").insert({ booking_item_id: bSh.rows[0].id, tenant_id: T, model: "nokta", from_label: "Sabiha Gökçen Havalimanı", to_label: "Taksim", one_way: true, pickup_date: day(-3), pickup_time: "09:00", adults: 2, children: 0, operation_status: "tamamlandi", assigned_driver_name: "Kemal Aydın" }), "shuttle detail");
B.push(bSh);
const bVisa = await booking({ customer: customers[1], status: "CONFIRMED", travel: day(30), paid: true, createdDaysAgo: 5, items: [{ item_kind: "visa", visa_product_id: schengen.id, title_snapshot: schengen.title, variant_name_snapshot: "2 başvuru", quantity: 2, unit_net_price: schengen.price }] });
B.push(bVisa);
B.push(await booking({ customer: customers[4], status: "PENDING", travel: day(15), createdDaysAgo: 0, items: [{ item_kind: "visa", visa_product_id: dubai.id, title_snapshot: dubai.title, variant_name_snapshot: "1 başvuru", quantity: 1, unit_net_price: dubai.price }] }));
const hv = hotelVariantIds.find((v) => v.title === "Göreme Kaya Otel" && v.room.startsWith("Deluxe"));
B.push(await booking({ customer: customers[0], status: "CONFIRMED", travel: hv.startsAt.slice(0, 10), paid: true, createdDaysAgo: 6, items: [{ item_kind: "supplier_product", supplier_variant_id: hv.id, title_snapshot: hv.title, variant_name_snapshot: `${hv.room} · 3 gece`, starts_at: hv.startsAt, quantity: 3, unit_net_price: hv.price, margin_pct: 15, supplier_reference: "OT-88213" }] }));
// Alt acente satışı
B.push(await booking({ customer: customers[2], agency: subs[0], status: "CONFIRMED", travel: d1.starts_at.slice(0, 10), paid: false, createdDaysAgo: 4, items: [{ item_kind: "tour", tour_id: balon.id, tour_departure_id: d1.id, title_snapshot: balon.title, variant_name_snapshot: "Standart sepet", starts_at: d1.starts_at, quantity: 3, unit_net_price: 780000 }] }));
must(await db.from("booking_status_history").insert(history), "durum geçmişi");
// Vize başvurusu ↔ rezervasyon
const form = must(await db.from("visa_form").insert({ tenant_id: T, name: "Demo Schengen başvuru formu", description: "Schengen turistik vize için ön başvuru.", thank_you_message: "Başvurunuz alındı; evrak listesi e-postanıza gönderildi." }).select("id, name").single(), "visa form");
must(await db.from("visa_form_field").insert([
  { tenant_id: T, form_id: form.id, position: 1, label: "Ad soyad", type: "text", required: true, options: [] },
  { tenant_id: T, form_id: form.id, position: 2, label: "Doğum tarihi", type: "date", required: true, options: [] },
  { tenant_id: T, form_id: form.id, position: 3, label: "Pasaport numarası", type: "text", required: true, options: [] },
  { tenant_id: T, form_id: form.id, position: 4, label: "Seyahat amacı", type: "select", required: true, options: ["Turistik", "Ticari", "Aile ziyareti"] },
  { tenant_id: T, form_id: form.id, position: 5, label: "Pasaport taraması", type: "file", required: true, options: [] },
]), "visa fields");
const apps = must(await db.from("visa_application").insert([
  { tenant_id: T, form_id: form.id, form_name_snapshot: form.name, applicant_name: "Mehmet Kaya", status: "inceleniyor", answers: { "Ad soyad": "Mehmet Kaya", "Seyahat amacı": "Turistik" }, document_names: ["pasaport.pdf"] },
  { tenant_id: T, form_id: form.id, form_name_snapshot: form.name, applicant_name: "Selin Kaya", status: "belgeBekleniyor", answers: { "Ad soyad": "Selin Kaya", "Seyahat amacı": "Turistik" }, document_names: [] },
  { tenant_id: T, form_id: form.id, form_name_snapshot: form.name, applicant_name: "Deniz Yalçın", status: "tamamlandi", answers: { "Ad soyad": "Deniz Yalçın", "Seyahat amacı": "Ticari" }, document_names: ["pasaport.pdf", "davet.pdf"] },
]).select("id"), "visa apps");
must(await db.from("visa_booking_detail").insert({ booking_item_id: bVisa.rows[0].id, tenant_id: T, application_id: apps[0].id, operation_status: "aktifTransfer" }), "visa detail");
// Fatura ve defter ayarı
must(await db.from("invoice").insert([
  { tenant_id: T, agency_id: subs[0], number: "DEMO-2026-0001", period_start: day(-40), period_end: day(-10), amount: 1250000, tax_amount: 250000, currency: CUR, status: "sent", due_date: day(5) },
  { tenant_id: T, agency_id: subs[1], number: "DEMO-2026-0002", period_start: day(-40), period_end: day(-10), amount: 640000, tax_amount: 128000, currency: CUR, status: "paid", due_date: day(-5) },
]), "faturalar");
must(await db.from("ledger_entry").insert([
  { tenant_id: T, agency_id: subs[0], entry_date: day(-20), account: "Tahsilat", description: "Havale ile ödeme", debit: 0, credit: 1500000, currency: CUR, reference_type: "adjustment", reference_id: "demo-tahsilat-1" },
  { tenant_id: T, agency_id: subs[1], entry_date: day(-12), account: "Tahsilat", description: "Havale ile ödeme", debit: 0, credit: 768000, currency: CUR, reference_type: "adjustment", reference_id: "demo-tahsilat-2" },
]), "defter");
console.log(`Rezervasyonlar: ${B.length}, müşteriler: ${customers.length}, vize başvurusu: ${apps.length}`);

/* --- Transfer: popüler rotalar, bölgeler, ayarlar ------------------------- */
const zones = {};
for (const [name, keywords] of [["Avrupa Yakası Merkez", "taksim,beyoğlu,şişli,beşiktaş,fatih,sultanahmet"], ["Anadolu Yakası", "kadıköy,üsküdar,ataşehir,maltepe,pendik"], ["İstanbul Havalimanı", "havalimanı,ist,arnavutköy"], ["Sabiha Gökçen", "saw,sabiha,kurtköy"]]) {
  zones[name] = must(await db.from("map_zone").insert({ tenant_id: T, name, city_country: "İstanbul, Türkiye", keywords }).select("id").single(), `bölge ${name}`).id;
}
const zp = [];
for (const [a, b, priv, sh] of [["İstanbul Havalimanı", "Avrupa Yakası Merkez", 210000, 45000], ["İstanbul Havalimanı", "Anadolu Yakası", 260000, 55000], ["Sabiha Gökçen", "Anadolu Yakası", 170000, 40000], ["Sabiha Gökçen", "Avrupa Yakası Merkez", 200000, 45000]]) {
  zp.push({ tenant_id: T, from_zone_id: zones[a], to_zone_id: zones[b], vehicle_type: "private", price: priv, currency: CUR }, { tenant_id: T, from_zone_id: zones[b], to_zone_id: zones[a], vehicle_type: "private", price: priv, currency: CUR });
  zp.push({ tenant_id: T, from_zone_id: zones[a], to_zone_id: zones[b], vehicle_type: "shuttle", price: sh, currency: CUR }, { tenant_id: T, from_zone_id: zones[b], to_zone_id: zones[a], vehicle_type: "shuttle", price: sh, currency: CUR });
}
must(await db.from("zone_price").insert(zp), "bölge fiyatları");
must(await db.from("km_formula").upsert({ tenant_id: T, enabled: true, base_fare: 60000, per_km: 2500, private_multiplier: 1, shuttle_multiplier: 0.6, currency: CUR }), "km formülü");
must(await db.from("transfer_settings").upsert({ tenant_id: T, default_currency: CUR, show_hourly_rental_tab: true, booking_approval_mode: "otomatik", cancellation_policy_id: policyOrta }), "transfer ayarları");
let routeCount = 0;
for (const [title, s, from, to, min] of [["Havalimanı → Sultanahmet", "demo-ist-sultanahmet", "İstanbul Havalimanı", "Sultanahmet", 60], ["Havalimanı → Taksim", "demo-ist-taksim", "İstanbul Havalimanı", "Taksim", 55], ["Sabiha Gökçen → Taksim", "demo-saw-taksim", "Sabiha Gökçen Havalimanı", "Taksim", 70]]) {
  if (!P[from] || !P[to]) continue;
  const r = must(await db.from("popular_route").insert({ tenant_id: T, kind: "point", title, slug: s, description: "Uçuş takipli, isim tabelasıyla karşılama.", duration_minutes: min, start_point_id: P[from], end_point_id: P[to], currency: CUR, use_custom_title_in_listing: true }).select("id").single(), `rota ${s}`);
  must(await db.from("popular_route_vehicle").insert(vehicles.filter((v) => v.vehicle_type === "private").map((v) => ({ tenant_id: T, route_id: r.id, vehicle_id: v.id }))), "rota araç");
  routeCount++;
}
must(await db.from("time_margin_rule").insert({ tenant_id: T, scope: "zone", start_zone_id: zones["İstanbul Havalimanı"], end_zone_id: zones["Avrupa Yakası Merkez"], start_time: "00:00", end_time: "06:00", percent_pct: 20 }), "gece zammı");
console.log(`Transfer: ${Object.keys(zones).length} bölge, ${zp.length} bölge fiyatı, ${routeCount} popüler rota`);

/* --- Tur ekstraları ve müşteri bilgi alanları ------------------------------ */
const ex1 = must(await db.from("tour_extra").insert({ tenant_id: T, name: "Demo Fotoğraf ve video paketi", price: 150000, currency: CUR, type: "perBooking" }).select("id").single(), "extra 1");
const ex2 = must(await db.from("tour_extra").insert({ tenant_id: T, name: "Demo Otel transferi", price: 25000, currency: CUR, type: "perPerson" }).select("id").single(), "extra 2");
must(await db.from("tour_extra_link").insert([{ tenant_id: T, tour_id: balon.id, extra_id: ex1.id, required: false, sell_phase: "afterBooking" }, { tenant_id: T, tour_id: efes.id, extra_id: ex2.id, required: false, sell_phase: "duringBooking" }]), "extra link");
warn(await db.from("customer_info_field").delete().eq("tenant_id", T).eq("tour_id", balon.id), "info field temizlik");
must(await db.from("customer_info_field").insert([
  { tenant_id: T, tour_id: balon.id, position: 1, label: "Kilo (kg)", type: "text", required: true, scope: "eachParticipant" },
  { tenant_id: T, tour_id: balon.id, position: 2, label: "Otel adı", type: "text", required: true, scope: "bookingOwner" },
]), "info fields");

/* --- Pazaryeri --------------------------------------------------------------- */
const rule = must(await db.from("marketplace_pricing_rule").insert({ owner_tenant_id: T, model: "komisyon", commission_pct: 12, currency: CUR }).select("id").single(), "pazaryeri kural");
must(await db.from("marketplace_profile").upsert({ agency_id: A, tenant_id: T, country: "Türkiye", city: "İstanbul", description: `${tenant.name} — Kapadokya ve Ege'de kendi düzenlediği turları B2B satışa açar.`, contact_email: "husnuhantal2002@gmail.com", default_pricing_rule_id: rule.id, is_visible: true, setup_completed_at: at(-30, 12) }), "pazaryeri profil");
must(await db.from("marketplace_access").upsert({ agency_id: A, tenant_id: T, active: true, via_plan: "enterprise" }), "pazaryeri erişim");
must(await db.from("marketplace_listing").insert([balon, efes, bogaz].map((t) => ({ supplier_tenant_id: T, supplier_agency_id: A, kind: "tur", tour_id: t.id, title: t.title, pricing_rule_id: rule.id, list_price: t === balon ? 780000 : t === efes ? 245000 : 95000, currency: CUR, destination: t === balon ? "Kapadokya" : t === efes ? "Selçuk" : "İstanbul" }))), "listelemeler");
console.log("Pazaryeri: profil + 3 listeleme");

/* --- Marka --------------------------------------------------------------------- */
must(await db.from("tenant_branding").upsert({ tenant_id: T, brand_color: "#0d0f0e" }), "marka");
console.log("Bitti.");
