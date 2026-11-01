/**
 * Quick viewport screenshot of one URL (for side-by-side checks while building).
 *
 *   npx tsx scripts/shot.ts <url> <width> <out.png> [waitMs=3000] [scrollY=0] [height=900]
 */
import { chromium } from "playwright-core";

async function main() {
  const [url, width, out, wait = "3000", scrollY = "0", height = "900"] = process.argv.slice(2);
  const browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
  await page.goto(url, { waitUntil: "load", timeout: 120_000 });
  if (Number(scrollY) > 0) {
    await page.mouse.wheel(0, Number(scrollY));
  }
  await page.waitForTimeout(Number(wait));
  await page.screenshot({ path: out });
  await browser.close();
}

main();
