/**
 * Bir kiracıya her modülden gösterim verisi basar: turlar (kalkış takvimi,
 * yaş kademeleri, program, kategori, görsel, çeviri, iptal politikası),
 * tekneler, villalar, transfer araçları ve noktaları, vize ürünleri, acente
 * profili ve yayınlanmış site yapısı. Görseller `public/images` altından
 * Supabase Storage'a (`media` kovası, herkese açık) yüklenir.
 *
 * Kullanım:  node scripts/seed-demo.mjs <tenant-slug>
 * Tekrar çalıştırılabilir: aynı slug'lı kayıtlar silinip yeniden yazılır.
 * .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SECRET_KEY gerekir.
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
  console.error("Kullanım: node scripts/seed-demo.mjs <tenant-slug>  (NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SECRET_KEY gerekli)");
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

const tenant = must(await db.from("tenant").select("id, name, default_currency").eq("slug", slug).single(), "tenant");
const T = tenant.id;
const agency = must(await db.from("agency").select("id").eq("tenant_id", T).eq("type", "master").limit(1).single(), "agency");
const A = agency.id;
const CUR = tenant.default_currency || "TRY";
console.log(`Kiracı: ${tenant.name} (${T})`);

/* --- Görseller: public/images → Storage `media` kovası ------------------- */
const BUCKET = "media";
const { data: buckets } = await db.storage.listBuckets();
if (!buckets?.some((b) => b.name === BUCKET)) {
  must(await db.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 10 * 1024 * 1024 }), "bucket");
  console.log("Kova oluşturuldu: media (public)");
}
const IMAGES = [
  "balon.jpg", "feribot.jpg", "kultur.jpg", "transfer.jpg", "yat.jpg", "tekne.jpg", "istanbul.jpg", "otel.jpg",
  "v/pamukkale-2.jpg", "v/oludeniz.jpg", "v/oludeniz-2.jpg", "v/alacati.jpg", "v/efes-2.jpg", "v/pamukkale.jpg",
  "v/antalya.jpg", "v/antalya-2.jpg", "v/alacati-2.jpg", "v/bodrum-2.jpg", "v/efes.jpg", "v/bodrum.jpg",
  "p/izgara.jpg", "p/koy-kus.jpg", "p/yuzme.jpg", "p/resif.jpg", "p/gunbatimi.jpg", "p/gunbatimi-yat.jpg",
  "p/koy-kayalik.jpg", "p/koy-yat.jpg", "p/trawler.jpg", "p/yuzme-2.jpg", "p/koy-sandal.jpg", "p/yelkenli.jpg",
];
for (const f of IMAGES) {
  const key = `${slug}/${f.replace("/", "-")}`;
  const buf = readFileSync(resolve("public/images", f));
  const { error } = await db.storage.from(BUCKET).upload(key, buf, { contentType: "image/jpeg", upsert: true });
  if (error) console.warn(`görsel ${f}: ${error.message}`);
}
const img = (f) => `${BUCKET}/${slug}/${f.replace("/", "-")}`;
console.log(`Görseller yüklendi (${IMAGES.length})`);

/* --- Temizlik: önceki demo kayıtları ------------------------------------- */
const SEED_TAG = "demo-";
for (const tb of ["tour", "boat", "villa"]) must(await db.from(tb).delete().eq("tenant_id", T).like("slug", `${SEED_TAG}%`), `${tb} temizlik`);
must(await db.from("vehicle").delete().eq("tenant_id", T).like("description", "[demo]%"), "vehicle temizlik");
must(await db.from("visa_product").delete().eq("tenant_id", T).like("description", "[demo]%"), "visa temizlik");
for (const tb of ["tour_category", "boat_category", "villa_category", "villa_region", "villa_feature", "boat_feature", "vehicle_feature", "location_point", "cancellation_policy", "map_zone"]) {
  const { error } = await db.from(tb).delete().eq("tenant_id", T);
  if (error) console.warn(`${tb} temizlik: ${error.message}`);
}

/* --- Ortak: iptal politikaları, noktalar, kategoriler --------------------- */
const esnek = must(await db.from("cancellation_policy").insert({ tenant_id: T, template: "esnek" }).select("id").single(), "policy esnek");
must(await db.from("cancellation_cutoff").insert([{ tenant_id: T, policy_id: esnek.id, days_before: 1, refund_pct: 100 }]), "cutoff esnek");
const orta = must(await db.from("cancellation_policy").insert({ tenant_id: T, template: "orta" }).select("id").single(), "policy orta");
must(await db.from("cancellation_cutoff").insert([
  { tenant_id: T, policy_id: orta.id, days_before: 7, refund_pct: 100 },
  { tenant_id: T, policy_id: orta.id, days_before: 3, refund_pct: 50 },
]), "cutoff orta");

const point = async (kind, name, address, city) =>
  must(await db.from("location_point").insert({ tenant_id: T, kind, name, address, city, country: "Türkiye" }).select("id").single(), `point ${name}`).id;
