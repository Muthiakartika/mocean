/**
 * Migration tool: copies the original Elementor/theme CSS into src/styles/elementor/
 * with two small rewrites so it works in Next.js:
 *   1. image URLs  https://moceanbeachresort.com/wp-content/uploads/...  ->  /images/uploads/...
 *   2. font names  "Quicksand" / "Jost" / "Roboto" / "rt-icons"  ->  the self-hosted next/font families
 *   3. three values the redesign layer adjusts become variables with the original value as fallback
 *
 *   node scripts/migration/convert-css.mjs
 *
 * Input:  docs/audit/original-css/  (downloaded during the audit)
 * Output: src/styles/elementor/post-<id>.css      one file per page (Elementor page CSS)
 *         src/styles/elementor/vendor/*.css       shared Elementor + theme CSS for inner pages
 */
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const SRC = "docs/audit/original-css";
const OUT = "src/styles/elementor";

/** Shared stylesheets every inner page needs (same files the original loads). */
const VENDOR = {
  "swiper.css": "plugins__elementor__assets__lib__swiper__v8__css__swiper.min.css",
  "e-swiper.css": "plugins__elementor__assets__css__conditionals__e-swiper.min.css",
  "theme-style.css": "themes__moonlit__style.css",
  "bootstrap-grid.css": "themes__moonlit__assets__css__bootstrap-grid.min.css",
  "elementor-frontend.css": "uploads__elementor__css__custom-frontend.min.css",
  "elementor-kit.css": "uploads__elementor__css__post-12054.css",
  "widget-heading.css": "plugins__elementor__assets__css__widget-heading.min.css",
  "widget-image.css": "plugins__elementor__assets__css__widget-image.min.css",
  "widget-icon-list.css": "uploads__elementor__css__custom-widget-icon-list.min.css",
  "widget-icon-box.css": "uploads__elementor__css__custom-widget-icon-box.min.css",
  "widget-image-box.css": "uploads__elementor__css__custom-widget-image-box.min.css",
  "widget-image-gallery.css": "uploads__elementor__css__custom-widget-image-gallery.min.css",
  "widget-nested-tabs.css": "uploads__elementor__css__custom-widget-nested-tabs.min.css",
  "widget-nested-accordion.css": "plugins__elementor__assets__css__widget-nested-accordion.min.css",
  "widget-google-maps.css": "plugins__elementor__assets__css__widget-google_maps.min.css",
  "widget-divider.css": "plugins__elementor__assets__css__widget-divider.min.css",
  "widget-social-icons.css": "plugins__elementor__assets__css__widget-social-icons.min.css",
  "animation-fade-in-up.css": "plugins__elementor__assets__lib__animations__styles__fadeInUp.min.css",
  "essential-addons.css": "plugins__essential-addons-for-elementor-lite__assets__front-end__css__view__general.min.css",
  "theme-elements.css": "plugins__rt-moonlit__assets__css__elements.css",
  "theme-responsive.css": "themes__moonlit__assets__css__responsive.css",
  "dialog.css": "plugins__elementor__assets__css__conditionals__dialog.min.css",
  "lightbox.css": "plugins__elementor__assets__css__conditionals__lightbox.min.css",
  // Contact page only (WPForms, loaded last on the original)
  "wpforms.css": "plugins__wpforms-lite__assets__css__frontend__modern__wpforms-full.min.css",
  "wpforms-inline.css": "_inline-wpforms-modern-full.css",
  // Blog posts only (Gutenberg block styles)
  "wp-block-library.css": "wp-includes__css__dist__block-library__style.min.css",
  "wp-block-library-theme.css": "_inline-wp-block-library-theme.css",
};

const FONTS = {
  Quicksand: "var(--font-quicksand)",
  Jost: "var(--font-jost)",
  Roboto: "var(--font-roboto)",
  // Theme icon font (testimonial stars, etc.), self-hosted in src/app/fonts.ts
  "rt-icons": "var(--font-rt-icons)",
};

