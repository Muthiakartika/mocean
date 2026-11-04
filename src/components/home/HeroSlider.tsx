"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const dragStart = useRef<number | null>(null);

  const go = useCallback((step: number) => {
    setActive((current) => (current + step + heroSlides.length) % heroSlides.length);
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
          <Image
            className={styles.bg}
            src={slide.image}
            alt=""
            fill
            // The photo covers a tall frame on small screens, so it is shown wider than the screen
            // (frame height × photo ratio 1.83). These widths keep it sharp.
            sizes="(max-width: 479px) 275vw, (max-width: 777px) 227vw, 129vw"
            priority={index === 0}
            draggable={false}
          />
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
            onClick={() => setActive(index)}
          />
        ))}
      </div>
      <Wave />
    </section>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