const meetGoreme = await point("meeting", "Göreme Otogarı", "Göreme Otogarı, Cumhuriyet Meydanı, Göreme / Nevşehir", "Nevşehir");
const meetKabatas = await point("meeting", "Kabataş İskelesi", "Kabataş Vapur İskelesi, Beyoğlu / İstanbul", "İstanbul");
const meetEfes = await point("meeting", "Efes Üst Kapı", "Efes Antik Kenti Magnesia Kapısı gişesi, Selçuk / İzmir", "İzmir");
const meetCesme = await point("meeting", "Çeşme Limanı", "Çeşme Limanı, Kale önü tekne iskelesi, Çeşme / İzmir", "İzmir");
const meetPamukkale = await point("meeting", "Pamukkale Kuzey Kapı", "Pamukkale Travertenleri Kuzey Girişi, Denizli", "Denizli");
const marinaBodrum = await point("marina", "Bodrum Marina", "Neyzen Tevfik Cad. Bodrum / Muğla", "Muğla");
const marinaCesme = await point("marina", "Çeşme Marina", "Çeşme Marina, Çeşme / İzmir", "İzmir");
const marinaFethiye = await point("marina", "Fethiye Ece Marina", "Karagözler, Fethiye / Muğla", "Muğla");
const tpIST = await point("transfer", "İstanbul Havalimanı", "Tayakadın, Arnavutköy / İstanbul", "İstanbul");
const tpSAW = await point("transfer", "Sabiha Gökçen Havalimanı", "Pendik / İstanbul", "İstanbul");
const tpTaksim = await point("transfer", "Taksim", "Taksim Meydanı, Beyoğlu / İstanbul", "İstanbul");
const tpSultanahmet = await point("transfer", "Sultanahmet", "Sultanahmet, Fatih / İstanbul", "İstanbul");

const cat = async (title, s) => must(await db.from("tour_category").insert({ tenant_id: T, title, slug: s }).select("id").single(), `kategori ${title}`).id;
const C = { balon: await cat("Balon", "balon"), kultur: await cat("Kültür", "kultur"), macera: await cat("Macera", "macera"), deniz: await cat("Deniz", "deniz"), gastronomi: await cat("Gastronomi", "gastronomi") };

