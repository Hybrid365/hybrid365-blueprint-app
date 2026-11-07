/**
 * Performance visual QA — Demo Competitive @ localhost
 */
import { chromium, devices } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.PERF_SHOT_URL ?? "http://localhost:3473";
const EMAIL = "demo.competitive@hybrid365.test";
const PASSWORD = "Hybrid365-Staging-Demo!";
const OUT = "docs/qa/visual-system/screenshots/v0-performance";
mkdirSync(OUT, { recursive: true });

async function login(page: import("playwright").Page) {
  await page.goto(`${BASE}/athlete/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator('input[type="email"]').last().fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  const btn = page.getByRole("button", { name: /Sign in as Demo Competitive/i });
  for (let i = 0; i < 30; i++) {
    if (await btn.isEnabled()) break;
    await page.waitForTimeout(200);
  }
  await btn.click();
  await page.waitForURL((url) => !url.pathname.includes("/athlete/login"), { timeout: 45000 });
  await page.waitForTimeout(1200);
}

async function gotoPerformance(page: import("playwright").Page) {
  await page.goto(`${BASE}/athlete/benchmarks`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-h365-performance-experience]", { timeout: 30000 });
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

    for (const path of ["/athlete/dashboard", "/athlete/programme", "/athlete/progress", "/athlete/benchmarks"]) {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(900);
      const slug = path.split("/").pop();
      await page.screenshot({ path: `${OUT}/continuity-${slug}-1440.png` });
    }

    await gotoPerformance(page);
    await page.screenshot({ path: `${OUT}/desktop-1440.png`, fullPage: true });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPerformance(page);
    await page.screenshot({ path: `${OUT}/desktop-1280.png`, fullPage: true });
    await page.setViewportSize({ width: 1024, height: 900 });
    await gotoPerformance(page);
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
    await gotoPerformance(page);
    await page.screenshot({ path: `${OUT}/mobile-${width}.png`, fullPage: true });
    await ctx.close();
  }

  await browser.close();
  console.log("performance_shots_ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
