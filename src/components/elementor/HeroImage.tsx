import fs from "node:fs";
import path from "node:path";

/**
 * The hero of an inner page is a CSS background from the page's Elementor CSS: a full-size JPEG (up to 430 KB) that
 * the browser only finds once the CSS is in, which made it the slowest part of the page on phones (speed test
 * 2026-11-04). Here the same photo comes through the Next.js image optimiser (AVIF / WebP, 1440px up to tablets,
 * 1920px wider), 3 to 5 times smaller. The parallax layer copies the section's background (parallax.ts), so it follows.
 * No <link rel="preload">: Next.js prefetches the pages in the menu, and their preload hints then fetched every
 * page's hero on desktop. A plain <style> in the body only applies once the page is shown.
 */
const optimised = (src: string, width: number) => `/_next/image/?url=${encodeURIComponent(src)}&w=${width}&q=75`;

/** The background image the page CSS gives a section, if any. */
function backgroundOf(elementorId: string, sectionId: string): string | null {
  const file = path.join(process.cwd(), "src/styles/elementor", `post-${elementorId}.css`);
  if (!fs.existsSync(file)) return null;
  const css = fs.readFileSync(file, "utf8");
  const rule = css.match(new RegExp(`\\.elementor-element-${sectionId}(?![0-9a-f])[^{}]*\\{[^}]*background-image:\\s*url\\(["']?(/images/uploads/[^"')]+\\.(?:jpe?g|png|webp))["']?\\)`));
  return rule?.[1] ?? null;
}

export default function HeroImage({ elementorId, sectionId }: { elementorId: string; sectionId: string }) {
  const src = backgroundOf(elementorId, sectionId);
  if (!src) return null;
  const small = optimised(src, 1440);
  const large = optimised(src, 1920);
  // #mocean-page and two classes outrank the page CSS rule (four classes).
  const selector = `#mocean-page .elementor-element.elementor-element-${sectionId}`;
  return <style>{`${selector}{background-image:url("${small}")}@media (min-width:1025px){${selector}{background-image:url("${large}")}}`}</style>;
}
