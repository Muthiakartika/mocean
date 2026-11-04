import type { ElementorNode as Node } from "./types";

/**
 * Logbook redesign (MASTER.md): the photo beside each FAQ becomes a collage of three (owner reference 2026-11-03).
 * The two extra photos are the page's own: the nearest photos before the FAQ (then after it), never the FAQ's own
 * photo twice. The collage only exists in the redesign (rd-only); "?original" shows the single photo.
 */

export type FaqPhoto = { src: string; alt: string; width: number; height: number };

const attr = (html: string, name: string) => html.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

/** The photo of an image widget, if it is a real photo (not an icon, a logo or a wide banner strip). */
export function photoOf(node: Node): FaqPhoto | null {
  if (node.type !== "image" || !("html" in node)) return null;
  const src = attr(node.html, "src");
  const width = Number(attr(node.html, "width"));
  const height = Number(attr(node.html, "height"));
  if (!src || !/\.(jpe?g|webp)$/i.test(src) || !(width >= 600) || !(height >= 400) || width / height > 2) return null;
  return { src, alt: attr(node.html, "alt") ?? "", width, height };
}

const firstPhoto = (node: Node): FaqPhoto | null =>
  photoOf(node) ?? ("children" in node ? (node.children.map(firstPhoto).find(Boolean) ?? null) : null);

const holds = (node: Node, test: (n: Node) => boolean): boolean =>
  test(node) || ("children" in node && node.children.some((child) => holds(child, test)));

/** A FAQ: an accordion of questions (an accordion of price tables is a price list, priceList.ts). */
const isFaq = (node: Node) => node.type === "nested-accordion" && "html" in node && !node.html.includes("eael-data-table");

/** Photo container id → the two extra photos of its collage (fewer when the page has fewer photos). */
export function faqCollages(content: Node[]): Map<string, FaqPhoto[]> {
  const photos: FaqPhoto[] = [];
  const faqs: { box: string; own: string; at: number }[] = [];

  const walk = (nodes: Node[]) => {
    for (const node of nodes) {
      const photo = photoOf(node);
      if (photo) photos.push(photo);
      if (!("children" in node)) continue;
      // A FAQ row: a photo container beside a container with the questions.
      const box = node.children.find((child) => "children" in child && holds(child, (n) => n.type === "image") && !holds(child, isFaq));
      if (box && node.children.some((child) => child !== box && holds(child, isFaq))) {
        faqs.push({ box: box.id, own: firstPhoto(box)?.src ?? "", at: photos.length });
      }
      walk(node.children);
    }
  };
  walk(content);

  const collages = new Map<string, FaqPhoto[]>();
  for (const faq of faqs) {
    const before = photos.slice(0, faq.at).reverse();
    const after = photos.slice(faq.at);
    const picked: FaqPhoto[] = [];
    for (const photo of [...before, ...after]) {
      if (picked.length === 2) break;
      if (photo.src !== faq.own && !picked.some((p) => p.src === photo.src)) picked.push(photo);
    }
    collages.set(faq.box, picked);
  }
  return collages;
}
