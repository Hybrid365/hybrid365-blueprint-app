/**
 * Capture Batch 1 Home D visual chrome (lab preview + foundations).
 * Requires: npm run dev on VS_SHOT_URL (default :3456)
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE =
  process.env.VS_SHOT_URL ?? "http://127.0.0.1:3456/dev/visual-system";
const OUT = "docs/qa/visual-system/screenshots/v0-batch-1";

mkdirSync(OUT, { recursive: true });

async function hideChrome(page: import("playwright").Page) {
  await page.addStyleTag({
    content:
      "nextjs-portal, [data-nextjs-toast], [data-nextjs-dev-overlay], [data-environment-badge] { display: none !important; }",
  });
}

async function main() {
  const browser = await chromium.launch();

  {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    const res = await page.goto(BASE, { waitUntil: "networkidle" });
    if (!res?.ok()) throw new Error(`Lab ${BASE} → ${res?.status()}`);
    await page.locator('[data-lab="home-d-visual-preview"]').waitFor();
    await hideChrome(page);
    const preview = page.locator('[data-lab="home-d-visual-preview"]');
    await preview.scrollIntoViewIfNeeded();
    await preview.screenshot({ path: `${OUT}/mobile-today-multi-session.png` });
    console.log("wrote mobile-today-multi-session.png");

    await preview.locator('[data-home-d-day="d0"]').click();
    await page.waitForTimeout(200);
    await preview.screenshot({ path: `${OUT}/mobile-completed.png` });
    console.log("wrote mobile-completed.png");

    await preview.locator('[data-home-d-day="d1"]').click();
    await page.waitForTimeout(200);
    await preview.screenshot({ path: `${OUT}/mobile-partial.png` });
    console.log("wrote mobile-partial.png");

    await preview.locator('[data-home-d-day="d2"]').click();
    await page.waitForTimeout(200);
    await preview.screenshot({ path: `${OUT}/mobile-no-session.png` });
    console.log("wrote mobile-no-session.png");

    await preview.locator('[data-home-d-day="d4"]').click();
    await page.waitForTimeout(200);
    await preview.screenshot({ path: `${OUT}/mobile-timeline-visible.png` });
    console.log("wrote mobile-timeline-visible.png");

    await page.close();
  }

  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const res = await page.goto(BASE, { waitUntil: "networkidle" });
    if (!res?.ok()) throw new Error(`Lab ${BASE} → ${res?.status()}`);
    await page.locator('[data-lab="home-d-visual-preview"]').waitFor();
    await hideChrome(page);
    const preview = page.locator('[data-lab="home-d-visual-preview"]');
    await preview.scrollIntoViewIfNeeded();
    await preview.screenshot({ path: `${OUT}/desktop-main-home.png` });
    console.log("wrote desktop-main-home.png");

    await preview.locator('[data-home-d-day="d2"]').click();
    await page.waitForTimeout(200);
    await preview.screenshot({ path: `${OUT}/desktop-alternate-day.png` });
    console.log("wrote desktop-alternate-day.png");

    await page.close();
  }

  await browser.close();
  console.log(`\nBatch 1 screenshots → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
