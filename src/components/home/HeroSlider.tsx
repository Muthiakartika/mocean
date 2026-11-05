"use client";

import { getImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { contact } from "@/data/contact";
import { heroSlides } from "@/data/homepage";
import styles from "./HeroSlider.module.css";
import Wave from "./Wave";

/** Each slide stays 4.5s (Slider Revolution "len": 4500). */
const SLIDE_DURATION = 4500;

/**
 * Home hero slider: 6 photos that cross-fade every 4.5s with a slow zoom,
 * the resort name and a "Book Now" link to Cloudbeds. Swipe/drag changes slide.
 * The redesign adds arrows, one dash per slide and a wavy bottom edge (all hidden with ?original).
 */
export default function HeroSlider() {
  const [active, setActive] = useState(0);
  // Which slides have been shown, and whether the page has finished loading. A slide's photo is only in the page
  // once it has been shown, or (after page load) when it is next to the shown one, ready for autoplay and the
  // arrows. The hidden slides sit inside the viewport, so loading="lazy" did not hold them back and all six
  // photos competed with the first one (speed test 2026-11-05, LCP 8.1s on phones).
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set([0]));
  const [pageLoaded, setPageLoaded] = useState(false);
  const dragStart = useRef<number | null>(null);
  const count = heroSlides.length;

  const show = useCallback((index: number) => {
    setActive(index);
    setSeen((current) => (current.has(index) ? current : new Set(current).add(index)));
  }, []);

  const go = useCallback((step: number) => show((active + step + count) % count), [active, count, show]);

  const hasPhoto = (index: number) =>
    seen.has(index) || (pageLoaded && (index === (active + 1) % count || index === (active - 1 + count) % count));

  useEffect(() => {
    const onLoad = () => setPageLoaded(true);
    if (document.readyState === "complete") {
      const timer = setTimeout(onLoad, 0);
      return () => clearTimeout(timer);
    }
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  // Autoplay: restart the timer whenever the slide changes (also after a swipe).
  useEffect(() => {
    const timer = setTimeout(() => go(1), SLIDE_DURATION);
    return () => clearTimeout(timer);
  }, [active, go]);

  // Swipe / mouse drag (Slider Revolution "swipe" navigation, on desktop too).
  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const distance = e.clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(distance) > 50) go(distance < 0 ? 1 : -1);
  };

  return (
    <section
      className={styles.hero}
      aria-roledescription="carousel"
      aria-label="Mocean Beach Resort"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {heroSlides.map((slide, index) => (
        <div
          key={slide.image}
          className={`${styles.slide} ${index === active ? styles.active : ""}`}
          aria-hidden={index !== active}
        >
          {hasPhoto(index) && <SlidePhoto slide={slide} first={index === 0} />}
          <div className={styles.overlay} />

          {/* Only the first slide's title is the page <h1>, as on the original. */}
          {index === 0 ? (
            <h1 className={`${styles.layer} ${styles.titleDesktop}`}>
              <span className={styles.layerInner}>Mocean Beach&nbsp;Resort</span>
            </h1>
          ) : (
            <div className={`${styles.layer} ${styles.titleDesktop}`}>
              <span className={styles.layerInner}>Mocean Beach&nbsp;Resort</span>
            </div>
          )}
          <div className={`${styles.layer} ${styles.titleMobile}`}>
            <span className={styles.layerInner}>
              Mocean Beach
              <br />
              &nbsp;Resort
            </span>
          </div>
          <div className={`${styles.layer} ${styles.subtitle}`}>
            <span className={styles.layerInner}>West Sumbawa, Indonesia</span>
          </div>
          <a className={`${styles.layer} ${styles.button}`} href={contact.cloudbedsUrl} tabIndex={index === active ? 0 : -1}>
            <span className={styles.layerInner}>Book Now</span>
          </a>
        </div>
      ))}

      <button type="button" className={`${styles.arrow} ${styles.prev}`} aria-label="Previous slide" onClick={() => go(-1)}>
        <Chevron />
      </button>
      <button type="button" className={`${styles.arrow} ${styles.next}`} aria-label="Next slide" onClick={() => go(1)}>
        <Chevron />
      </button>
      <div className={styles.dots}>
        {heroSlides.map((slide, index) => (
          <button
            key={slide.image}
            type="button"
            className={`${styles.dot} ${index === active ? styles.dotActive : ""}`}
            aria-label={`Slide ${index + 1} of ${heroSlides.length}`}
            aria-current={index === active ? "true" : undefined}
            onClick={() => show(index)}
          />
        ))}
      </div>
      <Wave />
    </section>
  );
}

/** Up to 777px the phone crop (46% of the width, ratio 0.84) is shown; wider screens get the whole photo. */
const WIDE = "(min-width: 778px)";
const NARROW = "(max-width: 777px)";
// How wide the photo is on screen. The frame is taller than the screen is wide on phones (1.5×, 1.23× from 480px)
// and shorter on wider screens (photo ratio 1.83), so object-fit: cover shows it wider than the screen.
const NARROW_SIZES = "(max-width: 479px) 126vw, 104vw";
const WIDE_SIZES = "129vw";

function SlidePhoto({ slide, first }: { slide: (typeof heroSlides)[number]; first: boolean }) {
  // The first photo is the LCP: loaded at once, at high priority. The others only load when they are about to show.
  const common = { alt: "", fill: true, loading: first ? "eager" : "lazy", fetchPriority: first ? "high" : "low" } as const;
  const wide = getImageProps({ ...common, src: slide.image, sizes: WIDE_SIZES }).props;
  const narrow = getImageProps({ ...common, src: slide.mobileImage, sizes: NARROW_SIZES }).props;

  if (first) {
    // React does not preload an <img> inside <picture> by itself: one preload per screen range.
    preload(narrow.src, { as: "image", imageSrcSet: narrow.srcSet, imageSizes: NARROW_SIZES, media: NARROW, fetchPriority: "high" });
    preload(wide.src, { as: "image", imageSrcSet: wide.srcSet, imageSizes: WIDE_SIZES, media: WIDE, fetchPriority: "high" });
  }

  return (
    <picture>
      <source media={WIDE} srcSet={wide.srcSet} sizes={WIDE_SIZES} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- props from getImageProps (alt="") */}
      <img {...narrow} className={styles.bg} draggable={false} />
    </picture>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
