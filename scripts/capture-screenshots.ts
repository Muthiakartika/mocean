/**
 * Takes full-page screenshots of every URL at the five PRD viewports.
 *
 *   npx tsx scripts/capture-screenshots.ts original            -> live WordPress site
 *   npx tsx scripts/capture-screenshots.ts local               -> http://localhost:3000
 *   npx tsx scripts/capture-screenshots.ts local /pricing/     -> only one page
 *
 * Output: docs/screenshots/<target>/<viewport>/<slug>.png
 */
import { chromium, type Page } from "playwright-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { allPaths } from "../src/data/routes";
import { TARGETS, VIEWPORTS, slugOf, type TargetName } from "./shared";

/** Make screenshots comparable: run entrance animations, load lazy images, freeze motion. */
async function prepare(page: Page) {
  // Scroll down in steps so lazy images and scroll animations trigger.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.addStyleTag({
    content: `*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}
      #rt--preloader{display:none!important}`,
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(800);
}

async function main() {
  const targetName = (process.argv[2] ?? "original") as TargetName;
  const base = TARGETS[targetName];
  if (!base) throw new Error(`Unknown target "${targetName}". Use: ${Object.keys(TARGETS).join(", ")}`);
  const only = process.argv[3];
  const paths: readonly string[] = only ? [only] : allPaths;

  const browser = await chromium.launch({ channel: "msedge" });
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const outDir = path.join("docs", "screenshots", targetName, vp.name);
    await mkdir(outDir, { recursive: true });

    for (const p of paths) {
      try {
        await page.goto(base + p, { waitUntil: "load", timeout: 90_000 });
        await prepare(page);
        await page.screenshot({ path: path.join(outDir, `${slugOf(p)}.png`), fullPage: true });
        console.log(`ok   ${vp.name} ${p}`);
      } catch (err) {
        console.error(`fail ${vp.name} ${p}: ${(err as Error).message}`);
      }
    }
    await context.close();
  }
  await browser.close();
}

main();
