import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/components/shared/JsonLd";
import ElementorBehaviors from "./ElementorBehaviors";
import ElementorNode from "./ElementorNode";
import HeroImage from "./HeroImage";
import CardCarousel from "./CardCarousel";
import { formatDate, postSummary, relatedPosts } from "./postIndex";
import { responsiveImages } from "./responsiveImages";
import type { ElementorNode as Node } from "./types";
import styles from "./PostPage.module.css";

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
 *
 * The redesign (owner reference 2026-11-06) sets the post in one rounded panel: a "News" chip and the date, the title
 * (the banner's own H1, without its photo), the photo and the text; then "Read Our Next Article", the other posts in a
 * sideways row. ?original hides the chip line and the row, and the panel is then a plain wrapper.
 */
export default function PostPage({ post }: { post: PostContent }) {
  const summary = postSummary(post.path);
  // Every other post, starting after this one, so the first cards differ from post to post.
  const more = relatedPosts(post.path, 99).map((item) => ({
    path: item.path,
    title: item.title,
    image: item.image,
    meta: item.date ? formatDate(item.date) : null,
    chip: `${item.minutes} min read`,
  }));
  // Gutenberg posts get the narrow reading column; posts built in Elementor keep their own layout.
  const isArticle = post.embeddedElementorIds.length === 0;

  return (
    // #mocean-page scopes the redesign layer (src/styles/redesign/inner-pages.css); data-look="waves" adds
    // the homepage look over it (waves-pages.css).
    <div
      id="mocean-page"
      className={`elementor-kit-12054 post-page${isArticle ? " rd-post-article" : ""}`}
      data-path={post.path}
      data-look="waves"
    >
      <JsonLd path={post.path} />
      {post.banner[0] && <HeroImage elementorId={post.bannerId} sectionId={post.banner[0].id} />}

      <div className={styles.panel}>
        {summary && (
          <div className={styles.meta}>
            <Link href="/news/" className={styles.chip}>
              News
            </Link>
            <p className={styles.date}>
              {summary.date && (
                <>
                  Updated <time dateTime={summary.date}>{formatDate(summary.date)}</time>
                  <span aria-hidden="true"> · </span>
                </>
              )}
              {summary.minutes} min read
            </p>
          </div>
        )}

        <div className="footer-width-fixer">
          <div className={`elementor elementor-${post.bannerId}`} data-elementor-type="wp-post" data-elementor-id={post.bannerId}>
            {post.banner.map((node, i) => (
              <ElementorNode key={node.id} node={node} path={post.path} extraClass={i === 0 ? "rd-wave-hero rd-wave-bottom rd-post-banner" : undefined} />
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
                              // The first photo on screen now (the banner photo is gone). No preload: see HeroImage.tsx.
                              loading="eager"
                              fetchPriority="high"
                              style={{ display: "inline", height: "auto" }}
                            />
                          </div>
                        )}
                        <div className="single-content-full">
                          {/* Trusted HTML extracted from the client's own website. */}
                          <div className="bs-desc" dangerouslySetInnerHTML={{ __html: responsiveImages(post.html) }} />
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
      </div>

      {more.length > 0 && <CardCarousel title="Read Our Next Article" cards={more} />}
      <ElementorBehaviors />
    </div>
  );
}
