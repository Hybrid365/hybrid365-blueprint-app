/**
 * Capture visual-lab direction concepts at 390 and 1440.
 * Requires the local app: PORT=3010 npm run dev
 * Run: npx tsx scripts/qa-hyrox-design-concept-shots.ts
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.CONCEPT_SHOT_URL ?? "http://localhost:3010/dev/visual-system";
const OUT = "docs/visual-qa/concepts";
const CONCEPTS = [
  "home-a",
  "home-b",
  "home-c",
  "session",
  "complete",
  "progress",
  "performance",
  "race",
] as const;

mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const width of [390, 1440] as const) {
    await page.setViewportSize({ width, height: width === 390 ? 1200 : 1100 });
    const res = await page.goto(BASE, { waitUntil: "domcontentloaded" });
    if (!res?.ok()) {
      throw new Error(`Lab ${BASE} returned ${res?.status()}`);
    }
    await page.getByText("Hybrid365 concepts").waitFor();
    await page.addStyleTag({
      content:
        "nextjs-portal, [data-nextjs-toast], [data-nextjs-dev-overlay], [data-environment-badge] { display: none !important; }",
    });

    for (const id of CONCEPTS) {
      await page.locator(`[data-concept-tab="${id}"]`).click();
      await page.locator(`[data-concept="${id}"]`).waitFor();
      if (id === "complete") {
        const save = page.getByRole("button", { name: "Save log" });
        if (await save.count()) await save.click();
      }
      const frame = page.locator("[data-concept-frame]");
      await frame.waitFor();
      await frame.screenshot({ path: `${OUT}/${id}-${width}.png` });
      console.log(`wrote ${OUT}/${id}-${width}.png`);
    }
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
