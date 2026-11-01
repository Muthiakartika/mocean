import type { ElementorNode as Node } from "./types";

/**
 * Renders one container or widget with the same markup the original site used,
 * so the original page CSS (src/styles/elementor/post-<id>.css) applies unchanged.
 */
export default function ElementorNode({ node }: { node: Node }) {
  // Elements with an entrance animation start hidden; ElementorBehaviors reveals them on scroll.
  const animationProps = node.animation
    ? { "data-animation": node.animation, className: `${node.classes} elementor-invisible` }
    : { className: node.classes };

  if (node.type === "container" && "children" in node) {
    const children = node.children.map((child) => <ElementorNode key={child.id} node={child} />);
    const boxed = node.classes.split(" ").includes("e-con-boxed");
    return (
      <div {...animationProps} data-id={node.id} data-element_type="container">
        {boxed ? <div className="e-con-inner">{children}</div> : children}
      </div>
    );
  }

  if ("html" in node) {
    // Trusted HTML: extracted from the client's own website by the migration script.
    if (node.wrapped) {
      return (
        <div {...animationProps} data-id={node.id} data-element_type="widget" data-widget_type={`${node.type}.default`}>
          <div className="elementor-widget-container" dangerouslySetInnerHTML={{ __html: node.html }} />
        </div>
      );
    }
    return (
      <div
        {...animationProps}
        data-id={node.id}
        data-element_type="widget"
        data-widget_type={`${node.type}.default`}
        dangerouslySetInnerHTML={{ __html: node.html }}
      />
    );
  }

  return null;
}
