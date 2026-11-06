/**
 * Live staging: Mark complete → Home D COMPLETED + timeline proof.
 * CDP_URL=http://127.0.0.1:9222 LINK=<magic> BASE=http://127.0.0.1:3460 npx tsx scripts/qa-hyrox-home-d-completion-live.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "playwright";

const BASE = process.env.BASE || "http://127.0.0.1:3460";
const CDP = process.env.CDP_URL || "http://127.0.0.1:9222";
const LINK = process.env.LINK;
const OUT = "docs/qa/visual-system/screenshots/v0-batch-1-p1-live";

mkdirSync(OUT, { recursive: true });
const notes: string[] = [];
function log(s: string) {
  console.log(s);
  notes.push(s);
}

async function bodyText(page: Page) {
  return page.locator("[data-home-d-live]").innerText().catch(async () => page.locator("body").innerText());
}

async function closeDrawer(page: Page) {
  const headerClose = page.locator('aside[role="dialog"] header button').first();
  if (await headerClose.count()) {
    await headerClose.click({ force: true }).catch(() => {});
  }
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(450);
  if (await page.locator('aside[role="dialog"]').count()) {
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(300);
  }
}

async function main() {
  const browser = await chromium.connectOverCDP(CDP);
  const context = browser.contexts()[0] || (await browser.newContext());
  let page =
    context.pages().find((p) => p.url().includes("127.0.0.1:3460") || p.url().includes("localhost:3460")) ||
    context.pages()[0] ||
    (await context.newPage());

  await page.setViewportSize({ width: 390, height: 844 });
  await closeDrawer(page);

  if (LINK) {
    await page.goto(LINK, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(1500);
  }
  if (!page.url().includes("/athlete/dashboard")) {
    await page.goto(`${BASE}/athlete/dashboard`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(1500);
  }

  log(`url=${page.url()}`);
  const homeD = await page.locator("[data-home-d-live]").count();
  const visual = await page.locator('[data-home-d-visual="v0-home-parity"], [data-home-d-visual="v0-batch-1"]').count();
  log(`homeD=${homeD} visual=${visual}`);
  if (!homeD) throw new Error("Home D not active for this athlete");

  const days = page.locator("[data-home-d-day]");
  log(`dayButtons=${await days.count()}`);

  // --- Timeline proof: Tuesday Threshold (seed SW) ---
  await days.nth(1).click();
  await page.waitForTimeout(500);
  const tueText = await bodyText(page);
  log(`tuesday_snip=${tueText.slice(0, 420).replace(/\n/g, " | ")}`);
  const timeline = await page.locator("[data-workout-timeline], [data-compact-workout-preview]").count();
  const timelineSeg = await page.locator('[data-timeline-segment], [data-segment-kind="work"], [data-segment-kind="recovery"]').count();
  log(`timeline_roots=${timeline} timeline_segments=${timelineSeg}`);
  await page.screenshot({ path: `${OUT}/mobile-timeline-tuesday.png`, fullPage: true });

  // Open drawer from timeline card — no interaction conflict
  const openTue = page.getByRole("button", { name: /Open session|Review session/i }).first();
  if (await openTue.count()) {
    await openTue.click();
    await page.waitForTimeout(800);
    const dialogs = await page.getByRole("dialog").count();
    // SessionDrawer may use aside without dialog role — fall back to close button
    const closeBtn = page.getByRole("button", { name: /Close session/i });
    log(`drawer_from_timeline dialogs=${dialogs} close=${await closeBtn.count()}`);
    await page.screenshot({ path: `${OUT}/mobile-timeline-drawer-open.png`, fullPage: true });
    await closeDrawer(page);
  }

  // --- Mark complete flow: Friday Hybrid Engine (upcoming) ---
  await days.nth(4).click();
  await page.waitForTimeout(500);
  const before = await bodyText(page);
  log(`friday_before=${before.slice(0, 360).replace(/\n/g, " | ")}`);
  await page.screenshot({ path: `${OUT}/mobile-before-mark-complete.png`, fullPage: true });

  const openFri = page.getByRole("button", { name: /Open session|Review session/i }).first();
  if (!(await openFri.count())) throw new Error("No Open session on Friday");
  await openFri.click();
  await page.waitForTimeout(900);

  const mark = page.getByRole("button", { name: /^Mark complete$/i });
  if (!(await mark.count())) throw new Error("Mark complete button missing");
  log(`mark_complete_enabled=${await mark.isEnabled()}`);
  await mark.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/mobile-drawer-after-mark-complete.png`, fullPage: true });

  await closeDrawer(page);
  await page.waitForTimeout(1500);

  // Ensure still on Friday
  await days.nth(4).click();
  await page.waitForTimeout(600);
  const after = await bodyText(page);
  log(`friday_after=${after.slice(0, 420).replace(/\n/g, " | ")}`);
  const completedVisible = /COMPLETED/i.test(after);
  const stillUpcoming = /UPCOMING/i.test(after) && !completedVisible;
  log(`friday_completed_visible=${completedVisible} still_upcoming=${stillUpcoming}`);
  await page.screenshot({ path: `${OUT}/mobile-after-home-refresh.png`, fullPage: true });

  // Optional: partial via Save log + modifications on Saturday (do not Mark complete)
  await days.nth(5).click();
  await page.waitForTimeout(500);
  const openSat = page.getByRole("button", { name: /Open session|Review session/i }).first();
  if (await openSat.count()) {
    await openSat.click();
    await page.waitForTimeout(700);
    const logBtn = page.getByRole("button", { name: /^Log session$/i });
    if (await logBtn.count()) {
      await logBtn.click();
      await page.waitForTimeout(400);
      const mods = page.locator('textarea, input').filter({ hasText: /modif/i });
      // Prefer labeled modifications field
      const modField = page.getByLabel(/modification/i).or(page.locator('textarea').nth(1));
      if (await page.getByLabel(/Modifications/i).count()) {
        await page.getByLabel(/Modifications/i).fill("Dropped last km — staging partial");
      } else if (await page.locator("textarea").count() >= 2) {
        await page.locator("textarea").nth(1).fill("Dropped last km — staging partial");
      }
      const saveLog = page.getByRole("button", { name: /^Save log$/i });
      if (await saveLog.count()) {
        await saveLog.click();
        await page.waitForTimeout(1800);
      }
      await closeDrawer(page);
      await page.waitForTimeout(1200);
      await days.nth(5).click();
      await page.waitForTimeout(500);
      const sat = await bodyText(page);
      log(`saturday_after_save_log=${sat.slice(0, 360).replace(/\n/g, " | ")}`);
      log(`saturday_partial=${/PARTIAL/i.test(sat)}`);
      await page.screenshot({ path: `${OUT}/mobile-after-partial-save-log.png`, fullPage: true });
    }
  }

  writeFileSync(`${OUT}/qa-notes.txt`, notes.join("\n") + "\n");
  await browser.close().catch(() => {});
  console.log(`\nShots → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
