import fs from "node:fs";
import path from "node:path";
import { isCardGrid } from "./ElementorNode";
import { photoOf } from "./faqPhotos";
import type { ElementorNode as Node, PageContent } from "./types";

/**
 * Redesign "Waves", the homepage look (owner, 2026-11-04), on every inner page and post: first the main menu pages,
 * then "lanjutkan" for the rest. The markers below are read by src/styles/redesign/waves-pages.css.
 */

type Kind = "plain" | "band" | "photo";

/** Containers whose own rules in the page CSS set a photo background or the grey band (#F1F1F1, now --rd-band). */
function backgrounds(elementorId: string): Map<string, Kind> {
  const file = path.join(process.cwd(), "src/styles/elementor", `post-${elementorId}.css`);
  const kinds = new Map<string, Kind>();
  if (!fs.existsSync(file)) return kinds;
  for (const [, selectors, body] of fs.readFileSync(file, "utf8").matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const kind = /background-image:\s*url\(/.test(body) ? "photo" : body.includes("--rd-band") ? "band" : null;
    if (!kind) continue;
    for (const selector of selectors.split(",")) {
      if (/::?(before|after)|:hover/.test(selector)) continue;
      const id = selector.match(/elementor-element-[0-9a-f]+/g)?.at(-1)?.slice("elementor-element-".length);
      if (id && kinds.get(id) !== "photo") kinds.set(id, kind);
    }
  }
  return kinds;
}

const SHAPES = ["arch", "leaf", "mirror"];

const isContainer = (node: Node): node is Node & { children: Node[] } => node.type === "container" && "children" in node;

/** Two photos side by side, each alone in its own box (the restaurant intro): shaped as one pair. */
const isPhotoPair = (node: Node) =>
  isContainer(node) && node.children.length === 2 && node.children.every((box) => isContainer(box) && box.children.length === 1 && !!photoOf(box.children[0]));

/** A small fact box: a heading over one icon list (restaurant phone and hours, dive site seasons). */
const isInfoBox = (node: Node) => isContainer(node) && node.children.length === 2 && node.children[0].type === "heading" && node.children[1].type === "icon-list";

/**
 * Element id → Waves classes:
 *   - top-level sections on a band or photo: rd-wave-hero / rd-wave-band / rd-wave-photo, plus rd-wave-top and
 *     rd-wave-bottom on each edge that meets a white section (or the end of the page);
 *   - nested boxes: rd-wave-card on the band, rd-wave-banner with a photo background, rd-wave-info for a fact box;
 *   - photos (not in card grids or FAQ collages): rd-wave-img with the shapes arch, leaf and mirror in turn; two
 *     photos side by side are one rd-wave-pair instead (rd-pair-img, shaped by their place in the pair).
 */
export function waveMarks(page: PageContent, overlays: Set<string>, collages: Map<string, unknown>): Map<string, string> {
  const kinds = backgrounds(page.elementorId);
  const marks = new Map<string, string>();
  const add = (id: string, classes: string) => marks.set(id, [marks.get(id), classes].filter(Boolean).join(" "));

  // The first section is the photo hero; a card laid over it (rd-overlay-card) counts as white.
  const sections = page.content.filter((node) => node.type === "container");
  const sectionKinds = sections.map((node, i): Kind => (i === 0 ? "photo" : overlays.has(node.id) ? "plain" : (kinds.get(node.id) ?? "plain")));
  sections.forEach((node, i) => {
    const kind = sectionKinds[i];
    if (kind === "plain") return;
    add(node.id, i === 0 ? "rd-wave-hero" : `rd-wave-${kind}`);
    if (i > 0 && sectionKinds[i - 1] === "plain") add(node.id, "rd-wave-top");
    if ((sectionKinds[i + 1] ?? "plain") === "plain") add(node.id, "rd-wave-bottom");
  });

  let photos = 0;
  const walk = (node: Node, depth: number) => {
    if (isContainer(node)) {
      if (isCardGrid(node) || collages.has(node.id)) return;
      if (isPhotoPair(node)) {
        add(node.id, "rd-wave-pair");
        for (const box of node.children) if (isContainer(box)) add(box.children[0].id, "rd-wave-img rd-pair-img");
        return;
      }
      if (isInfoBox(node)) add(node.id, "rd-wave-info");
      const kind = depth > 0 ? kinds.get(node.id) : undefined;
      if (kind === "band") add(node.id, "rd-wave-card");
      if (kind === "photo") add(node.id, "rd-wave-banner");
      node.children.forEach((child) => walk(child, depth + 1));
    } else if (photoOf(node)) {
      add(node.id, `rd-wave-img rd-shape-${SHAPES[photos++ % SHAPES.length]}`);
    }
  };
  page.content.forEach((node) => walk(node, 0));
  return marks;
}
