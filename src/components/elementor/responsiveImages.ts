/**
 * Responsive images for the migrated Elementor / post HTML. The migration kept each image's original file as `src`
 * and lost WordPress's srcset, so phones downloaded photos of up to 2.8 MB (speed test 2026-11-04). Each upload gets a
 * srcset through the Next.js image optimiser (AVIF / WebP, as next/image on the homepage), in three widths only, so
 * few versions have to be made; the browser picks one from `sizes`. `src` stays the original file, so nothing changes
 * visually and `?original` still matches the live site.
 */

/** Must be in next.config.ts `images.deviceSizes`. */
const WIDTHS = [640, 1024, 1440];

/** Full width on phones, at most the 1320px content width on wide screens. */
const SIZES = "(max-width: 767px) 100vw, (max-width: 1440px) 92vw, 1320px";

export function responsiveImages(html: string): string {
  return html.replace(/<img\b([^>]*?)\s*(\/?)>/g, (tag, attrs: string, slash: string) => {
    if (/\ssrcset=/.test(attrs)) return tag;
    const src = attrs.match(/\ssrc="(\/images\/uploads\/[^"]+\.(?:jpe?g|png|webp))"/i)?.[1];
    if (!src) return tag;
    // The file's own width: from a WordPress size suffix ("-1024x895.jpg"), else the width attribute.
    const own = Number(src.match(/-(\d+)x\d+\.(?:jpe?g|png)(?:\.webp)?$/i)?.[1] ?? attrs.match(/\swidth="(\d+)"/)?.[1] ?? 0);
    const widths = WIDTHS.filter((w) => !own || w <= own);
    if (widths.length < 2) return tag;
    const srcset = widths.map((w) => `/_next/image/?url=${encodeURIComponent(src)}&amp;w=${w}&amp;q=75 ${w}w`).join(", ");
    return `<img${attrs} srcset="${srcset}" sizes="${SIZES}"${slash ? "/" : ""}>`;
  });
}
