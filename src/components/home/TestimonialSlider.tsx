"use client";

import { useEffect, useState } from "react";
import { testimonials } from "@/data/homepage";
import styles from "./Testimonials.module.css";

/** Original Swiper settings: 1 slide, 3s slide animation, 3s pause, endless loop. */
const SPEED = 3000;
const DELAY = 3000;

type Testimonial = (typeof testimonials.items)[number];

function Slide({ item }: { item: Testimonial }) {
  return (
    <div className={styles.slide}>
      <div className={styles.item}>
        <div className={styles.stars}>
          <span className="sr-only-text">5.0 rating based on 1,234 ratings</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} aria-hidden="true" className={styles.star} />
          ))}
        </div>
        <span className={styles.text}>{item.text}</span>
        <div className={styles.author}>
          <div className={styles.avatar}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.avatar} alt="" width={64} height={64} loading="lazy" />
          </div>
          <div className={styles.authorInfo}>
            <h6 className={styles.authorName}>{item.author}</h6>
            <span className={styles.authorSource}>{item.source}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Guest reviews slider. A copy of the first review is placed at the end so the
 * loop always slides forward; after reaching the copy it jumps back to the start.
 */
export default function TestimonialSlider() {
  const items = testimonials.items;
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    // On the copy slide we wait for onTransitionEnd to jump back instead.
    if (index === items.length) return;
    // After an animated move, wait for the 3s slide animation plus the 3s pause.
    const wait = animate && index > 0 ? SPEED + DELAY : DELAY;
    const timer = setTimeout(() => {
      setAnimate(true);
      setIndex((i) => i + 1);
    }, wait);
    return () => clearTimeout(timer);
  }, [index, animate, items.length]);

  // When the copy of the first slide is shown, jump back to the real first slide.
  const onTransitionEnd = () => {
    if (index === items.length) {
      setAnimate(false);
      setIndex(0);
    }
  };

  return (
    <div className={styles.slider} data-slider>
      <div
        className={styles.track}
        style={{ transform: `translate3d(${-index * 100}%, 0, 0)`, transitionDuration: animate ? `${SPEED}ms` : "0ms" }}
        onTransitionEnd={onTransitionEnd}
      >
        {[...items, items[0]].map((item, i) => (
          <Slide key={i} item={item} />
        ))}
      </div>
    </div>
  );
}
