/**
 * Home → Programme → Progress continuity + Progress experience marker.
 */
import { chromium } from "playwright";

const BASE = process.env.PROGRESS_SHOT_URL ?? "http://localhost:3473";
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
  await page.getByRole("button", { name: /Sign in as Demo Competitive/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/athlete/login"), { timeout: 45000 });

  const paths = ["/athlete/dashboard", "/athlete/programme", "/athlete/progress"] as const;
  for (const path of paths) {
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1100);
    const title = (await page.locator("h1").first().textContent())?.trim() ?? "";
    const exp = await page.locator("[data-h365-progress-experience]").count();
    const fb = await page.locator("[data-h365-progress-fallback]").count();
    const hub = await page.getByText("Performance Hub", { exact: false }).count();
    console.log(JSON.stringify({ path, title, exp, fb, hub }));
    if (path === "/athlete/progress") {
      if (exp < 1 && fb < 1) throw new Error("Progress surface missing");
      if (hub > 0) throw new Error("Performance Hub leaked onto Progress");
    }
  }

  await browser.close();
  console.log("progress_continuity_ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
