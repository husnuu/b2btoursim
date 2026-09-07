/**
 * Performans ve erişilebilirlik bütçesi.
 *
 * Bağlam dokümanı Bölüm 8'deki hedefleri tekrarlanabilir bir ölçüme çevirir ve
 * bütçe aşılırsa sıfırdan farklı kodla çıkar — CI'da bu, birleştirmeyi durdurur.
 * Bir performans hedefi ancak kırıldığında haber veriyorsa hedeftir.
 *
 * Kullanım:  node scripts/budget.mjs [taban-url]
 * Gereken:   uygulama üretim modunda ayakta (npm run build && npm start)
 */

import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const BASE = process.argv[2] ?? "http://localhost:3100";
const require = createRequire(import.meta.url);

// Tipik 4G: ~9 Mbps, 85 ms gidiş-dönüş. Mobilde CPU 4 kat yavaşlatılır.
const NET_4G = {
  offline: false,
  downloadThroughput: (9 * 1024 * 1024) / 8,
  uploadThroughput: (9 * 1024 * 1024) / 8,
  latency: 85,
};

/** Bölüm 8 tablosu, ölçülebilir hale getirilmiş hali. */
const BUDGETS = [
  { name: "B2C mağaza",        path: "/magaza",          mobile: true,  lcp: 2500, cls: 0.1, kb: 450 },
  { name: "B2C ürün",          path: "/magaza/p-balon",  mobile: true,  lcp: 2500, cls: 0.1, kb: 450 },
  { name: "Tanıtım sayfası",   path: "/",                mobile: true,  lcp: 2500, cls: 0.1, kb: 450 },
  { name: "Extranet iskeleti", path: "/extranet",        mobile: false, lcp: 1000, cls: 0.1, kb: 460 },
  { name: "Admin genel bakış", path: "/admin",           mobile: false, lcp: 1200, cls: 0.1, kb: 460 },
  { name: "Rezervasyonlar",    path: "/extranet/rezervasyonlar", mobile: false, lcp: 1500, cls: 0.1, kb: 450 },
];

const SEARCH_BUDGET = { iskelet: 1000, ilkSonuc: 3000 };
const SCROLL_BUDGET = { p95FrameMs: 20, domRows: 80 };
const A11Y_BUDGET = { violations: 0 };

const VITALS_INIT = `
window.__v = { lcp: 0, cls: 0 };
new PerformanceObserver(l => { for (const e of l.getEntries()) window.__v.lcp = e.startTime; })
  .observe({ type: 'largest-contentful-paint', buffered: true });
new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__v.cls += e.value; })
  .observe({ type: 'layout-shift', buffered: true });
`;

const failures = [];
const rows = [];

function check(label, actual, limit, unit, lowerIsBetter = true) {
  const ok = lowerIsBetter ? actual <= limit : actual >= limit;
  if (!ok) failures.push(`${label}: ${actual}${unit} (bütçe ${limit}${unit})`);
  return ok ? "geçti" : "AŞILDI";
}

async function newCtx(browser, mobile) {
  const ctx = await browser.newContext(
    mobile
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
      : { viewport: { width: 1440, height: 900 } },
  );
  const page = await ctx.newPage();
  await page.addInitScript(VITALS_INIT);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", NET_4G);
  if (mobile) await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  return { ctx, page, cdp };
}

// Yerelde kurulu Chrome, CI'da playwright'ın indirdiği chromium kullanılır.
async function launch() {
  try {
    return await chromium.launch({ channel: "chrome" });
  } catch {
    return await chromium.launch();
  }
}

const browser = await launch();

