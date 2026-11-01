/**
 * Smoke test for interactive parts of a migrated inner page (run against `npm run dev`):
 * tabs, accordion, lightbox, entrance animations, parallax, console errors.
 *   npx tsx scripts/check-inner.ts /accommodation/
 */
import { chromium } from "playwright-core";
import { TARGETS } from "./shared";

async function main() {
  const urlPath = process.argv[2] ?? "/accommodation/";
  const browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(TARGETS.local + urlPath, { waitUntil: "load", timeout: 120_000 });

  const report: Record<string, unknown> = {};

  // Scroll through the page (animations + parallax)
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height + 900; y += 300) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(1500);
  report.hiddenAnimations = await page.locator(".elementor-invisible").count();
  report.parallaxLayers = await page.locator(".jarallax-clip").count();

  // Tabs: click the second tab of the first tab widget
  const tabs = page.locator(".e-n-tabs").first();
  if ((await tabs.count()) > 0) {
    const second = tabs.locator(".e-n-tab-title").nth(1);
    await second.scrollIntoViewIfNeeded();
    await second.click();
    await page.waitForTimeout(300);
    report.tabSelected = await second.getAttribute("aria-selected");
    report.activePanelIndex = await tabs.locator("[role=tabpanel].e-active").getAttribute("data-tab-index");
  }

  // Accordion: open first item, then second → first closes
  const items = page.locator(".e-n-accordion-item");
  if ((await items.count()) > 1) {
    await items.nth(0).locator("summary").scrollIntoViewIfNeeded();
    await items.nth(0).locator("summary").click();
    await items.nth(1).locator("summary").click();
    await page.waitForTimeout(300);
    report.accordionFirstOpen = await items.nth(0).evaluate((d) => (d as HTMLDetailsElement).open);
    report.accordionSecondOpen = await items.nth(1).evaluate((d) => (d as HTMLDetailsElement).open);
  }

  // Lightbox: click first gallery link
  const link = page.locator('a[data-elementor-open-lightbox="yes"]').first();
  if ((await link.count()) > 0) {
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await page.waitForTimeout(500);
    report.lightboxOpen = await page.locator(".elementor-lightbox").isVisible();
    report.lightboxCounter = await page.locator(".elementor-slideshow__counter").textContent();
    await page.keyboard.press("ArrowRight");
    report.lightboxAfterNext = await page.locator(".elementor-slideshow__counter").textContent();
    await page.keyboard.press("Escape");
    report.lightboxClosed = (await page.locator(".elementor-lightbox").count()) === 0;
  }

  report.errors = errors;
  console.log(report);
  await browser.close();
}

main();
