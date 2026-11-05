/**
 * Capture Batch 0 v0 visual-system lab screenshots.
 * Requires: npm run dev (default http://127.0.0.1:3456/dev/visual-system)
 * Run: npx tsx scripts/qa-hyrox-visual-system-v0-shots.ts
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE =
  process.env.VS_SHOT_URL ?? "http://127.0.0.1:3456/dev/visual-system";
const OUT = "docs/qa/visual-system/screenshots/v0-batch-0";

mkdirSync(OUT, { recursive: true });

async function hideChrome(page: import("playwright").Page) {
  await page.addStyleTag({
    content:
      "nextjs-portal, [data-nextjs-toast], [data-nextjs-dev-overlay], [data-environment-badge] { display: none !important; }",
  });
}

async function scrollTo(page: import("playwright").Page, id: string) {
  await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
}

async function main() {
  const browser = await chromium.launch();

  // --- Mobile 390 ---
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const res = await page.goto(BASE, { waitUntil: "networkidle" });
    if (!res?.ok()) throw new Error(`Lab ${BASE} → ${res?.status()}`);
    await page.getByText("Athlete foundations").waitFor();
    await hideChrome(page);

    const lab = page.locator('[data-lab="v0-visual-system"]');
    await lab.scrollIntoViewIfNeeded();

    await scrollTo(page, "vs-typography");
    await page.locator("#vs-typography").screenshot({
      path: `${OUT}/mobile-foundations.png`,
    });
    console.log("wrote mobile-foundations.png");

    await scrollTo(page, "vs-date-nav");
    await page.locator("#vs-date-nav").screenshot({
      path: `${OUT}/mobile-date-nav.png`,
    });
    console.log("wrote mobile-date-nav.png");

    await scrollTo(page, "vs-session-cards");
    await page.locator("#vs-session-cards").screenshot({
      path: `${OUT}/mobile-session-cards.png`,
    });
    console.log("wrote mobile-session-cards.png");

    await scrollTo(page, "vs-repeat-timeline");
    await page.locator("#vs-repeat-timeline").screenshot({
      path: `${OUT}/mobile-repeat-timeline.png`,
    });
    console.log("wrote mobile-repeat-timeline.png");

    await page.getByRole("button", { name: /R02,/ }).click();
    await page.waitForTimeout(250);
    await page.locator("#vs-repeat-timeline").screenshot({
      path: `${OUT}/mobile-selected-interval.png`,
    });
    console.log("wrote mobile-selected-interval.png");

    await page.close();
  }

  // --- Desktop 1440 ---
  {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
    });
    const res = await page.goto(BASE, { waitUntil: "networkidle" });
    if (!res?.ok()) throw new Error(`Lab ${BASE} → ${res?.status()}`);
    await page.getByText("Athlete foundations").waitFor();
    await hideChrome(page);

    const lab = page.locator('[data-lab="v0-visual-system"]');
    await lab.scrollIntoViewIfNeeded();
    await lab.screenshot({ path: `${OUT}/desktop-visual-system-lab.png` });
    console.log("wrote desktop-visual-system-lab.png");

    await scrollTo(page, "vs-repeat-timeline");
    await page.locator("#vs-repeat-timeline").screenshot({
      path: `${OUT}/desktop-timeline-detail.png`,
    });
    console.log("wrote desktop-timeline-detail.png");

    await page.close();
  }

  await browser.close();
  console.log(`\nBatch 0 screenshots → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
