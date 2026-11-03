/**
 * Measures the rendered layers of the first home hero slide (Slider Revolution)
 * at several widths. Output: docs/audit/styles/hero-layers.json
 *
 *   npx tsx scripts/audit-hero.ts
 */
import { chromium } from "playwright-core";
import { writeFile } from "node:fs/promises";
import { TARGETS } from "./shared";

const WIDTHS = [1440, 1280, 1100, 1024, 960, 820, 778, 700, 600, 481, 480, 390, 375];

async function main() {
  const browser = await chromium.launch({ channel: "msedge" });
  const out: Record<number, unknown> = {};
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.addInitScript({ content: "window.__name = (f) => f;" });
    await page.goto(TARGETS.original + "/", { waitUntil: "load", timeout: 120_000 });
    await page.waitForTimeout(2500); // first slide's layers have finished animating in
    out[width] = await page.evaluate(() => {
      const m = document.querySelector("sr7-module")!.getBoundingClientRect();
      const slide = document.querySelector("sr7-slide")!;
      const layers = [...slide.querySelectorAll(".sr7-layer")].map((el) => {
        const r = el.getBoundingClientRect();
        const c = getComputedStyle(el);
        return {
          text: el.textContent!.trim().slice(0, 30), tag: el.tagName.toLowerCase(),
          x: Math.round(r.x - m.x), y: Math.round(r.y - m.y), w: Math.round(r.width), h: Math.round(r.height),
          fontSize: c.fontSize, lineHeight: c.lineHeight, fontWeight: c.fontWeight, fontFamily: c.fontFamily,
          padding: c.padding, border: c.border, color: c.color, bg: c.backgroundColor, opacity: c.opacity,
          visibility: c.visibility, display: c.display, whiteSpace: c.whiteSpace, letterSpacing: c.letterSpacing,
          radius: c.borderRadius,
        };
      });
      return { module: { w: Math.round(m.width), h: Math.round(m.height), x: Math.round(m.x) }, layers };
    });
    console.log("ok", width);
    await page.close();
  }
  await browser.close();
  await writeFile("docs/audit/styles/hero-layers.json", JSON.stringify(out, null, 1));
}

main();
