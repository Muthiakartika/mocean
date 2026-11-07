"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./PostPage.module.css";

export type CarouselCard = {
  path: string;
  title: string;
  image: { src: string; width: number; height: number } | null;
  /** Small line above the title, e.g. the date ("16 October 2026"). */
  meta?: string | null;
  /** Label on the photo, e.g. "4 min read". */
  chip?: string | null;
};

/**
 * A row of linked cards that scrolls sideways, with round previous / next buttons: "Read Our Next Article" under the
 * blog posts (PostPage.tsx) and the related pages under the course and dive-site pages (relatedPages.ts).
 * Hidden with ?original (PostPage.module.css).
 */
export default function CardCarousel({ title, cards }: { title: string; cards: CarouselCard[] }) {
  const headingId = useId();
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const list = track.current;
    if (!list) return;
    const update = () =>
      setEdges({ start: list.scrollLeft < 4, end: list.scrollLeft + list.clientWidth > list.scrollWidth - 4 });
    update();
    list.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      list.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // One card (plus the gap) per click.
  const step = (direction: 1 | -1) => {
    const list = track.current;
    const card = list?.firstElementChild as HTMLElement | null;
    if (!list || !card) return;
    list.scrollBy({ left: direction * (card.offsetWidth + 24), behavior: "smooth" });
  };

  return (
    <section className={styles.more} aria-labelledby={headingId}>
      <div className={styles.moreHead}>
        <h2 id={headingId} className={styles.moreTitle}>
          {title}
        </h2>
        <div className={styles.arrows}>
          <button type="button" aria-label="Previous" disabled={edges.start} onClick={() => step(-1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </button>
          <button type="button" aria-label="Next" disabled={edges.end} onClick={() => step(1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
      <ul ref={track} className={styles.track}>
        {cards.map((card) => (
          <li key={card.path}>
            <Link href={card.path} className={styles.card}>
              {card.image && (
                <span className={styles.cardImage}>
                  {/* The card's title names the link; the photo adds nothing to it. */}
                  <Image src={card.image.src} alt="" width={card.image.width} height={card.image.height} sizes="(max-width: 767px) 80vw, 320px" />
                  {card.chip && <span className={styles.cardChip}>{card.chip}</span>}
                </span>
              )}
              <span className={styles.cardBody}>
                {card.meta && <span className={styles.cardMeta}>{card.meta}</span>}
                <span className={styles.cardTitle}>{card.title}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
