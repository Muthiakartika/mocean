import headingRoles from "@/data/heading-roles.json";
import type { ElementorNode as Node, PageContent } from "./types";

/**
 * Jump-nav entries for the surf spot guides: the names of the surf spots only (owner, 2026-11-04: "cuma nama lokasi
 * surfing aja"). The dive site guides link to each site from their own table of contents, which PageNav reads; the
 * surf guides have at most a few working links, so the names are read from the page:
 *   - the spot range runs from the section after "Top Surf Spots" (or after the first section when there is none)
 *     to the section on levels, getting there or the FAQ;
 *   - where that range has at least two headed sections with text (Bali: Jembrana, Kuta…; Uluwatu: the areas),
 *     those are the spots;
 *   - otherwise the spots are the tabs in the range plus its headed sections with text (Sumbawa: Northern Rights,
 *     Supersuck…; Lombok: Gerupuk Bay…, Desert Point…), headed sections without text being group titles.
 * ElementorNode puts an empty marker per spot at the top of its section (rd-chapter); a spot that is a tab carries
 * the tab's id, and PageNav opens that tab when its entry is clicked.
 */
export type Chapter = { id: string; label: string; tab?: string };

const roles = headingRoles as Record<string, { titleLead: string[]; emptySub: string[] }>;

const isSurfGuide = (pagePath: string) =>
  (pagePath.startsWith("/surf-spots/") && pagePath !== "/surf-spots/") || pagePath.startsWith("/surf-camp/surf-spots/");

const plain = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&rsquo;/g, "’")
    .replace(/\s+/g, " ")
    .trim();

const textOf = (html: string, className: string) =>
  plain(html.match(new RegExp(`class="${className}[^"]*"[^>]*>([\\s\\S]*?)</(?:h\\d|span|div|p)>`))?.[1] ?? "");

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const isContainer = (node: Node): node is Node & { children: Node[] } => node.type === "container" && "children" in node;

const widgets = (node: Node): Node[] => (isContainer(node) ? node.children.flatMap(widgets) : [node]);

/** The tabs of the nested-tabs widgets in a section: title id and text, once per tab. */
function tabsOf(section: Node) {
  const tabs: { id: string; label: string }[] = [];
  for (const widget of widgets(section)) {
    if (widget.type !== "nested-tabs" || !("html" in widget)) continue;
    const seen = new Set<string>();
    for (const [, attrs, inner] of widget.html.matchAll(/<button([^>]*class="e-n-tab-title"[^>]*)>([\s\S]*?)<\/button>/g)) {
      const id = attrs.match(/\sid="([^"]+)"/)?.[1];
      const index = attrs.match(/data-tab-index="(\d+)"/)?.[1];
      const label = plain(inner.match(/e-n-tab-title-text">([\s\S]*?)<\//)?.[1] ?? inner);
      if (!id || !label || seen.has(index ?? id)) continue;
      seen.add(index ?? id);
      tabs.push({ id, label });
    }
  }
  return tabs;
}

/** Top-level section id → the spots it holds, in page order (empty for pages other than the surf guides). */
export function pageChapters(page: PageContent): Map<string, Chapter[]> {
  const chapters = new Map<string, Chapter[]>();
  if (!isSurfGuide(page.path)) return chapters;
  const titleLead = new Set(roles[page.path]?.titleLead ?? []);

  const sections = page.content.filter(isContainer).map((section) => {
    const heading = section.children[0];
    let label = "";
    if (heading?.type === "react-heading" && "html" in heading) {
      const title = textOf(heading.html, "rt-title-here");
      const sub = textOf(heading.html, "rt-sub-heading-here");
      // The larger of the two lines leads (scripts/migration/heading-roles.mjs); usually the coloured sub line.
      label = titleLead.has(heading.id) ? title || sub : sub || title;
    }
    const hasText = section.children.some((child) => child.type === "text-editor" && "html" in child && plain(child.html).length > 0);
    return { section, label, hasText };
  });

  const headed = sections.map((s, i) => (s.label ? i : -1)).filter((i) => i >= 0);
  const top = sections.findIndex((s) => /top surf spots/i.test(s.label));
  const start = top >= 0 ? top + 1 : (headed[1] ?? sections.length);
  const endAt = sections.findIndex((s, i) => i >= start && /level|how to get|faq/i.test(s.label));
  const range = sections.slice(start, endAt >= 0 ? endAt : sections.length);

  const named = range.filter((s) => s.label && s.hasText);
  const used = new Set<string>();
  const add = (sectionId: string, label: string, tab?: string) => {
    let id = `rd-${slug(label)}`;
    for (let n = 2; used.has(id); n++) id = `rd-${slug(label)}-${n}`;
    used.add(id);
    chapters.set(sectionId, [...(chapters.get(sectionId) ?? []), { id, label, tab }]);
  };

  if (named.length >= 2) {
    for (const s of named) add(s.section.id, s.label);
  } else {
    for (const s of range) {
      if (s.label && s.hasText) add(s.section.id, s.label);
      for (const tab of tabsOf(s.section)) add(s.section.id, tab.label, tab.id);
    }
  }
  return chapters;
}
