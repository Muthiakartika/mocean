/**
 * Compares element positions between the live WordPress page and the local Next.js page.
 * Elements are matched by their text (headings, paragraphs, buttons, list items) or
 * image file name, then any difference in x / y / width / height above the tolerance is listed.
 * The local page is loaded with "?original", which switches off the redesign layer (MASTER.md).
 *
 *   npx tsx scripts/compare-layout.ts / 1440 [tolerancePx=2]
 */
import { chromium, type Page } from "playwright-core";
import { TARGETS } from "./shared";

type Box = { key: string; x: number; y: number; w: number; h: number; fs: string };

async function collect(page: Page, url: string): Promise<Box[]> {
  await page.goto(url, { waitUntil: "load", timeout: 120_000 });
  // Scroll through the page so lazy content loads and entrance animations finish.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);
  return page.evaluate(() => {
    const main = document.querySelector("main") ?? document.querySelector("[data-elementor-type='wp-page']") ?? document.body;
    const seen = new Map<string, number>();
    const boxes: Box[] = [];
    const add = (key: string, el: Element) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const n = (seen.get(key) ?? 0) + 1;
      seen.set(key, n);
      boxes.push({
        key: n > 1 ? `${key} #${n}` : key,
        x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height),
        fs: getComputedStyle(el).fontSize,
      });
    };
    const text = (el: Element) => (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40).trimEnd();
    // Blog posts on the original have no <main>: leave out the site header and footer there.
    const inChrome = (el: Element) => el.closest("#reactheme-header, #colophon");
    main.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,a.theme-btn,a[class*=button],.rt-sub-heading-here,.elementor-heading-title,span[class*=sub]").forEach((el) => {
      // Skip containers whose text is mostly from children of the same kinds.
      const t = text(el);
      if (t.length < 3 || inChrome(el)) return;
      // Sliders move over time, so their content is not compared (hero checked by screenshot).
      if (el.closest("sr7-module, [aria-roledescription=carousel], .swiper, [data-slider]")) return;
      add(`${el.tagName.toLowerCase()}:${t}`, el);
    });
    // Plain text blocks (div/span that only contain text), e.g. card titles and captions.
    main.querySelectorAll("div, span").forEach((el) => {
      if (el.children.length > 0 || el.closest("h1,h2,h3,h4,h5,h6,p,li,a")) return;
      const t = text(el);
      if (t.length < 3 || inChrome(el) || el.closest("sr7-module, [aria-roledescription=carousel], .swiper, [data-slider], style")) return;
      add(`text:${t}`, el);
    });
    main.querySelectorAll("img").forEach((img) => {
      if (inChrome(img) || img.closest("sr7-module, [aria-roledescription=carousel], .swiper, [data-slider]")) return;
      const src = (img.getAttribute("src") ?? "").split("/").pop()!.split("?")[0];
      // next/image URLs look like /_next/image?url=%2Fimages%2F...%2Ffile.jpg
      const file = decodeURIComponent(img.currentSrc || img.src).split("/").pop()!.split("&")[0];
      // WordPress serves size variants ("photo-600x400.jpg", "photo-scaled.jpg"), next/image the original file: compare them as one image.
      const name = (file || src).replace(/\.webp$/, "").replace(/-(\d+x\d+|scaled)(?=\.\w+$)/, "");
      add(`img:${name}`, img.closest(".jarallax, [class*=frame]") ?? img);
    });
    return boxes;
  });
}

async function main() {
  const [urlPath = "/", widthArg = "1440", tolArg = "2"] = process.argv.slice(2);
  const width = Number(widthArg);
  const tol = Number(tolArg);
  const browser = await chromium.launch({ channel: "msedge" });
  const mk = async () => browser.newPage({ viewport: { width, height: 900 } });
  const [pa, pb] = [await mk(), await mk()];
  for (const p of [pa, pb]) await p.addInitScript({ content: "window.__name = (f) => f;" });

  const [orig, local] = await Promise.all([collect(pa, TARGETS.original + urlPath), collect(pb, TARGETS.local + urlPath + "?original")]);
  await browser.close();

  const localByKey = new Map(local.map((b) => [b.key.replace(/ +#/, " #"), b]));
  let diffs = 0;
  let missing = 0;
  const rows: string[] = [];
  for (const o of orig) {
    const l = localByKey.get(o.key);
    if (!l) {
      missing++;
      rows.push(`MISSING  ${o.key}  (orig ${o.x},${o.y} ${o.w}x${o.h})`);
      continue;
    }
    localByKey.delete(o.key);
    const d = { x: l.x - o.x, y: l.y - o.y, w: l.w - o.w, h: l.h - o.h };
    if (Object.values(d).some((v) => Math.abs(v) > tol) || o.fs !== l.fs) {
      diffs++;
      rows.push(
        `DIFF     ${o.key.padEnd(48)} dx=${d.x} dy=${d.y} dw=${d.w} dh=${d.h}` +
          (o.fs !== l.fs ? ` font ${o.fs}->${l.fs}` : "") +
          `   (orig ${o.x},${o.y} ${o.w}x${o.h})`,
      );
    }
  }
  for (const l of localByKey.values()) rows.push(`EXTRA    ${l.key}  (local ${l.x},${l.y} ${l.w}x${l.h})`);
  console.log(rows.join("\n"));
  console.log(`\n${urlPath} @${width}px: ${orig.length} elements, ${diffs} differ > ${tol}px, ${missing} missing, ${localByKey.size} extra`);
}

main();
