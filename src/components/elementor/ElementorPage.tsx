import JsonLd from "@/components/shared/JsonLd";
import ElementorBehaviors from "./ElementorBehaviors";
import ElementorNode from "./ElementorNode";
import type { PageContent } from "./types";

import "./styles";

/**
 * An inner page built from the original Elementor content.
 * The wrappers reproduce the original page structure:
 *   body.elementor-kit-12054 > .main-contain > .container (here: .theme-container) > #content > .elementor.elementor-<id>
 */
export default function ElementorPage({ page }: { page: PageContent }) {
  return (
    <div className="elementor-kit-12054 elementor-page">
      <JsonLd path={page.path} />
      <div className="main-contain">
        {/* The theme's ".container" is full width here; renamed so Tailwind's `container` utility doesn't apply. */}
        <div className="theme-container">
          <div id="content">
            <div className={`elementor elementor-${page.elementorId}`} data-elementor-type="wp-page" data-elementor-id={page.elementorId}>
              {page.content.map((node) => (
                <ElementorNode key={node.id} node={node} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <ElementorBehaviors />
    </div>
  );
}
