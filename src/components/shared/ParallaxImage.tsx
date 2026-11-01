"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import styles from "./ParallaxImage.module.css";

type ParallaxImageProps = {
  src: string;
  alt?: string;
  width: number;
  height: number;
  /** Sizes hint for next/image (how wide the image is on screen). */
  sizes: string;
  /** Class that sets the frame height (e.g. `height: 574px`) and border radius. */
  className?: string;
};

/** Same as jarallax "scroll" type with speed 0.5 (used by the Moonlit theme on images). */
const SPEED = 0.5;

/**
 * Image that moves slower than the page while scrolling (parallax).
 * The math is copied from the jarallax library used on the original site,
 * so the image moves exactly the same way.
 */
export default function ParallaxImage({ src, alt = "", width, height, sizes, className }: ParallaxImageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image) return;

    let frameRequest = 0;

    const update = () => {
      frameRequest = 0;
      const rect = frame.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const frameHeight = rect.height;

      // Image is taller than its frame so there is room to move.
      const imageHeight = frameHeight + (windowHeight - frameHeight) * (1 - SPEED);
      const marginTop = (windowHeight - imageHeight) / 2;
      const scrollDistance = (SPEED * (frameHeight + windowHeight)) / 2;

      // -1 when the frame leaves at the top, 1 when it enters at the bottom.
      const fromViewportCenter = 1 - 2 * ((windowHeight - rect.top) / (windowHeight + frameHeight));
      const offset = scrollDistance * fromViewportCenter - rect.top;

      image.style.height = `${imageHeight}px`;
      image.style.marginTop = `${marginTop}px`;
      image.style.transform = `translate3d(0, ${offset}px, 0)`;
    };

    const requestUpdate = () => {
      if (!frameRequest) frameRequest = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      cancelAnimationFrame(frameRequest);
    };
  }, []);

  return (
    <div ref={frameRef} className={`${styles.frame} ${className ?? ""}`}>
      <div className={styles.clip}>
        <Image ref={imageRef} className={styles.image} src={src} alt={alt} width={width} height={height} sizes={sizes} />
      </div>
    </div>
  );
}