/* --- Turlar ---------------------------------------------------------------- */
const addDays = (n, h) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  d.setUTCHours(h - 3, 0, 0, 0); // İstanbul saati → UTC
  return d.toISOString();
};
const TOURS = [
  {
    slug: "demo-kapadokya-balon", title: "Kapadokya gün doğumu balon turu", featured: true, kind: "gunubirlik", cats: ["balon", "macera"],
    description: "Sabahın erken saatlerinde otelinizden alınarak kalkış alanına götürülürsünüz. Hafif bir kahvaltının ardından pilotunuzun güvenlik bilgilendirmesiyle sepete binersiniz. Yaklaşık bir saatlik uçuş boyunca Güvercinlik, Kızılçukur ve Aşk vadilerinin üzerinden geçer, peribacalarını gün ışığıyla birlikte izlersiniz. İnişte ekip geleneksel kutlamayı yapar ve katılım belgenizi verir.",
    includes: ["Otel alınış ve bırakılış", "Hafif kahvaltı", "Yaklaşık 1 saatlik uçuş", "Uçuş sigortası", "Katılım belgesi"], excludes: ["Kişisel harcamalar", "Fotoğraf ve video paketleri"],
    know: "Uçuşlar hava koşullarına bağlıdır; iptal durumunda ücret iadesi ya da tarih değişikliği yapılır. Hamileler ve 6 yaş altı çocuklar katılamaz.", bring: "Rahat ayakkabı ve katmanlı kıyafet.",
    start: "Göreme", meeting: meetGoreme, difficulty: "kolay", adult: 780000, child: 620000, policy: esnek.id, hour: 5, capacity: 12, booked: 8,
    stops: [["Otelden alınış", 30, "Ekibimiz sizi otelinizin önünden alır."], ["Kahvaltı ve bilgilendirme", 30, "Kalkış alanında hafif kahvaltı ve pilot brifingi."], ["Uçuş", 60, "Yaklaşık bir saat boyunca vadilerin üzerinde."], ["İniş ve kutlama", 30, "Geleneksel kutlama ve katılım belgesi."], ["Otele dönüş", 30, ""]],
    images: ["balon.jpg", "v/pamukkale-2.jpg", "kultur.jpg"],
  },
  {
    slug: "demo-efes-rehberli", title: "Efes antik kenti ve Celsus Kütüphanesi rehberli tur", featured: true, kind: "gunubirlik", cats: ["kultur"],
    description: "Magnesia Kapısı'ndan başlayan turda Kuretler Caddesi, Hadrian Tapınağı, Celsus Kütüphanesi ve Büyük Tiyatro'yu rehberinizin anlatımıyla gezersiniz. Tur, Liman Caddesi çıkışında sona erer.",
    includes: ["Profesyonel kokartlı rehber", "Ören yeri giriş bileti", "Kulaklık sistemi"], excludes: ["Yamaç Evler giriş ücreti", "Öğle yemeği"],
    know: "Zemin taşlık; rahat ayakkabı giyin.", bring: "Yazın şapka ve su; gölge alan azdır.",
    start: "Selçuk", meeting: meetEfes, difficulty: "orta", adult: 245000, child: 160000, policy: esnek.id, hour: 9, capacity: 15, booked: 3,
    stops: [["Magnesia Kapısı", 30, "Rehberle buluşma ve giriş."], ["Kuretler Caddesi", 60, "Hadrian Tapınağı ve çeşmeler."], ["Celsus Kütüphanesi", 60, "Fotoğraf molası."], ["Büyük Tiyatro", 60, "Turun sona ermesi."]],
    images: ["v/efes.jpg", "v/efes-2.jpg", "kultur.jpg"],
  },
  {
    slug: "demo-pamukkale-hierapolis", title: "Pamukkale ve Hierapolis günübirlik tur", featured: false, kind: "gunubirlik", cats: ["kultur"],
    description: "Sabah otelinizden alınarak Pamukkale'ye ulaşırsınız. Rehberinizle Hierapolis'in nekropolü, tiyatrosu ve Frontinus Caddesi'ni gezdikten sonra travertenlerde serbest zaman verilir.",
    includes: ["Otel transferi", "Rehberlik", "Ören yeri girişi", "Öğle yemeği"], excludes: ["Antik Havuz giriş ücreti", "İçecekler"],
    know: "Travertenlerde ayakkabı ile yürünmez; terlik getirin.", bring: "Mayo, havlu, güneş kremi.",
    start: "Pamukkale", meeting: meetPamukkale, difficulty: "kolay", adult: 225000, child: 140000, policy: orta.id, hour: 7, capacity: 20, booked: 5,
    stops: [["Otelden alınış", 60, ""], ["Hierapolis", 150, "Nekropol, tiyatro ve Frontinus Caddesi."], ["Öğle yemeği", 60, ""], ["Travertenler", 120, "Serbest zaman."], ["Dönüş", 90, ""]],
    images: ["v/pamukkale-2.jpg", "v/pamukkale.jpg"],
  },
  {
    slug: "demo-bogaz-gun-batimi", title: "Boğaz'da gün batımı tekne turu", featured: true, kind: "gunubirlik", cats: ["deniz"],
    description: "Kabataş'tan kalkan teknede Dolmabahçe Sarayı, Ortaköy Camii, Boğaziçi Köprüsü ve Rumeli Hisarı'nı denizden izlersiniz. Dönüşte şehir ışıkları yanarken iskeleye varılır.",
    includes: ["Tekne turu", "Çay ve ikram", "Sesli anlatım"], excludes: ["Otel transferi"],
    know: "Kalkıştan 15 dakika önce iskelede olun.", bring: "Akşam serinliği için ince bir ceket.",
    start: "İstanbul", meeting: meetKabatas, difficulty: "kolay", adult: 95000, child: 60000, policy: esnek.id, hour: 18, capacity: 40, booked: 36,
    stops: [["Kabataş'tan kalkış", 15, ""], ["Ortaköy ve Boğaziçi Köprüsü", 45, ""], ["Rumeli Hisarı", 30, "Gün batımı."], ["Kabataş'a dönüş", 30, ""]],
    images: ["istanbul.jpg", "kultur.jpg", "p/gunbatimi.jpg"],
  },
  {
    slug: "demo-cesme-koylar", title: "Çeşme koylar tekne turu, öğle yemeği dahil", featured: false, kind: "gunubirlik", cats: ["deniz"],
    description: "Çeşme limanından hareketle Aya Yorgi, Pırlanta ve Kum koylarına uğrayan rotada her durakta yaklaşık bir saatlik yüzme molası verilir. Öğle yemeği teknede servis edilir. Gün batımına doğru limana dönüş yapılır.",
    includes: ["Tekne turu", "Öğle yemeği", "Kaptan ve mürettebat", "Can yeleği"], excludes: ["İçecekler", "Otel transferi"],
    know: "Rüzgarlı havalarda rota kaptanın kararıyla değişebilir.", bring: "Havlu, güneş kremi ve mayo.",
    start: "Çeşme", meeting: meetCesme, difficulty: "kolay", adult: 125000, child: 75000, policy: esnek.id, hour: 10, capacity: 30, booked: 10,
    stops: [["Limandan kalkış", 30, "Çeşme Limanı, Kale önü iskelesi."], ["Aya Yorgi Koyu", 60, "İlk yüzme molası."], ["Öğle yemeği", 60, "Teknede servis."], ["Pırlanta ve Kum koyları", 120, "İki yüzme molası daha."], ["Limana dönüş", 60, ""]],
    images: ["tekne.jpg", "yat.jpg", "v/alacati.jpg", "p/yuzme.jpg"],
  },
  {
    slug: "demo-alacati-gastronomi", title: "Alaçatı sokakları ve Ege mutfağı yürüyüşü", featured: false, kind: "gunubirlik", cats: ["gastronomi", "kultur"],
    description: "Alaçatı'nın taş sokaklarında yerel rehber eşliğinde yürüyüş; ot pazarı, yel değirmenleri ve üç ayrı durakta Ege mezeleri, sakızlı tatlılar ve yöresel şarap tadımı.",
    includes: ["Yerel rehber", "Üç durak tadım", "Şarap tadımı"], excludes: ["Ek yiyecek ve içecekler"],
    know: "Vejetaryen seçenek rezervasyonda belirtilmelidir.", bring: "Rahat ayakkabı.",
    start: "Alaçatı", meeting: meetCesme, difficulty: "kolay", adult: 165000, child: 90000, policy: esnek.id, hour: 17, capacity: 12, booked: 2,
    stops: [["Alaçatı meydanı", 20, "Rehberle buluşma."], ["Ot pazarı ve yel değirmenleri", 60, ""], ["Meze durağı", 45, ""], ["Tatlı ve şarap", 60, ""]],
    images: ["v/alacati.jpg", "v/alacati-2.jpg", "p/izgara.jpg"],
  },
];

