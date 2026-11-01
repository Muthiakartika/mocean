import Image from "next/image";
import JsonLd from "@/components/shared/JsonLd";
import ElementorBehaviors from "./ElementorBehaviors";
import ElementorNode from "./ElementorNode";
import type { ElementorNode as Node } from "./types";

// Same shared CSS as ElementorPage, plus Gutenberg block styles and the post layout.
import "./styles";
import "@/styles/elementor/vendor/wp-block-library.css";
import "@/styles/elementor/vendor/wp-block-library-theme.css";
import "@/styles/elementor/posts.css";

export type PostContent = {
  path: string;
  /** Elementor template used as the banner of every post (post-12031.css). */
  bannerId: string;
  banner: Node[];
  articleClasses: string;
  featuredImage: { src: string; alt: string; width: number; height: number } | null;
  /** Article HTML (Gutenberg blocks, sometimes with embedded Elementor sections). */
  html: string;
  embeddedElementorIds: string[];
};

/**
 * A blog post, rebuilt like the Moonlit theme's single post template:
 * banner with the title, then featured image and article text.
 */
export default function PostPage({ post }: { post: PostContent }) {
  return (
    <div className="elementor-kit-12054 post-page">
      <JsonLd path={post.path} />
      <div className="footer-width-fixer">
        <div className={`elementor elementor-${post.bannerId}`} data-elementor-type="wp-post" data-elementor-id={post.bannerId}>
          {post.banner.map((node) => (
            <ElementorNode key={node.id} node={node} />
          ))}
        </div>
      </div>

      <div className="main-contain">
        <div className="theme-container">
          <div id="content">
            <div className="reactheme-blog-details 12 rt-add-full-single">
              <div className="row">
                <div className="col-lg-12 rt-add-full-single">
                  <div className="news-details-inner">
                    <article className={post.articleClasses}>
                      {post.featuredImage && (
                        <div className="bs-img">
                          <Image
                            className="attachment-post-thumbnail size-post-thumbnail wp-post-image"
                            src={post.featuredImage.src}
                            alt={post.featuredImage.alt}
                            width={post.featuredImage.width}
                            height={post.featuredImage.height}
                            sizes="(max-width: 1280px) 100vw, 1251px"
                            style={{ display: "inline", height: "auto" }}
                          />
                        </div>
                      )}
                      <div className="single-content-full">
                        {/* Trusted HTML extracted from the client's own website. */}
                        <div className="bs-desc" dangerouslySetInnerHTML={{ __html: post.html }} />
                      </div>
                      <div className="clear-fix" />
                    </article>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ElementorBehaviors />
    </div>
  );
}
