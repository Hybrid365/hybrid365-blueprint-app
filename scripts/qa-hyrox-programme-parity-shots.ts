/**
 * Programme v0 parity screenshots — Demo Competitive @ localhost:3473
 */
import { chromium, devices } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.PROGRAMME_PARITY_URL ?? "http://localhost:3473";
const EMAIL = "demo.competitive@hybrid365.test";
const PASSWORD = "Hybrid365-Staging-Demo!";
const OUT = "docs/qa/visual-system/screenshots/v0-programme-parity";
mkdirSync(OUT, { recursive: true });

async function login(page: import("playwright").Page) {
  await page.goto(`${BASE}/athlete/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator('input[type="email"]').last().fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /Sign in as Demo Competitive/i }).click();
  await page.waitForURL(/\/athlete(\/|$)/, { timeout: 45000 });
  await page.waitForTimeout(1000);
}

async function main() {
  const browser = await chromium
    .launch({ channel: "chrome", headless: true })
    .catch(() => chromium.launch({ headless: true }));

  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const page = await ctx.newPage();
    await login(page);
    await page.goto(`${BASE}/athlete/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-home-d-live]", { timeout: 25000 });
    await page.screenshot({ path: `${OUT}/desktop-home-before.png` });

    await page.goto(`${BASE}/athlete/programme`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-programme-visual="v0-parity"]', { timeout: 25000 });
    if ((await page.locator("[data-athlete-desktop-rail]").count()) < 1) {
      throw new Error("desktop rail missing on programme");
    }
    if ((await page.locator("[data-programme-week-chips]").count()) < 1) {
      throw new Error("week chips missing");
    }
    await page.screenshot({ path: `${OUT}/desktop-1440-programme.png`, fullPage: true });

    // Auth persistence: home → programme → home
    await page.goto(`${BASE}/athlete/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-home-d-live]", { timeout: 20000 });
    await page.goto(`${BASE}/athlete/programme`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-programme-visual="v0-parity"]', { timeout: 20000 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-programme-visual="v0-parity"]', { timeout: 20000 });
    if (!page.url().includes("/athlete/programme")) throw new Error("auth lost");
    await page.screenshot({ path: `${OUT}/desktop-programme-after-refresh.png`, fullPage: true });

    // Open first session drawer
    const openBtn = page.locator("[data-programme-session]").first();
    if (await openBtn.count()) {
      await openBtn.click();
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${OUT}/desktop-programme-drawer.png` });
      await page.keyboard.press("Escape").catch(() => undefined);
      await page.waitForTimeout(400);
    }

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: `${OUT}/desktop-1280-programme.png` });
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.screenshot({ path: `${OUT}/desktop-1024-programme.png` });
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({
      ...devices["iPhone 12"],
      viewport: { width: 390, height: 844 },
    });
    const page = await ctx.newPage();
    await login(page);
    await page.goto(`${BASE}/athlete/programme`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-programme-visual="v0-parity"]', { timeout: 25000 });
    if (!(await page.locator("[data-athlete-mobile-nav]").isVisible())) {
      throw new Error("mobile bottom nav missing");
    }
    await page.screenshot({ path: `${OUT}/mobile-390-programme.png`, fullPage: true });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: `${OUT}/mobile-375-programme.png`, fullPage: true });
    await page.setViewportSize({ width: 430, height: 932 });
    await page.screenshot({ path: `${OUT}/mobile-430-programme.png`, fullPage: true });
    await ctx.close();
  }

  await browser.close();
  console.log("programme_parity_shots_ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
