/**
 * SessionDrawer visual bridge shots — Demo Competitive @ localhost:3473
 */
import { chromium, devices } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.DRAWER_SHOT_URL ?? "http://localhost:3473";
const EMAIL = "demo.competitive@hybrid365.test";
const PASSWORD = "Hybrid365-Staging-Demo!";
const OUT = "docs/qa/visual-system/screenshots/v0-session-drawer";
mkdirSync(OUT, { recursive: true });

async function login(page: import("playwright").Page) {
  await page.goto(`${BASE}/athlete/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator('input[type="email"]').last().fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /Sign in as Demo Competitive/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/athlete/login"), { timeout: 45000 });
  await page.waitForTimeout(1200);
}

async function openDrawerFromHome(page: import("playwright").Page) {
  await page.goto(`${BASE}/athlete/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-athlete-shell], [data-home-d-live]", { timeout: 30000 });
  await page.waitForTimeout(1500);
  const cta = page.getByRole("button", { name: /Open session|Review session/i }).first();
  if ((await cta.count()) < 1) {
    // Rest day / no primary CTA — open via programme instead
    throw new Error("no Home session CTA");
  }
  await cta.click();
  await page.waitForSelector('[data-session-drawer="v0"]', { timeout: 15000 });
}

async function main() {
  const browser = await chromium
    .launch({ channel: "chrome", headless: true })
    .catch(() => chromium.launch({ headless: true }));

  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const page = await ctx.newPage();
    await login(page);
    await openDrawerFromHome(page);
    await page.screenshot({ path: `${OUT}/desktop-home-drawer.png` });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    await page.goto(`${BASE}/athlete/programme`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-programme-visual="v0-parity"]', { timeout: 25000 });
    await page.locator("[data-programme-session]").first().click();
    await page.waitForSelector('[data-session-drawer="v0"]', { timeout: 15000 });
    await page.screenshot({ path: `${OUT}/desktop-programme-drawer.png` });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    await page.setViewportSize({ width: 1280, height: 900 });
    await openDrawerFromHome(page);
    await page.screenshot({ path: `${OUT}/desktop-1280-drawer.png` });
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 1024, height: 900 });
    await openDrawerFromHome(page);
    await page.screenshot({ path: `${OUT}/desktop-1024-drawer.png` });
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({
      ...devices["iPhone 12"],
      viewport: { width: 390, height: 844 },
    });
    const page = await ctx.newPage();
    await login(page);
    await openDrawerFromHome(page);
    await page.screenshot({ path: `${OUT}/mobile-390-drawer.png` });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: `${OUT}/mobile-375-drawer.png` });
    await page.setViewportSize({ width: 430, height: 932 });
    await page.screenshot({ path: `${OUT}/mobile-430-drawer.png` });
    await ctx.close();
  }

  await browser.close();
  console.log("session_drawer_shots_ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
