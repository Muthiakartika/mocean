"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

/** Widths the image optimiser serves (deviceSizes in next.config.ts), from phone up. */
const WIDTHS = [640, 768, 1024, 1280, 1440, 1920];

const optimised = (src: string, width: number) => `/_next/image/?url=${encodeURIComponent(src)}&w=${width}&q=75`;

type LazyBackgroundProps = {
  as?: "section" | "div";
  /** The photo, e.g. /images/uploads/2025/06/Banner-Homepage.jpg */
  src: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/**
 * A box with a photo as its CSS background, for sections below the fold. A plain background-image starts
 * downloading as soon as the page is laid out, so five full-size JPEGs (770 KB) went out ahead of the home hero
 * photo (speed test 2026-11-05). Here the photo is only set when the box comes within 600px of the screen, and
 * it comes through the image optimiser (AVIF / WebP) at the width the box needs.
 */
export default function LazyBackground({ as = "div", src, className, style, children }: LazyBackgroundProps) {
  const [box, setBox] = useState<HTMLElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!box) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const { width, height } = box.getBoundingClientRect();
        // background-size: cover makes a landscape photo wider than a tall box: allow for a 3:2 photo.
        const needed = Math.max(width, height * 1.5) * window.devicePixelRatio;
        setUrl(optimised(src, WIDTHS.find((w) => w >= needed) ?? WIDTHS[WIDTHS.length - 1]));
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, [box, src]);

  const boxStyle = url ? { ...style, backgroundImage: `url("${url}")` } : style;
  return as === "section" ? (
    <section ref={setBox} className={className} style={boxStyle}>
      {children}
    </section>
  ) : (
    <div ref={setBox} className={className} style={boxStyle}>
      {children}
    </div>
  );
}