// --- 1. Sayfa bütçeleri --------------------------------------------------
for (const b of BUDGETS) {
  const { ctx, page, cdp } = await newCtx(browser, b.mobile);
  let bytes = 0;
  cdp.on("Network.loadingFinished", (e) => { bytes += e.encodedDataLength; });

  await page.goto(BASE + b.path, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const v = await page.evaluate(() => window.__v);
  const kb = Math.round(bytes / 1024);
  await ctx.close();

  rows.push({
    sayfa: b.name,
    lcp: `${Math.round(v.lcp)}ms ${check(`${b.name} LCP`, Math.round(v.lcp), b.lcp, "ms")}`,
    cls: `${v.cls.toFixed(3)} ${check(`${b.name} CLS`, +v.cls.toFixed(3), b.cls, "")}`,
    transfer: `${kb}KB ${check(`${b.name} transfer`, kb, b.kb, "KB")}`,
  });
}

// --- 2. Kademeli arama ---------------------------------------------------
{
  const { ctx, page } = await newCtx(browser, false);
  const t0 = Date.now();
  await page.goto(BASE + "/extranet/arama/tur?nereye=Kapadokya&tarih=2026-09-18", { waitUntil: "commit" });
  await page.waitForSelector('[aria-busy="true"], table tbody tr', { timeout: 20000 });
  const iskelet = Date.now() - t0;
  await page.waitForSelector("table tbody tr", { timeout: 20000 });
  const ilkSonuc = Date.now() - t0;
  await ctx.close();

  rows.push({
    sayfa: "Arama akışı",
    lcp: `iskelet ${iskelet}ms ${check("Arama iskeleti", iskelet, SEARCH_BUDGET.iskelet, "ms")}`,
    cls: `ilk sonuç ${ilkSonuc}ms ${check("İlk tedarikçi sonucu", ilkSonuc, SEARCH_BUDGET.ilkSonuc, "ms")}`,
    transfer: "—",
  });
}

// --- 3. 500 satırda kaydırma --------------------------------------------
{
  const { ctx, page } = await newCtx(browser, false);
  await page.goto(BASE + "/extranet/rezervasyonlar", { waitUntil: "load" });
  await page.waitForTimeout(700);
  const s = await page.evaluate(async () => {
    const el = document.querySelector('[role="grid"] .overflow-y-auto');
    if (!el) return null;
    const frames = [];
    let last = performance.now(), running = true;
    const tick = () => { const n = performance.now(); frames.push(n - last); last = n; if (running) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    for (let i = 0; i < 120; i++) { el.scrollTop += 160; await new Promise(r => requestAnimationFrame(r)); }
    running = false;
    const f = frames.slice(5).sort((a, b) => a - b);
    return { p95: +f[Math.floor(f.length * 0.95)].toFixed(2), rows: document.querySelectorAll('[role="row"]').length };
  });
  await ctx.close();

  if (!s) failures.push("Kaydırma ölçümü: sanallaştırılmış kap bulunamadı");
  else rows.push({
    sayfa: "500 satır kaydırma",
    lcp: `p95 kare ${s.p95}ms ${check("Kaydırma p95", s.p95, SCROLL_BUDGET.p95FrameMs, "ms")}`,
    cls: `DOM satırı ${s.rows} ${check("DOM satır sayısı", s.rows, SCROLL_BUDGET.domRows, "")}`,
    transfer: "—",
  });
}

// --- 4. Erişilebilirlik --------------------------------------------------
{
  const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
  const routes = [
    ["Tanıtım", "/"], ["Giriş", "/giris"],
    ["B2C mağaza", "/magaza"], ["B2C arama", "/magaza/tur-arama"], ["B2C ürün", "/magaza/p-balon"],
    ["B2C sepet", "/magaza/sepet"], ["B2C KVKK", "/magaza/kvkk"],
    ["Extranet ana sayfa", "/extranet"], ["Extranet arama", "/extranet/arama"],
    ["Tur sonuçları", "/extranet/arama/tur?nereye=Kapadokya&tarih=2026-09-18"],
    ["Otel sonuçları", "/extranet/arama/otel?nereye=Kapadokya&tarih=2026-10-12"],
    ["Extranet ürün", "/extranet/urun/p-balon"], ["Rezervasyonlar", "/extranet/rezervasyonlar"],
    ["Rezervasyon detay", "/extranet/rezervasyonlar/KNT-24081"],
    ["Bakiye", "/extranet/bakiye"], ["Ekstre", "/extranet/ekstre"],
    ["Kullanıcılar", "/extranet/ayarlar"], ["Sepet", "/extranet/sepet"],
    ["Admin genel bakış", "/admin"], ["Admin kiracılar", "/admin/kiracilar"],
    ["Admin onboarding", "/admin/kiracilar/yeni"], ["Admin tedarikçiler", "/admin/tedarikciler"],
    ["Admin API anahtarları", "/admin/api-anahtarlari"], ["Admin roller", "/admin/roller"],
  ];
  let total = 0;
  console.log("\n## Erişilebilirlik (axe-core, WCAG 2.1 A + AA)\n");
  for (const [name, path] of routes) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + path, { waitUntil: "load" });
    await page.waitForTimeout(path.includes("arama/") ? 8000 : 900);
    await page.evaluate(axeSource);
    const r = await page.evaluate(async () =>
      window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }),
    );
    total += r.violations.length;
    const nodes = r.violations.reduce((a, v) => a + v.nodes.length, 0);
    console.log(`  ${r.violations.length === 0 ? "temiz " : "İHLAL "} ${name.padEnd(22)} ${r.violations.length} tür, ${nodes} düğüm`);
    for (const v of r.violations) console.log(`         [${v.impact}] ${v.id}: ${v.help}`);
    await page.close();
  }
  check("Erişilebilirlik ihlali", total, A11Y_BUDGET.violations, " tür");
}

await browser.close();

console.log("\n## Performans bütçesi\n");
console.table(rows);

if (failures.length) {
  console.error("\nBÜTÇE AŞILDI:\n" + failures.map((f) => "  - " + f).join("\n") + "\n");
  process.exit(1);
}
console.log("\nTüm bütçeler geçti.\n");