/**
 * Values the redesign layer re-tokenizes (MASTER.md, src/styles/redesign/inner-pages.css).
 * Each one falls back to the original value, so with the layer off (?original) nothing changes.
 */
const REDESIGN_HOOKS = [
  [/#f1f1f1/gi, "var(--rd-band, #F1F1F1)"],
  [/text-align:\s*justify/g, "text-align:var(--rd-justify, justify)"],
  [/font-weight:\s*400/g, "font-weight:var(--rd-w400, 400)"],
];

/** Heading-pair font sizes get a ceiling the redesign layer sets per role (--rd-hcap); without it they are unchanged. */
function capHeadingSizes(css) {
  // Theme headings (rt-title-here / rt-sub-heading-here) and Elementor's own heading widget.
  return css.replace(/([^{}]*(?:rt-(?:sub-heading|title)-here|elementor-heading-title)[^{}]*)\{([^{}]*)\}/g, (rule, selector, body) =>
    `${selector}{${body.replace(/font-size:\s*(\d+(?:\.\d+)?px)/g, "font-size:min($1, var(--rd-hcap, 999px))")}}`,
  );
}

function addRedesignHooks(css) {
  // Not inside @font-face, where var() is invalid.
  return css
    .split(/(@font-face\s*\{[^}]*\})/)
    .map((part) => (part.startsWith("@font-face") ? part : capHeadingSizes(REDESIGN_HOOKS.reduce((out, [from, to]) => out.replace(from, to), part))))
    .join("");
}

function convert(css) {
  // Rules without a selector (e.g. "}{}") are ignored by browsers but rejected by Next.js' CSS parser.
  css = css.replace(/(^|[}{;])\s*\{[^{}]*\}/g, "$1");
  let out = css.replace(/https?:\/\/moceanbeachresort\.com\/wp-content\/uploads\//g, "/images/uploads/");
  for (const [name, variable] of Object.entries(FONTS)) {
    out = out.replace(new RegExp(`(["'])${name}\\1`, "g"), variable);
  }
  return addRedesignHooks(out);
}

async function main() {
  await mkdir(path.join(OUT, "vendor"), { recursive: true });

  for (const [outName, srcName] of Object.entries(VENDOR)) {
    const css = await readFile(path.join(SRC, srcName), "utf8");
    await writeFile(path.join(OUT, "vendor", outName), `/* Original file: ${srcName} */\n` + convert(css));
  }

  // Page CSS: one file per Elementor document used by pages and posts
  const ids = new Map(); // elementor id -> content file
  for (const file of await readdir("src/content/pages")) {
    const { elementorId } = JSON.parse(await readFile(path.join("src/content/pages", file), "utf8"));
    ids.set(elementorId, `pages/${file}`);
  }
  for (const file of await readdir("src/content/posts").catch(() => [])) {
    const post = JSON.parse(await readFile(path.join("src/content/posts", file), "utf8"));
    for (const id of [post.bannerId, ...post.embeddedElementorIds]) ids.set(id, `posts/${file}`);
  }
  let count = 0;
  for (const [elementorId, file] of ids) {
    const srcName = `uploads__elementor__css__post-${elementorId}.css`;
    const css = await readFile(path.join(SRC, srcName), "utf8").catch(() => null);
    if (css === null) {
      console.warn("missing CSS for", file, srcName);
      continue;
    }
    await writeFile(path.join(OUT, `post-${elementorId}.css`), `/* Original file: ${srcName} (${file}) */\n` + convert(css));
    count++;
  }
  // Essential Addons writes one extra CSS file per page that uses its widgets (data table, post grid).
  let eael = 0;
  for (const elementorId of ids.keys()) {
    const srcName = `uploads__essential-addons-elementor__eael-${elementorId}.css`;
    const css = await readFile(path.join(SRC, srcName), "utf8").catch(() => null);
    if (css === null) continue;
    await writeFile(path.join(OUT, `eael-${elementorId}.css`), `/* Original file: ${srcName} */
` + convert(css));
    eael++;
  }
  console.log(`vendor: ${Object.keys(VENDOR).length} files, pages: ${count} files, essential addons: ${eael} files`);
}

main();
