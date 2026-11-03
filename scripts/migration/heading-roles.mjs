/**
 * Redesign helper: decides which line of each Elementor "react-heading" pair is the main heading.
 *
 * The theme widget has a coloured line (span.rt-sub-heading-here, default 24px) and an h2
 * (.rt-title-here, default 60px). Most pages enlarge the coloured line and shrink the h2,
 * but FAQ, gallery and testimonial headings keep the h2 as the large line. The redesign layer
 * (src/styles/redesign/inner-pages.css) styles the larger line as the heading and the other as
 * its deck, so it needs to know which one is larger. That is read from the page's own original
 * desktop CSS here, once, instead of being guessed in CSS.
 *
 * Roles are worked out per page: many pages were copied from each other, so the same element id
 * appears on several pages with different text and sizes.
 *
 *   node scripts/migration/heading-roles.mjs
 *
 * Output: src/data/heading-roles.json
 *   { "<page path>": { "titleLead": [ids whose h2 is the larger line], "emptySub": [ids whose coloured line is empty] } }
 * (widgets not in titleLead lead with the coloured line).
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const CSS_DIR = "src/styles/elementor";
const DEFAULT_SUB = 24;
const DEFAULT_TITLE = 60;

/** Removes @media blocks so only the desktop rules remain. */
function desktopOnly(css) {
  let out = "";
  let i = 0;
  while (i < css.length) {
    const at = css.indexOf("@media", i);
    if (at === -1) return out + css.slice(i);
    out += css.slice(i, at);
    let depth = 0;
    let j = css.indexOf("{", at);
    for (; j < css.length; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}" && --depth === 0) break;
    }
    i = j + 1;
  }
  return out;
}

/** element id -> { sub, title } desktop font sizes in one Elementor document's CSS. */
async function headingSizes(elementorId) {
  const sizes = new Map();
  const css = await readFile(path.join(CSS_DIR, `post-${elementorId}.css`), "utf8").catch(() => "");
  const rule = /\.elementor-element-([a-z0-9]+) \.react-heading-here (span\.rt-sub-heading-here|\.rt-title-here)\{([^}]*)\}/g;
  for (const [, id, part, body] of desktopOnly(css).matchAll(rule)) {
    const size = /font-size:(?:min\()?(\d+(?:\.\d+)?)px/.exec(body);
    if (!size) continue;
    const entry = sizes.get(id) ?? {};
    entry[part.includes("sub") ? "sub" : "title"] = Number(size[1]);
    sizes.set(id, entry);
  }
  return sizes;
}

const text = (html) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function rolesFor(nodes, sizes) {
  const titleLead = [];
  const emptySub = [];
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    if (node.type === "react-heading" && node.html) {
      const sub = /<span class="rt-sub-heading-here">([\s\S]*?)<\/span>/.exec(node.html);
      const title = /class="rt-title-here">([\s\S]*?)<\/h\d>/.exec(node.html);
      const subText = sub ? text(sub[1]) : "";
      const titleText = title ? text(title[1]) : "";
      const s = sizes.get(node.id) ?? {};
      const lead = !subText ? "title" : !titleText ? "sub" : (s.title ?? DEFAULT_TITLE) >= (s.sub ?? DEFAULT_SUB) ? "title" : "sub";
      if (lead === "title") titleLead.push(node.id);
      if (!subText) emptySub.push(node.id);
    }
    walk(node.children);
  };
  walk(nodes);
  return { titleLead: [...new Set(titleLead)].sort(), emptySub: [...new Set(emptySub)].sort() };
}

async function main() {
  const roles = {};
  let lead = 0;
  for (const dir of ["src/content/pages", "src/content/posts"]) {
    for (const file of (await readdir(dir)).filter((f) => f.endsWith(".json"))) {
      const data = JSON.parse(await readFile(path.join(dir, file), "utf8"));
      // Pages render their whole Elementor document; posts only their Elementor banner.
      const [nodes, documentId] = data.content ? [data.content, data.elementorId] : [data.banner ?? [], data.bannerId];
      const result = rolesFor(nodes, await headingSizes(documentId));
      if (result.titleLead.length || result.emptySub.length) roles[data.path] = result;
      lead += result.titleLead.length;
    }
  }
  await writeFile("src/data/heading-roles.json", JSON.stringify(roles, null, 1) + "\n");
  console.log(`heading roles: ${Object.keys(roles).length} pages, ${lead} headings lead with the h2`);
}

main();
