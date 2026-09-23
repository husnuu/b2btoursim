import { chromium } from "playwright";
const base = "http://localhost:3001";
const out = {};
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(`${base}/giris`);
  await page.fill('input[name="email"]', "probe-editor@example.com");
  await page.fill('input[name="password"]', "Probe-Editor-2026!x");
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith("/giris"), { timeout: 20000 });

  await page.goto(`${base}/extranet/site`);
  await page.waitForSelector('text=Bölümler', { timeout: 15000 });

  // add "reasons" section
  await page.locator('select').first().selectOption("reasons");
  await page.waitForTimeout(300);

  // fill its body
  const bodyLabel = page.getByText("Maddeler (başlık bir satır");
  await bodyLabel.waitFor({ timeout: 5000 });
  const textarea = page.locator("textarea").last();
  await textarea.fill("Yerel ekip\nGöreme ofisimizden, telefonu her saat bir insan açar.\n\nEsnek iptal\n24 saate kadar ücretsiz iptal, gizli ücret yok.\n\nKüçük grup\nEn fazla 16 kişilik gruplarla geziyoruz.");
  await page.keyboard.press("Tab");

  // fill trust badges in theme panel
  const trustArea = page.locator("textarea", { hasText: "" }).nth(0);
  // locate by label text near "Güven rozetleri"
  const trustLabel = page.getByText("Güven rozetleri");
  await trustLabel.waitFor({ timeout: 5000 });
  const trustTextarea = trustLabel.locator("..").locator("textarea");
  await trustTextarea.fill("24 saate kadar ücretsiz iptal\nKüçük grup, en fazla 16 kişi");
  await page.keyboard.press("Tab");

  await page.waitForTimeout(1500); // autosave debounce
  await page.getByText("Kaydedildi").first().waitFor({ timeout: 5000 }).catch(() => {});

  // publish
  await page.getByRole("button", { name: /Yayınla/ }).first().click();
  await page.waitForTimeout(2000);
  out.publishedText = await page.locator('[aria-live="polite"]').last().innerText().catch(() => "");

  console.log(JSON.stringify(out, null, 1));
  console.log("errors:", JSON.stringify(errors));
} catch (e) {
  console.log("FATAL", String(e).slice(0, 800));
  console.log(JSON.stringify(out, null, 1));
}
await browser.close();
