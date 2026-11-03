import { Fragment } from "react";
import JsonLd from "@/components/shared/JsonLd";
import ElementorBehaviors from "./ElementorBehaviors";
import ElementorNode from "./ElementorNode";
import { faqCollages } from "./faqPhotos";
import { PageFacts } from "./Facts";
import PageNav from "./PageNav";
import type { PageContent } from "./types";

import "./styles";

/**
 * An inner page built from the original Elementor content.
 * The wrappers reproduce the original page structure:
 *   body.elementor-kit-12054 > .main-contain > .container (here: .theme-container) > #content > .elementor.elementor-<id>
 */
export default function ElementorPage({ page }: { page: PageContent }) {
  const collages = faqCollages(page.content);
  return (
    // #mocean-page scopes the redesign layer (src/styles/redesign/inner-pages.css).
    <div id="mocean-page" className="elementor-kit-12054 elementor-page" data-path={page.path}>
      <JsonLd path={page.path} />
      <div className="main-contain">
        {/* The theme's ".container" is full width here; renamed so Tailwind's `container` utility doesn't apply. */}
        <div className="theme-container">
          <div id="content">
            <div className={`elementor elementor-${page.elementorId}`} data-elementor-type="wp-page" data-elementor-id={page.elementorId}>
              {page.content.map((node, i) => (
                <Fragment key={node.id}>
                  <ElementorNode node={node} path={page.path} collages={collages} />
                  {/* Logbook redesign: key figures directly under the hero. */}
                  {i === 0 && <PageFacts path={page.path} />}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ElementorBehaviors />
      <PageNav />
    </div>
  );
}
