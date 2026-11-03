import headingRoles from "@/data/heading-roles.json";
import { SiteFacts, hasSiteFacts } from "./Facts";
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

/** Original classes plus the redesign markers (heading roles, cards). */
function redesignClasses(node: Node, path: string) {
  if (node.type === "container" && "children" in node) {
    if (isCard(node)) return `${node.classes} rd-card`;
    if (node.children.filter(isCard).length >= 2) return `${node.classes} rd-cards`;
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
export default function ElementorNode({ node, path }: { node: Node; path: string }) {
  // Original id/classes. Elements with an entrance animation start hidden; ElementorBehaviors reveals them on scroll.
  const classes = redesignClasses(node, path);
  const wrapperProps = {
    id: node.cssId,
    ...(node.animation
      ? { "data-animation": node.animation, className: `${classes} elementor-invisible` }
      : { className: classes }),
  };

  if (node.type === "container" && "children" in node) {
    const children = node.children.map((child) => <ElementorNode key={child.id} node={child} path={path} />);
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
