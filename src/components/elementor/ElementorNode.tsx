import type { CSSProperties } from "react";
import Image from "next/image";
import headingRoles from "@/data/heading-roles.json";
import { SiteFacts, hasSiteFacts } from "./Facts";
import type { FaqPhoto } from "./faqPhotos";
import type { ElementorNode as Node } from "./types";

/**
 * Per page: heading widgets whose h2 is the larger line, or whose coloured line is empty
 * (scripts/migration/heading-roles.mjs), for the redesign layer.
 */
const roles = headingRoles as Record<string, { titleLead: string[]; emptySub: string[] }>;

const holds = (node: Node, type: string) => node.type === "container" && "children" in node && node.children.some((child) => child.type === type);

/** A card: a container holding a photo container and a text container with a button (Logbook shows these as table rows). */
function isCard(node: Node) {
  if (node.type !== "container" || !("children" in node)) return false;
  return node.children.some((child) => holds(child, "image")) && node.children.some((child) => holds(child, "rt-button"));
}

/** A card grid: two or more cards side by side. A single photo + text block is a normal section, not a row. */
const isCardGrid = (node: Node) => node.type === "container" && "children" in node && node.children.filter(isCard).length >= 2;

const isChipList = (node: Node) => node.type === "icon-list" && "html" in node && node.html.includes("elementor-inline-items");

/** The item texts of a list widget. */
const listItems = (node: Node) =>
  "html" in node
    ? [...node.html.matchAll(/<span class="elementor-icon-list-text">([\s\S]*?)<\/span>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim())
    : [];

/**
 * Chip lists that Elementor split over several list widgets (two or three chips per widget, a run of list widgets
 * starting with an inline one): widget id → length of the longest chip in the run. The redesign layer gives every
 * list in the run the same column width from it, so the chips line up.
 */
function chipRuns(children: Node[]) {
  const runs = new Map<string, number>();
  for (let i = 0; i < children.length; i++) {
    if (!isChipList(children[i]) || children[i - 1]?.type === "icon-list") continue;
    let end = i + 1;
    while (children[end]?.type === "icon-list") end++;
    if (end - i < 2) continue;
    const run = children.slice(i, end);
    const longest = Math.max(...run.flatMap(listItems).map((text) => text.length));
    for (const list of run) runs.set(list.id, longest);
  }
  return runs;
}

/** Original classes plus the redesign markers (heading roles, cards). */
function redesignClasses(node: Node, path: string, inCardGrid: boolean) {
  if (node.type === "container" && "children" in node) {
    if (inCardGrid && isCard(node)) return `${node.classes} rd-card`;
    if (isCardGrid(node)) return `${node.classes} rd-cards`;
    return node.classes;
  }
  if (node.type !== "react-heading") return node.classes;
  const page = roles[path];
  return [node.classes, page?.titleLead.includes(node.id) && "rd-title-lead", page?.emptySub.includes(node.id) && "rd-no-sub"].filter(Boolean).join(" ");
}

/**
 * Renders one container or widget with the same markup the original site used,
 * so the original page CSS (src/styles/elementor/post-<id>.css) applies unchanged.
 */
export default function ElementorNode({
  node,
  path,
  inCardGrid = false,
  chipLength,
  collages,
  extraClass,
}: {
  node: Node;
  path: string;
  inCardGrid?: boolean;
  /** Set on list widgets in a split chip list (chipRuns). */
  chipLength?: number;
  /** FAQ photo container id → the extra photos of its collage (faqCollages). */
  collages?: Map<string, FaqPhoto[]>;
  /** A redesign marker set by the page (e.g. rd-overlay-card). */
  extraClass?: string;
}) {
  // Original id/classes. Elements with an entrance animation start hidden; ElementorBehaviors reveals them on scroll.
  const collage = collages?.get(node.id);
  const classes = [redesignClasses(node, path, inCardGrid), chipLength && "rd-chip-run", collage && "rd-faq-photos", extraClass]
    .filter(Boolean)
    .join(" ");
  const wrapperProps = {
    id: node.cssId,
    style: chipLength ? ({ "--rd-chip-len": chipLength } as CSSProperties) : undefined,
    ...(node.animation
      ? { "data-animation": node.animation, className: `${classes} elementor-invisible` }
      : { className: classes }),
  };

  if (node.type === "container" && "children" in node) {
    const grid = isCardGrid(node);
    const chips = chipRuns(node.children);
    const children = node.children.map((child) => (
      <ElementorNode key={child.id} node={child} path={path} inCardGrid={grid} chipLength={chips.get(child.id)} collages={collages} />
    ));
    // Logbook redesign: two more of the page's photos beside the FAQ photo.
    if (collage?.length) {
      children.push(
        <div key="rd-faq-more" className="rd-only rd-faq-more" data-count={collage.length}>
          {collage.map((photo) => (
            <Image key={photo.src} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 767px) 45vw, 22vw" />
          ))}
        </div>,
      );
    }
    // Logbook redesign: a dive site's spec row goes right after its intro text.
    if (hasSiteFacts(path, node.cssId)) {
      const intro = node.children.findIndex((child) => child.type === "text-editor");
      children.splice(intro >= 0 ? intro + 1 : 1, 0, <SiteFacts key="rd-site-facts" path={path} id={node.cssId!} />);
    }
    const boxed = node.classes.split(" ").includes("e-con-boxed");
    return (
      <div {...wrapperProps} data-id={node.id} data-element_type="container">
        {boxed ? <div className="e-con-inner">{children}</div> : children}
      </div>
    );
  }

  if ("html" in node) {
    // Trusted HTML: extracted from the client's own website by the migration script.
    if (node.wrapped) {
      return (
        <div {...wrapperProps} data-id={node.id} data-element_type="widget" data-widget_type={`${node.type}.default`}>
          <div className="elementor-widget-container" dangerouslySetInnerHTML={{ __html: node.html }} />
        </div>
      );
    }
    return (
      <div
        {...wrapperProps}
        data-id={node.id}
        data-element_type="widget"
        data-widget_type={`${node.type}.default`}
        dangerouslySetInnerHTML={{ __html: node.html }}
      />
    );
  }

  return null;
}
