/**
 * Smoke test for the homepage's interactive parts (run against `npm run dev`).
 *   npx tsx scripts/check-home.ts
 */
import { chromium } from "playwright-core";
import { TARGETS } from "./shared";

async function main() {
  const browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto(TARGETS.local + "/", { waitUntil: "load" });

  // 1. Fade-in headings become visible after scrolling past them.
  // Scroll until the bottom of the page is reached.
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < pageHeight + 900; y += 300) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(1500);
  const hiddenLocator = page.locator("[class*='FadeInUp-module'][class*='hidden']");
  const hiddenFadeIns = await hiddenLocator.allInnerTexts();

  // 2. FAQ: open first item, then third (first must close).
  const q1 = page.getByRole("button", { name: "Where is Mocean Beach Resort?" });
  const q3 = page.getByRole("button", { name: "How much does a room cost?" });
  await q1.scrollIntoViewIfNeeded();
  await q1.click();
  await page.waitForTimeout(600);
  const panel1 = page.locator(`#${(await q1.getAttribute("aria-controls"))!.replace(/:/g, "\\:")}`);
  const openHeight = (await panel1.boundingBox())?.height ?? 0;
  await q3.click();
  await page.waitForTimeout(600);
  const closedHeight = (await panel1.boundingBox())?.height ?? 0;

  console.log({ hiddenFadeIns, faqOpenHeight: Math.round(openHeight), faqAfterOtherOpened: Math.round(closedHeight), errors });
  await browser.close();
}

main();