for (const t of TOURS) {
  const tour = must(await db.from("tour").insert({
    tenant_id: T, agency_id: A, status: "aktif", featured: t.featured, title: t.title, slug: t.slug, tour_kind: t.kind, program_type: "tur",
    show_on_website: true, start_location: t.start, end_location: t.start, description: t.description, includes: t.includes, excludes: t.excludes,
    know_before_you_go: t.know, what_to_bring: t.bring, difficulty: t.difficulty, meeting_point_id: t.meeting, meeting_time_minutes_before: 20,
    pricing_model: "kisiBasi", pricing_currency: CUR, cancellation_policy_id: t.policy, payment_mode: "sadeceRezervasyon",
  }).select("id").single(), `tur ${t.slug}`);
  const id = tour.id;
  must(await db.from("tour_age_tier").insert([
    { tenant_id: T, tour_id: id, key: "adult", enabled: true, min_age: 13, max_age: 99, price: t.adult },
    { tenant_id: T, tour_id: id, key: "child", enabled: true, min_age: 6, max_age: 12, price: t.child },
    { tenant_id: T, tour_id: id, key: "infant", enabled: false, min_age: 0, max_age: 5, price: 0 },
  ]), `kademe ${t.slug}`);
  must(await db.from("itinerary_stop").insert(t.stops.map(([name, duration_minutes, description], i) => ({ tenant_id: T, tour_id: id, position: i + 1, name, duration_minutes, description }))), `program ${t.slug}`);
  must(await db.from("tour_category_link").insert(t.cats.map((c) => ({ tenant_id: T, tour_id: id, category_id: C[c] }))), `kategori bağı ${t.slug}`);
  must(await db.from("media_asset").insert(t.images.map((f, i) => ({ tenant_id: T, tour_id: id, kind: "image", storage_path: img(f), alt: t.title, position: i + 1, is_cover: i === 0 }))), `görsel ${t.slug}`);
  must(await db.from("tour_translation").insert({ tenant_id: T, tour_id: id, locale: "en", title: t.title, description: t.description, auto: true }), `çeviri ${t.slug}`);
  const deps = [];
  for (let d = 1; d <= 30; d += 2) deps.push({ tenant_id: T, tour_id: id, starts_at: addDays(d, t.hour), capacity: t.capacity, booked_count: d === 1 ? t.booked : Math.floor(t.booked / 2) });
  must(await db.from("tour_departure").insert(deps), `kalkış ${t.slug}`);
}
console.log(`Turlar: ${TOURS.length}`);

