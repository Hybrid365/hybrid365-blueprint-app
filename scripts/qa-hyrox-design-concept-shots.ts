/**
 * Capture visual-lab direction concepts at 390 and 1440.
 * Requires the local app: PORT=3010 npm run dev
 * Run: npx tsx scripts/qa-hyrox-design-concept-shots.ts
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.CONCEPT_SHOT_URL ?? "http://localhost:3010/dev/visual-system";
const OUT = "docs/visual-qa/concepts";

const COACHED = [
  "coached-home",
  "coached-session",
  "coached-complete",
  "coached-progress",
  "coached-performance",
  "coached-race",
] as const;

const RESEARCH = [
  "home-a",
  "home-b",
  "home-c",
  "home-d",
  "session",
  "complete",
  "progress",
  "performance",
  "race",
] as const;

const CONCEPTS = [...COACHED, ...RESEARCH] as const;

mkdirSync(OUT, { recursive: true });

async function hideChrome(page: import("playwright").Page) {
  await page.addStyleTag({
    content:
      "nextjs-portal, [data-nextjs-toast], [data-nextjs-dev-overlay], [data-environment-badge] { display: none !important; }",
  });
}

async function shotFrame(page: import("playwright").Page, path: string) {
  const frame = page.locator("[data-concept-frame]");
  await frame.waitFor();
  await frame.screenshot({ path });
  console.log(`wrote ${path}`);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const width of [390, 1440] as const) {
    await page.setViewportSize({ width, height: width === 390 ? 1400 : 1200 });
    const res = await page.goto(BASE, { waitUntil: "domcontentloaded" });
    if (!res?.ok()) {
      throw new Error(`Lab ${BASE} returned ${res?.status()}`);
    }
    await page.getByText("Hybrid365 concepts").waitFor();
    await hideChrome(page);

    for (const id of CONCEPTS) {
      await page.locator(`[data-concept-tab="${id}"]`).click();
      await page.locator(`[data-concept="${id}"]`).waitFor();

      if (id.startsWith("coached-")) {
        await page.locator('[data-concept-state-tab="populated"]').click();
      }

      if (id === "complete" || id === "coached-complete") {
        const save = page.getByRole("button", { name: "Save log" });
        if (await save.count()) await save.click();
      }

      await shotFrame(page, `${OUT}/${id}-${width}.png`);
    }
  }

  // Coached empty + loading at 390
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.locator('[data-concept-tab="coached-home"]').click();
  await page.locator('[data-concept-state-tab="empty"]').click();
  await shotFrame(page, `${OUT}/coached-home-empty-390.png`);
  await page.locator('[data-concept-state-tab="loading"]').click();
  await shotFrame(page, `${OUT}/coached-home-loading-390.png`);

  await page.locator('[data-concept-tab="coached-progress"]').click();
  await page.locator('[data-concept-state-tab="empty"]').click();
  await shotFrame(page, `${OUT}/coached-progress-empty-390.png`);

  await page.locator('[data-concept-tab="coached-race"]').click();
  await page.locator('[data-concept-state-tab="empty"]').click();
  await shotFrame(page, `${OUT}/coached-race-empty-390.png`);

  // Coached complete form (pre-save) at 390
  await page.locator('[data-concept-tab="coached-complete"]').click();
  await page.locator('[data-concept-state-tab="populated"]').click();
  const back = page.getByRole("button", { name: "Back" });
  if (await back.count()) await back.click();
  await shotFrame(page, `${OUT}/coached-complete-form-390.png`);

  // Home D extras retained
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-concept-tab="home-d"]').click();
  await page.locator("[data-home-d]").waitFor();

  await page.locator('[data-home-d-day="wed"]').click();
  await shotFrame(page, `${OUT}/home-d-triple-390.png`);

  await page.locator('[data-home-d-day="sat"]').click();
  await shotFrame(page, `${OUT}/home-d-rest-390.png`);

  await page.locator('[data-home-d-day="fri"]').click();
  const scroll = page.locator("[data-home-d-scroll]");
  await scroll.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await shotFrame(page, `${OUT}/home-d-scrolled-390.png`);

  await scroll.evaluate((node) => {
    node.scrollTop = 0;
  });
  await page.locator('[data-home-d-session="fri-threshold"]').click();
  await page.locator("[data-home-d-drawer]").waitFor();
  await shotFrame(page, `${OUT}/home-d-drawer-390.png`);

  for (const width of [375, 430, 768] as const) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator('[data-concept-tab="home-d"]').click();
    const overflow = await page
      .locator("[data-home-d]")
      .evaluate((node) => node.scrollWidth > node.clientWidth + 1);
    if (overflow) throw new Error(`Home D overflows at ${width}`);
    console.log(`Home D no overflow at ${width}`);
  }

  await page.locator('[data-concept-tab="coached-home"]').click();
  await page.locator('[data-concept-state-tab="populated"]').click();
  for (const width of [375, 430, 768] as const) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page
      .locator("[data-coached-home]")
      .evaluate((node) => node.scrollWidth > node.clientWidth + 1);
    if (overflow) throw new Error(`Coached Home overflows at ${width}`);
    console.log(`Coached Home no overflow at ${width}`);
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
