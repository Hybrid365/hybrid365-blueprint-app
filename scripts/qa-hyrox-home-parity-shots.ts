/**
 * Home full v0 parity screenshots — Demo Competitive on local next :3473.
 */
import { chromium, devices } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.HOME_PARITY_URL ?? "http://localhost:3473";
const EMAIL = "demo.competitive@hybrid365.test";
const PASSWORD = "Hybrid365-Staging-Demo!";
const OUT = "docs/qa/visual-system/screenshots/v0-home-parity";
mkdirSync(OUT, { recursive: true });

async function login(page: import("playwright").Page) {
  await page.goto(`${BASE}/athlete/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator('input[type="email"]').last().fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /Sign in as Demo Competitive/i }).click();
  await page.waitForURL(/\/athlete(\/|$)/, { timeout: 45000 });
  await page.waitForTimeout(1000);
  if (!page.url().includes("/athlete/dashboard")) {
    await page.goto(`${BASE}/athlete/dashboard`, { waitUntil: "domcontentloaded" });
  }
  await page.waitForSelector("[data-home-d-live]", { timeout: 25000 });
  await page.waitForTimeout(800);
}

async function main() {
  const browser = await chromium
    .launch({ channel: "chrome", headless: true })
    .catch(() => chromium.launch({ headless: true }));

  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const page = await ctx.newPage();
    await login(page);
    if ((await page.locator('[data-home-d-visual="v0-home-parity"]').count()) < 1) {
      throw new Error("home parity marker missing");
    }
    if ((await page.locator("[data-athlete-desktop-rail]").count()) < 1) {
      throw new Error("desktop rail missing");
    }
    // No mobile top strip on desktop chrome path — rail owns account.
    await page.screenshot({ path: `${OUT}/desktop-1440-home.png`, fullPage: true });
    await page.locator("[data-home-d-primary], [data-home-d-session]").first().screenshot({
      path: `${OUT}/desktop-hero-session.png`,
    }).catch(() => undefined);
    const insights = page.locator("[data-home-d-insights]").locator("visible=true").first();
    if (await insights.count()) {
      await insights.screenshot({ path: `${OUT}/desktop-insights.png` }).catch(() => undefined);
    }
    const timeline = page.locator("[data-compact-workout-preview]").locator("visible=true").first();
    if (await timeline.count()) {
      await timeline.screenshot({ path: `${OUT}/desktop-timeline.png` }).catch(() => undefined);
    }
    await page
      .locator("[data-home-d-week-selector]")
      .screenshot({ path: `${OUT}/desktop-week-strip.png` })
      .catch(() => undefined);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: `${OUT}/desktop-1280-home.png` });
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.screenshot({ path: `${OUT}/desktop-1024-home.png` });

    // Auth persistence quick check
    await page.goto(`${BASE}/athlete/programme`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.goto(`${BASE}/athlete/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-home-d-live]", { timeout: 20000 });
    if (!page.url().includes("/athlete")) throw new Error("auth lost after nav");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-home-d-live]", { timeout: 20000 });
    await page.screenshot({ path: `${OUT}/desktop-home-after-refresh.png` });
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({
      ...devices["iPhone 12"],
      viewport: { width: 390, height: 844 },
    });
    const page = await ctx.newPage();
    await login(page);
    // Canonical: bottom nav visible, no mobile top wordmark strip when nav on
    if (!(await page.locator("[data-athlete-mobile-nav]").isVisible())) {
      throw new Error("mobile bottom nav missing");
    }
    const topStrip = page.locator("text=Sign out").first();
    // Sign out may exist in More sheet only — should not be a sticky top strip with Hybrid365
    const stickyTopWordmark = page.locator(
      ".lg\\:hidden.sticky:has-text('Hybrid365'):has-text('Sign out')"
    );
    if (await stickyTopWordmark.isVisible().catch(() => false)) {
      throw new Error("mobile top wordmark/sign-out strip still present");
    }
    void topStrip;
    await page.screenshot({ path: `${OUT}/mobile-390-home.png`, fullPage: true });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: `${OUT}/mobile-375-home.png`, fullPage: true });
    await page.setViewportSize({ width: 430, height: 932 });
    await page.screenshot({ path: `${OUT}/mobile-430-home.png`, fullPage: true });
    await ctx.close();
  }

  // Capture original v0 concept for side-by-side (lab route if available)
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const page = await ctx.newPage();
    const labUrls = [
      `${BASE}/dev/visual-system`,
      `${BASE}/preview/athlete/home`,
    ];
    for (const url of labUrls) {
      const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => null);
      if (!res || res.status() >= 400) continue;
      await page.waitForTimeout(1200);
      const name = url.includes("preview") ? "review-fixture-home" : "lab-visual-system";
      await page.screenshot({ path: `${OUT}/v0-ref-${name}.png`, fullPage: true });
    }
    await ctx.close();
  }

  await browser.close();
  console.log("home_parity_shots_ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
