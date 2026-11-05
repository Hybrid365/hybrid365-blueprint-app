/** Reset stuck SessionDrawer in CDP before completion canary. */
import { chromium } from "playwright";

async function main() {
  const b = await chromium.connectOverCDP(process.env.CDP_URL || "http://127.0.0.1:9222");
  const ctx = b.contexts()[0];
  if (!ctx) throw new Error("no CDP context");
  const page =
    ctx.pages().find((p) => p.url().includes("3460")) || ctx.pages()[0] || (await ctx.newPage());
  await page.setViewportSize({ width: 390, height: 844 });
  const headerClose = page.locator('aside[role="dialog"] header button').first();
  if (await headerClose.count()) {
    await headerClose.click({ force: true });
    console.log("closed via header X");
  }
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(400);
  await page.goto("http://127.0.0.1:3460/athlete/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  console.log(
    JSON.stringify({
      url: page.url(),
      homeD: await page.locator("[data-home-d-live]").count(),
      dialogs: await page.locator('aside[role="dialog"]').count(),
    })
  );
  await b.close().catch(() => {});
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