/* --- Tekneler ------------------------------------------------------------- */
const bcat = async (title, s) => must(await db.from("boat_category").insert({ tenant_id: T, title, slug: s }).select("id").single(), `tekne kategori ${title}`).id;
const BC = { gulet: await bcat("Gulet", "gulet"), yat: await bcat("Motor yat", "motor-yat"), tekne: await bcat("Günlük tekne", "gunluk-tekne") };
const bfeat = async (name) => must(await db.from("boat_feature").insert({ tenant_id: T, name }).select("id").single(), `tekne özellik ${name}`).id;
const BF = { klima: await bfeat("Klima"), jenerator: await bfeat("Jeneratör"), snorkel: await bfeat("Şnorkel seti"), muzik: await bfeat("Müzik sistemi"), guneslik: await bfeat("Güneşlenme güvertesi"), jetski: await bfeat("Jet ski") };
const BOATS = [
  {
    slug: "demo-gulet-halikarnas", title: "Halikarnas — 24 m lüks gulet", category: BC.gulet, capacity: 12, marina: marinaBodrum, brand: "Bodrum tipi gulet", year: 2016, length: 24, engine: "2 × 450 hp", cabins: 6, beds: 12,
    description: "Altı kabinli, tam mürettebatlı ahşap gulet. Bodrum'dan kalkışla Gökova Körfezi, Orak Adası ve Karaada rotaları; mavi yolculuk için ideal.",
    includes: ["Kaptan ve 3 kişilik mürettebat", "Tam pansiyon yemek", "Yakıt (günde 4 saat seyir)", "Liman ücretleri"], excludes: ["Alkollü içecekler", "Transfer"],
    pricing: { pricing_model: "cokGunlu", multiday_unit: "gece", multiday_unit_price: 4500000, multiday_min_units: 3, multiday_max_units: 14 },
    captain_option: "kaptanli", captain_fee: 0, deposit: 2000000, features: [BF.klima, BF.jenerator, BF.snorkel, BF.muzik, BF.guneslik], images: ["v/bodrum.jpg", "yat.jpg", "p/koy-yat.jpg", "p/gunbatimi-yat.jpg"],
  },
  {
    slug: "demo-motoryat-ege", title: "Ege Prenses — motor yat, günlük kiralama", category: BC.yat, capacity: 8, marina: marinaCesme, brand: "Azimut 55", year: 2019, length: 17, engine: "2 × 800 hp", cabins: 3, beds: 6,
    description: "Çeşme Marina'dan kalkan hızlı motor yat; Alaçatı koyları, Ildır ve Sakız adası günübirlik rotaları. Saatlik ya da tam gün.",
    includes: ["Kaptan", "Yakıt (saatte 1 saat seyir)", "Meşrubat"], excludes: ["Öğle yemeği", "Marina ücretleri (varsa)"],
    pricing: { pricing_model: "saatlik", hourly_rate: 1200000, min_rental_hours: 4 },
    captain_option: "kaptanli", captain_fee: 0, deposit: 1500000, features: [BF.klima, BF.muzik, BF.guneslik, BF.jetski], images: ["yat.jpg", "p/koy-kus.jpg", "p/resif.jpg"],
  },
  {
    slug: "demo-tekne-fethiye", title: "Likya — Ölüdeniz günlük tekne turu, kişi başı", category: BC.tekne, capacity: 40, marina: marinaFethiye, brand: "Ahşap gezi teknesi", year: 2012, length: 22, engine: "1 × 350 hp", cabins: 0, beds: 0,
    description: "Fethiye'den kalkan paylaşımlı tekneyle Kelebekler Vadisi, Mavi Mağara, Soğuk Su Koyu ve Deve Plajı; beş yüzme molası ve teknede öğle yemeği.",
    includes: ["Tekne turu", "Öğle yemeği", "Can yeleği"], excludes: ["İçecekler", "Kelebekler Vadisi giriş ücreti"],
    pricing: { pricing_model: "kisiBasi", per_person_price: 148000, per_person_min_group: 1 },
    captain_option: "kaptanli", captain_fee: 0, deposit: 0, features: [BF.guneslik, BF.muzik, BF.snorkel], images: ["v/oludeniz.jpg", "v/oludeniz-2.jpg", "p/yuzme-2.jpg", "p/koy-sandal.jpg"],
  },
];
for (const b of BOATS) {
  const boat = must(await db.from("boat").insert({
    tenant_id: T, agency_id: A, status: "aktif", title: b.title, slug: b.slug, internal_short_name: b.title.split(" ")[0], category_id: b.category, legal_capacity: b.capacity, main_marina_id: b.marina,
    brand_model: b.brand, build_year: b.year, length_meters: b.length, engine_info: b.engine, cabin_count: b.cabins, bed_count: b.beds,
    description: b.description, what_to_bring: "Havlu, güneş kremi, mayo.", includes: b.includes, excludes: b.excludes,
    lifejacket_count: b.capacity + 4, has_life_raft: true, has_fire_extinguisher: true, safety_notes: "Denizcilik yönetmeliğine uygun donanım; sezon başı denetimden geçmiştir.",
    captain_option: b.captain_option, captain_fee: b.captain_fee, captain_fee_unit: "gunluk", captain_language: "Türkçe, İngilizce",
    currency: CUR, ...b.pricing, security_deposit: b.deposit, fuel_policy_included: true, cancellation_policy_id: orta.id, payment_mode: "sadeceRezervasyon",
  }).select("id").single(), `tekne ${b.slug}`);
  must(await db.from("boat_feature_link").insert(b.features.map((f) => ({ tenant_id: T, boat_id: boat.id, feature_id: f }))), `tekne özellik bağı ${b.slug}`);
  must(await db.from("media_asset").insert(b.images.map((f, i) => ({ tenant_id: T, boat_id: boat.id, kind: "image", storage_path: img(f), alt: b.title, position: i + 1, is_cover: i === 0 }))), `tekne görsel ${b.slug}`);
}
console.log(`Tekneler: ${BOATS.length}`);

