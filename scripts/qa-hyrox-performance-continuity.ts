/**
 * Home → Programme → Progress → Performance continuity.
 */
import { chromium } from "playwright";

const BASE = process.env.PERF_SHOT_URL ?? "http://localhost:3473";
const EMAIL = "demo.competitive@hybrid365.test";
const PASSWORD = "Hybrid365-Staging-Demo!";

async function main() {
  const browser = await chromium
    .launch({ channel: "chrome", headless: true })
    .catch(() => chromium.launch({ headless: true }));
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  await page.goto(`${BASE}/athlete/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').last().fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  const btn = page.getByRole("button", { name: /Sign in as Demo Competitive/i });
  for (let i = 0; i < 30; i++) {
    if (await btn.isEnabled()) break;
    await page.waitForTimeout(200);
  }
  await btn.click();
  await page.waitForURL((url) => !url.pathname.includes("/athlete/login"), { timeout: 45000 });
  await page.waitForTimeout(800);

  const paths = [
    "/athlete/dashboard",
    "/athlete/programme",
    "/athlete/progress",
    "/athlete/benchmarks",
  ] as const;

  for (const path of paths) {
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1100);
    const title = (await page.locator("h1").first().textContent())?.trim() ?? "";
    const perf = await page.locator("[data-h365-performance-experience]").count();
    const progress = await page.locator("[data-h365-progress-experience]").count();
    console.log(JSON.stringify({ path, title, perf, progress }));
    if (path === "/athlete/benchmarks") {
      await page.waitForSelector("[data-h365-performance-experience]", { timeout: 20000 });
      const perfReady = await page.locator("[data-h365-performance-experience]").count();
      if (perfReady < 1) throw new Error("Performance experience missing — is profile flag on?");
      if (progress > 0) throw new Error("Progress leaked onto Performance");
    }
  }

  await browser.close();
  console.log("performance_continuity_ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
