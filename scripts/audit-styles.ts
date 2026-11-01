/**
 * Reads the computed CSS of every Elementor element on a live page, at every
 * Elementor breakpoint, and saves it as JSON. Used to port each page's design
 * without guessing values (PRD §2.2).
 *
 *   npx tsx scripts/audit-styles.ts /            -> docs/audit/styles/home.json
 *   npx tsx scripts/audit-styles.ts /pricing/
 *
 * Uses the Microsoft Edge that is installed on Windows (no browser download).
 */
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { slugOf, TARGETS } from "./shared";

/** One width inside each Elementor breakpoint range used by the site. */
const WIDTHS = [1440, 1280, 1100, 960, 820, 390];

const CONTAINER_PROPS = [
  "display", "flexDirection", "flexWrap", "justifyContent", "alignItems", "alignSelf", "gap", "rowGap", "columnGap",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "marginTop", "marginRight", "marginBottom", "marginLeft",
  "maxWidth", "minHeight", "position", "top", "left", "right", "bottom", "zIndex", "order",
  "backgroundColor", "backgroundImage", "backgroundPosition", "backgroundSize", "backgroundRepeat", "backgroundAttachment",
  "borderTopWidth", "borderStyle", "borderColor", "borderRadius", "boxShadow", "overflow", "textAlign",
];
const TEXT_PROPS = ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform", "color", "textAlign", "marginTop", "marginBottom", "fontStyle", "textDecoration"];
const IMG_PROPS = ["objectFit", "objectPosition", "borderRadius", "maxWidth", "opacity", "position", "transform"];

async function main() {
  const urlPath = process.argv[2] ?? "/";
  const browser = await chromium.launch({ channel: "msedge" });
  const result: Record<string, unknown> = {};

  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    // tsx adds a `__name` helper to functions; define it inside the page too.
    await page.addInitScript({ content: "window.__name = (f) => f;" });
    await page.goto(TARGETS.original + urlPath, { waitUntil: "load", timeout: 120_000 });
    // Trigger lazy loading and entrance animations, then go back to the top.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 50));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1500);

    result[width] = await page.evaluate(
      ({ CONTAINER_PROPS, TEXT_PROPS, IMG_PROPS }) => {
        const pick = (el: Element, props: string[]) => {
          const cs = getComputedStyle(el) as unknown as Record<string, string>;
          const r = el.getBoundingClientRect();
          const o: Record<string, string | number> = {
            x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height),
          };
          for (const p of props) o[p] = cs[p];
          return o;
        };
        const docs = [...document.querySelectorAll("[data-elementor-type]")].filter(
          (d) => !d.closest("header, footer") && !d.parentElement?.closest("[data-elementor-type]"),
        );
        const main = docs.sort((a, b) => b.textContent!.length - a.textContent!.length)[0];
        const out: Record<string, unknown> = {};
        main.querySelectorAll("[data-id]").forEach((el) => {
          const id = (el as HTMLElement).dataset.id!;
          const type = (el as HTMLElement).dataset.widget_type ?? "container";
          const entry: Record<string, unknown> = { type, box: pick(el, CONTAINER_PROPS) };
          const inner = el.querySelector(":scope > .e-con-inner");
          if (inner) entry.inner = pick(inner, CONTAINER_PROPS);
          if (type !== "container") {
            const wc = el.querySelector(":scope > .elementor-widget-container");
            if (wc) entry.widgetContainer = pick(wc, CONTAINER_PROPS);
            entry.texts = [...el.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,a,span.rt-sub-heading-here,.elementor-heading-title,.elementor-icon-list-text,.e-n-accordion-item-title-text,summary,blockquote")]
              .slice(0, 12)
              .map((t) => ({ tag: t.tagName.toLowerCase(), cls: (t.className as string).toString().slice(0, 60), text: t.textContent!.trim().slice(0, 40), ...pick(t, TEXT_PROPS) }));
            entry.images = [...el.querySelectorAll("img")].slice(0, 6).map((i) => ({ src: i.getAttribute("src")?.split("/uploads/")[1], ...pick(i, IMG_PROPS) }));
          }
          out[id] = entry;
        });
        return out;
      },
      { CONTAINER_PROPS, TEXT_PROPS, IMG_PROPS },
    );
    console.log(`ok ${width}px`);
    await page.close();
  }

  await browser.close();
  await mkdir("docs/audit/styles", { recursive: true });
  const file = `docs/audit/styles/${slugOf(urlPath)}.json`;
  await writeFile(file, JSON.stringify(result, null, 1));
  console.log("saved", file);
}

main();