/* --- Villalar ------------------------------------------------------------- */
const vcat = async (title) => must(await db.from("villa_category").insert({ tenant_id: T, title }).select("id").single(), `villa kategori ${title}`).id;
const VC = { luks: await vcat("Lüks villa"), aile: await vcat("Aile villası"), balayi: await vcat("Balayı villası") };
const vreg = async (name) => must(await db.from("villa_region").insert({ tenant_id: T, name }).select("id").single(), `villa bölge ${name}`).id;
const VR = { kalkan: await vreg("Kalkan"), bodrum: await vreg("Bodrum"), alacati: await vreg("Alaçatı") };
const vfeat = async (name) => must(await db.from("villa_feature").insert({ tenant_id: T, name }).select("id").single(), `villa özellik ${name}`).id;
const VF = { havuz: await vfeat("Özel havuz"), jakuzi: await vfeat("Jakuzi"), deniz: await vfeat("Deniz manzarası"), klima: await vfeat("Klima"), wifi: await vfeat("Wi-Fi"), barbeku: await vfeat("Barbekü"), otopark: await vfeat("Kapalı otopark") };
const VILLAS = [
  { slug: "demo-villa-kalkan-deniz", title: "Villa Mavi — Kalkan, deniz manzaralı", category: VC.luks, region: VR.kalkan, province: "Antalya", district: "Kaş", capacity: 8, nightly: 1200000, min: 4, pets: false,
    description: "Kalkan Kışla mevkiinde, denize hakim yamaçta dört yatak odalı özel havuzlu villa. Sonsuzluk havuzu, geniş teras ve merkeze 5 dakika.",
    features: [VF.havuz, VF.jakuzi, VF.deniz, VF.klima, VF.wifi, VF.barbeku], poi: [["Kalkan merkez", 1.8, "km"], ["Kaputaş Plajı", 7, "km"], ["Dalaman Havalimanı", 120, "km"]], images: ["v/antalya.jpg", "otel.jpg", "v/antalya-2.jpg"] },
  { slug: "demo-villa-bodrum-aile", title: "Villa Zeytin — Bodrum Yalıkavak, aile villası", category: VC.aile, region: VR.bodrum, province: "Muğla", district: "Bodrum", capacity: 10, nightly: 850000, min: 3, pets: true,
    description: "Yalıkavak'ta zeytin bahçesi içinde beş yatak odalı, çocuk havuzlu aile villası. Marinaya 6 dakika.",
    features: [VF.havuz, VF.klima, VF.wifi, VF.barbeku, VF.otopark], poi: [["Yalıkavak Marina", 3, "km"], ["Bodrum merkez", 18, "km"], ["Milas-Bodrum Havalimanı", 45, "km"]], images: ["v/bodrum-2.jpg", "otel.jpg", "v/bodrum.jpg"] },
  { slug: "demo-villa-alacati-tas", title: "Taş Ev — Alaçatı, balayı villası", category: VC.balayi, region: VR.alacati, province: "İzmir", district: "Çeşme", capacity: 2, nightly: 650000, min: 2, pets: false,
    description: "Alaçatı'nın taş sokaklarında restore edilmiş, avlulu ve ısıtmalı havuzlu tek yatak odalı taş ev. Kahvaltı dahil.",
    features: [VF.havuz, VF.jakuzi, VF.klima, VF.wifi], poi: [["Alaçatı çarşı", 0.4, "km"], ["Ilıca Plajı", 6, "km"], ["İzmir Havalimanı", 75, "km"]], images: ["v/alacati-2.jpg", "v/alacati.jpg", "otel.jpg"] },
];
for (const v of VILLAS) {
  const villa = must(await db.from("villa").insert({
    tenant_id: T, agency_id: A, status: "aktif", title: v.title, slug: v.slug, description: v.description, category_id: v.category, tourism_license_no: "TR-2024-" + v.slug.slice(-4).toUpperCase(),
    price_currency: CUR, nightly_rate: v.nightly, province: v.province, district: v.district, address_detail: `${v.district}, ${v.province}`, capacity: v.capacity, pets_allowed: v.pets, min_nights: v.min,
    cancellation_policy_id: orta.id,
  }).select("id").single(), `villa ${v.slug}`);
  must(await db.from("villa_region_link").insert({ tenant_id: T, villa_id: villa.id, region_id: v.region }), `villa bölge bağı ${v.slug}`);
  must(await db.from("villa_feature_link").insert(v.features.map((f) => ({ tenant_id: T, villa_id: villa.id, feature_id: f }))), `villa özellik bağı ${v.slug}`);
  must(await db.from("villa_poi_distance").insert(v.poi.map(([label, distance, unit]) => ({ tenant_id: T, villa_id: villa.id, label, distance, unit }))), `villa poi ${v.slug}`);
  must(await db.from("media_asset").insert(v.images.map((f, i) => ({ tenant_id: T, villa_id: villa.id, kind: "image", storage_path: img(f), alt: v.title, position: i + 1, is_cover: i === 0 }))), `villa görsel ${v.slug}`);
}
console.log(`Villalar: ${VILLAS.length}`);

