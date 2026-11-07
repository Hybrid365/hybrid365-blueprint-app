/**
 * Progress visual QA shots — Demo Competitive @ localhost
 */
import { chromium, devices } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.PROGRESS_SHOT_URL ?? "http://localhost:3473";
const EMAIL = "demo.competitive@hybrid365.test";
const PASSWORD = "Hybrid365-Staging-Demo!";
const OUT = "docs/qa/visual-system/screenshots/v0-progress";
mkdirSync(OUT, { recursive: true });

async function login(page: import("playwright").Page) {
  await page.goto(`${BASE}/athlete/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator('input[type="email"]').last().fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /Sign in as Demo Competitive/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/athlete/login"), { timeout: 45000 });
  await page.waitForTimeout(1200);
}

async function gotoProgress(page: import("playwright").Page) {
  await page.goto(`${BASE}/athlete/progress`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(
    "[data-h365-progress-experience], [data-h365-progress-fallback], [data-athlete-shell]",
    { timeout: 30000 }
  );
  await page.waitForTimeout(900);
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
    await page.waitForSelector("[data-athlete-shell], [data-home-d-live]", { timeout: 30000 });
    await page.screenshot({ path: `${OUT}/continuity-home-1440.png` });

    await page.goto(`${BASE}/athlete/programme`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-programme-visual="v0-parity"], [data-athlete-shell]', {
      timeout: 30000,
    });
    await page.screenshot({ path: `${OUT}/continuity-programme-1440.png` });

    await gotoProgress(page);
    await page.screenshot({ path: `${OUT}/desktop-1440.png`, fullPage: true });

    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoProgress(page);
    await page.screenshot({ path: `${OUT}/desktop-1280.png`, fullPage: true });

    await page.setViewportSize({ width: 1024, height: 900 });
    await gotoProgress(page);
    await page.screenshot({ path: `${OUT}/desktop-1024.png`, fullPage: true });
    await ctx.close();
  }

  for (const width of [430, 390, 375] as const) {
    const ctx = await browser.newContext({
      ...devices["iPhone 12"],
      viewport: { width, height: width === 430 ? 932 : width === 390 ? 844 : 812 },
    });
    const page = await ctx.newPage();
    await login(page);
    await gotoProgress(page);
    await page.screenshot({ path: `${OUT}/mobile-${width}.png`, fullPage: true });
    await ctx.close();
  }

  await browser.close();
  console.log("progress_shots_ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
