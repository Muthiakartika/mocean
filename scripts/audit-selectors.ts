/**
 * Prints computed styles for a list of CSS selectors on a live page (first match each).
 *   npx tsx scripts/audit-selectors.ts /couples-retreat/ 1440 ".bs-desc p" ".bs-img img" ...
 */
import { chromium } from "playwright-core";
import { TARGETS } from "./shared";

const PROPS = [
  "display", "position", "width", "maxWidth", "marginTop", "marginRight", "marginBottom", "marginLeft",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "fontFamily", "fontSize", "fontWeight",
  "lineHeight", "color", "textAlign", "borderRadius", "borderTop", "borderBottom", "backgroundColor", "listStyleType",
];

async function main() {
  const [urlPath, width, ...selectors] = process.argv.slice(2);
  const browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
  await page.addInitScript({ content: "window.__name = (f) => f;" });
  // AUDIT_TARGET=local measures the Next.js site instead of the live one.
  const base = process.env.AUDIT_TARGET === "local" ? TARGETS.local : TARGETS.original;
  await page.goto(base + urlPath, { waitUntil: "load", timeout: 120_000 });
  await page.waitForTimeout(1500);
  const result = await page.evaluate(
    ({ selectors, PROPS }) =>
      selectors.map((sel) => {
        const el = document.querySelector(sel);
        if (!el) return `${sel}: (none)`;
        const cs = getComputedStyle(el) as unknown as Record<string, string>;
        const r = el.getBoundingClientRect();
        const skip = new Set(["0px", "none", "normal", "auto", "static", "rgba(0, 0, 0, 0)", "start", "block", "0px none rgb(101, 103, 107)"]);
        const props = PROPS.filter((p) => !skip.has(cs[p])).map((p) => `${p}=${cs[p]}`);
        return `${sel}: x=${Math.round(r.x)} y=${Math.round(r.y + scrollY)} w=${Math.round(r.width)} h=${Math.round(r.height)} ${props.join(" ")}`;
      }),
    { selectors, PROPS },
  );
  console.log(result.join("\n"));
  await browser.close();
}

main();