/* --- Transfer araçları ve rota fiyatları ---------------------------------- */
const vfeatT = async (name) => must(await db.from("vehicle_feature").insert({ tenant_id: T, name }).select("id").single(), `araç özellik ${name}`).id;
const TF = { wifi: await vfeatT("Wi-Fi"), su: await vfeatT("İkram suyu"), bebek: await vfeatT("Bebek koltuğu"), tabela: await vfeatT("İsim tabelasıyla karşılama"), ucus: await vfeatT("Uçuş takibi") };
const VEHICLES = [
  { title: "Mercedes Vito — özel VIP transfer (1–6 kişi)", description: "[demo] Havalimanı ve şehir içi özel transfer; isim tabelasıyla karşılama, uçuş takibi, 60 dk ücretsiz bekleme.", type: "private", seats: 6, luggage: 6, pricing_model: "rotaBazli", features: [TF.wifi, TF.su, TF.bebek, TF.tabela, TF.ucus], images: ["transfer.jpg"] },
  { title: "Mercedes Sprinter — grup minibüsü (7–14 kişi)", description: "[demo] Kalabalık gruplar için geniş bagajlı minibüs; şehirler arası ve havalimanı transferi.", type: "private", seats: 14, luggage: 14, pricing_model: "rotaBazli", features: [TF.wifi, TF.su, TF.tabela], images: ["transfer.jpg"] },
  { title: "Sedan — saatlik şoförlü araç", description: "[demo] Şehir içi toplantı, alışveriş ve gezi için şoförlü sedan; saatlik kiralama, en az 3 saat.", type: "private", seats: 3, luggage: 3, pricing_model: "saatlikKiralama", hourly_rate: 150000, features: [TF.wifi, TF.su], images: ["transfer.jpg"] },
  { title: "Havalimanı paylaşımlı shuttle", description: "[demo] İstanbul Havalimanı – Taksim/Sultanahmet arası saat başı paylaşımlı servis; kişi başı fiyat.", type: "shuttle", seats: 16, luggage: 16, pricing_model: "rotaBazli", features: [TF.wifi], images: ["transfer.jpg"] },
];
for (const v of VEHICLES) {
  const veh = must(await db.from("vehicle").insert({
    tenant_id: T, agency_id: A, status: "aktif", pricing_model: v.pricing_model, title: v.title, description: v.description, vehicle_type: v.type, seat_capacity: v.seats, luggage_capacity: v.luggage,
    hourly_rate: v.hourly_rate ?? null, hourly_currency: v.hourly_rate ? CUR : null,
  }).select("id").single(), `araç ${v.title}`);
  must(await db.from("vehicle_feature_link").insert(v.features.map((f) => ({ tenant_id: T, vehicle_id: veh.id, feature_id: f }))), `araç özellik bağı`);
  must(await db.from("media_asset").insert(v.images.map((f, i) => ({ tenant_id: T, vehicle_id: veh.id, kind: "image", storage_path: img(f), alt: v.title, position: i + 1, is_cover: i === 0 }))), `araç görsel`);
}
const routes = [];
for (const [from, to, priv, shut] of [[tpIST, tpTaksim, 210000, 45000], [tpIST, tpSultanahmet, 220000, 45000], [tpSAW, tpTaksim, 190000, 40000], [tpSAW, tpSultanahmet, 200000, 40000]]) {
  routes.push({ tenant_id: T, from_point_id: from, to_point_id: to, vehicle_type: "private", price: priv, currency: CUR }, { tenant_id: T, from_point_id: to, to_point_id: from, vehicle_type: "private", price: priv, currency: CUR });
  routes.push({ tenant_id: T, from_point_id: from, to_point_id: to, vehicle_type: "shuttle", price: shut, currency: CUR }, { tenant_id: T, from_point_id: to, to_point_id: from, vehicle_type: "shuttle", price: shut, currency: CUR });
}
must(await db.from("transfer_point_price").insert(routes), "rota fiyatları");
console.log(`Araçlar: ${VEHICLES.length}, rota fiyatı: ${routes.length}`);

/* --- Vize ürünleri ---------------------------------------------------------- */
const VISAS = [
  { title: "Schengen vizesi (turistik)", country: "Almanya", price: 650000, min: 10, max: 20, docs: ["Pasaport (en az 6 ay geçerli)", "2 biyometrik fotoğraf", "Seyahat sağlık sigortası", "Otel ve uçak rezervasyonu", "Son 3 ay banka hesap dökümü", "İşveren yazısı / SGK dökümü"] },
  { title: "Amerika Birleşik Devletleri B1/B2 vizesi", country: "Amerika Birleşik Devletleri", price: 1250000, min: 30, max: 90, docs: ["Pasaport", "DS-160 onay sayfası", "Fotoğraf (5×5 cm, beyaz fon)", "Mülakat randevu belgesi", "Gelir ve mal varlığı belgeleri"] },
  { title: "Birleşik Krallık standart ziyaretçi vizesi", country: "Birleşik Krallık", price: 980000, min: 15, max: 30, docs: ["Pasaport", "Online başvuru formu", "Banka dökümü", "Konaklama ve seyahat planı", "Çalışma belgesi"] },
  { title: "Dubai (BAE) 30 gün turist vizesi", country: "Birleşik Arap Emirlikleri", price: 420000, min: 3, max: 5, docs: ["Pasaport taraması (en az 6 ay geçerli)", "Vesikalık fotoğraf", "Gidiş-dönüş uçak bileti"] },
];
must(await db.from("visa_product").insert(VISAS.map((v) => ({ tenant_id: T, agency_id: A, status: "aktif", title: v.title, country: v.country, description: `[demo] ${v.title} başvurusu; evrak kontrolü, randevu ve takip hizmeti dahil. Konsolosluk harcı fiyata dahildir.`, price: v.price, currency: CUR, processing_days_min: v.min, processing_days_max: v.max, required_documents: v.docs }))), "vize");
console.log(`Vize ürünleri: ${VISAS.length}`);

/* --- Acente profili ve site yapısı ---------------------------------------- */
must(await db.from("tenant_profile").upsert({
  tenant_id: T,
  about: `${tenant.name}, 2009'dan beri Kapadokya, Ege ve Akdeniz'de kendi düzenlediği turları, tekne ve villa kiralamalarını doğrudan satan TÜRSAB belgeli bir seyahat acentesidir. Her deneyimi bizzat çalıştığımız yerel ekiplerle sunuyoruz; aracı zinciri kısa olduğu için fiyat makul kalır, bir aksilikte doğrudan sahadaki ekibe ulaşırız.`,
  phone_hours: "Hafta içi 09:00–19:00",
}, { onConflict: "tenant_id" }), "profil");

