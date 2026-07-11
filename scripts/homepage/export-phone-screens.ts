#!/usr/bin/env npx tsx
/**
 * Export homepage phone screens at high DPR via Playwright.
 *
 * Renders live React screen components (not upscaled PNG crops) and saves
 * screen-area captures to public/homepage/ui-mockups/ + manifest.
 *
 * Usage: npm run export:homepage-phones
 * Requires: npm install -D playwright && npx playwright install chromium
 */

import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "public/homepage/ui-mockups");
const MANIFEST = path.join(ROOT, "app/lib/homepage/phoneScreenManifest.json");
const PORT = 3459;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DEVICE_SCALE = 3;
const VIEWPORT_WIDTH = 390;

const SCREEN_IDS = [
  "programme",
  "threshold-run",
  "progress-overview",
  "performance-testing",
  "hybrid365-team",
  "your-journey",
  "threshold-progression",
  "weekly-run-volume",
  "weight-tracking",
  "weekly-check-in",
  "team-athlete-overview",
] as const;

async function waitForServer(url: string, timeoutMs = 120_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await sleep(1000);
  }
  throw new Error(`Server did not become ready at ${url}`);
}

function startDevServer(): ChildProcess {
  return spawn("npm", ["run", "dev", "--", "-p", String(PORT)], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, PORT: String(PORT) },
  });
}

async function main() {
  const { chromium } = await import("playwright");
  await fs.mkdir(OUT_DIR, { recursive: true });

  const server = startDevServer();
  try {
    await waitForServer(`${BASE_URL}/internal/homepage-phone-export`);

    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: VIEWPORT_WIDTH, height: 900 },
      deviceScaleFactor: DEVICE_SCALE,
    });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/internal/homepage-phone-export`, {
      waitUntil: "networkidle",
    });

    const manifest: Record<string, { width: number; height: number }> = {};

    for (const id of SCREEN_IDS) {
      const locator = page.locator(`#export-${id}`);
      await locator.waitFor({ state: "visible" });
      const outPath = path.join(OUT_DIR, `${id}.png`);
      await locator.screenshot({ path: outPath, omitBackground: true });

      const box = await locator.boundingBox();
      if (!box) throw new Error(`No bounding box for ${id}`);
      manifest[id] = {
        width: Math.round(box.width * DEVICE_SCALE),
        height: Math.round(box.height * DEVICE_SCALE),
      };
      console.log(`${id}.png -> ${manifest[id].width}x${manifest[id].height}`);
    }

    await browser.close();
    await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`Wrote manifest -> ${path.relative(ROOT, MANIFEST)}`);
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