const siteRow = must(await db.from("tenant_site").select("draft").eq("tenant_id", T).maybeSingle(), "site oku");
const draft = siteRow?.draft ?? {};
const sections = [
  { id: "hero", kind: "hero", enabled: true, title: "Türkiye'nin en güzel deneyimleri,", lead: "tek yerden rezerve edin", limit: 6, body: "" },
  { id: "departures", kind: "departures", enabled: true, title: "Bugünün kalkış saatleri", lead: "", limit: 6, body: "" },
  { id: "tours", kind: "tours", enabled: true, title: "Şu an popüler", lead: "", limit: 8, body: "" },
  { id: "boats", kind: "boats", enabled: true, title: "Tekne & Yat", lead: "", limit: 6, body: "" },
  { id: "villas", kind: "villas", enabled: true, title: "Villalar", lead: "", limit: 6, body: "" },
  { id: "transfers", kind: "transfers", enabled: true, title: "Transferler", lead: "Havalimanı ve şehirler arası özel transfer.", limit: 6, body: "" },
  { id: "visa", kind: "visa", enabled: true, title: "Vize hizmetleri", lead: "", limit: 6, body: "" },
  { id: "about", kind: "about", enabled: true, title: "Yerel ekip, özenle seçilmiş deneyimler.", lead: "", limit: 6, body: "" },
  { id: "reasons", kind: "reasons", enabled: true, title: "Neden biz?", lead: "", limit: 6, body: "Yerel ekip\nGöreme, Çeşme ve Bodrum'da kendi ofislerimiz; telefonun ucunda her saat insan var.\n\nEsnek iptal\nTurlarda 24 saat öncesine kadar ücretsiz iptal, tam iade.\n\nKüçük grup\nTurlarda en fazla 15 kişilik gruplarla geziyoruz." },
  { id: "faq", kind: "faq", enabled: true, title: "Sıkça sorulan sorular", lead: "", limit: 6, body: "Rezervasyonum ne zaman kesinleşir?\nTalebiniz anında bir referans numarasıyla açılır; kontenjanı doğrular ve onayı genellikle aynı gün e-postayla iletiriz.\n\nİptal etmek istersem ne olur?\nHer deneyimin iptal koşulu ürün sayfasında yazar. Ücretsiz iptal süresi içinde iptal ederseniz ödemenizin tamamı iade edilir.\n\nVoucher'ımı nasıl kullanırım?\nOnaydan sonra e-postanıza gelen mobil voucher'ı buluşma noktasında telefonunuzdan göstermeniz yeterli.\n\nGrup ya da özel tur talebim var.\nKalabalık gruplar ve kişiye özel programlar için bize telefonla ya da e-postayla ulaşın; size özel teklif hazırlayalım." },
  { id: "contact", kind: "contact", enabled: true, title: "İletişim", lead: "", limit: 6, body: "" },
];
const config = {
  version: 1,
  theme: { brand: "seyyah", header: "light", radius: "soft", hero: "split", trustBadges: ["24 saate kadar ücretsiz iptal", "Küçük grup, en fazla 15 kişi"] },
  nav: { ...(draft.nav ?? {}), links: draft.nav?.links ?? [], showCart: true, showSignIn: false, announcement: "Ekim boyunca balon turlarında erken rezervasyona %10 indirim." },
  footer: { note: "Turizm & Seyahat", instagram: draft.footer?.instagram ?? "", whatsapp: draft.footer?.whatsapp ?? "", showTursab: true },
  seo: { title: `${tenant.name} — turlar, tekne ve villa kiralama`, description: "Kapadokya balon turları, Ege tekne turları, villa kiralama ve vize hizmetleri; doğrudan acenteden." },
  pages: {
    iptalIade: "# İptal ve iade\nTurlarda kalkışa 24 saat kalana kadar ücretsiz iptal; sonrasında iade yapılmaz.\n\nTekne ve villa kiralamalarında 7 gün öncesine kadar tam iade, 3 güne kadar %50 iade.\n\nHava koşulları nedeniyle acente tarafından iptal edilen hizmetlerde ücretin tamamı iade edilir.",
    kvkk: "# KVKK aydınlatma metni\nRezervasyon için ad soyad, e-posta ve telefon bilgisi işlenir. Kart bilgileri sistemimize kaydedilmez.\n\nKatılımcı bilgileri yalnızca hizmeti yürüten ekibe, hizmetin gerçekleşmesi için gereken kadarıyla aktarılır.\n\nVerilerinize erişme, düzeltme ve silme talepleriniz için iletişim sayfasındaki e-posta adresine yazabilirsiniz.",
  },
  sections,
};
must(await db.from("tenant_site").upsert({ tenant_id: T, draft: config, published: config, published_at: new Date().toISOString() }, { onConflict: "tenant_id" }), "site yayın");
console.log("Profil ve site yapısı yayınlandı.");
console.log("Bitti.");
