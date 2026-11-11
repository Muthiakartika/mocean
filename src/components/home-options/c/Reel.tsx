"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { reelFrames } from "./frames";
import styles from "./Reel.module.css";

/** Live matchMedia value; false on the server and before hydration. */
function useMedia(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The reel: the stay frame by frame. On wide screens the section is tall and its
 * stage sticks while the page scrolls; every slice of scroll pulls the next frame
 * into the gate, where it flares orange. Phones, reduced motion and no JavaScript
 * get the same frames as a plain strip (side-scroll on tablets and up, stacked on phones).
 */
export default function Reel() {
  const sectionRef = useRef<HTMLElement>(null);
  const wide = useMedia("(min-width: 768px)");
  const calm = useMedia("(prefers-reduced-motion: reduce)");
  const live = wide && !calm;
  const [active, setActive] = useState(0);
  const count = reelFrames.length;

  // Live: scroll position inside the section picks the frame in the gate.
  useEffect(() => {
    if (!live) return;
    const section = sectionRef.current;
    if (!section) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const run = rect.height - window.innerHeight;
      const progress = run > 0 ? Math.min(Math.max(-rect.top / run, 0), 0.9999) : 0;
      setActive(Math.floor(progress * count));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [live, count]);

  // Plain strip: the frame crossing the middle of the screen is the one in the gate.
  useEffect(() => {
    if (live) return;
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-42% -30% -42% -30%" },
    );
    section.querySelectorAll("[data-index]").forEach((cell) => observer.observe(cell));
    return () => observer.disconnect();
  }, [live]);

  const goTo = (index: number) => {
    const section = sectionRef.current;
    if (!section || index < 0 || index >= count) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const run = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + ((index + 0.5) / count) * run, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      className={styles.reel}
      data-mode={live ? "live" : "static"}
      style={{ "--n": count, "--i": active } as React.CSSProperties}
      aria-labelledby="reel-title"
    >
      <div className={styles.stage}>
        <div className={styles.head}>
          <h2 id="reel-title" className={styles.heading}>
            The Mocean Life
          </h2>
          <div className={styles.transport}>
            <p className={styles.counter}>
              <span className={styles.counterLabel}>Frame</span>
              <span className={styles.pencil}>{pad(active + 1)}</span>
              <span className={styles.counterOf}>of {pad(count)}</span>
            </p>
            {live && (
              <div className={styles.buttons}>
                <button type="button" className={styles.step} onClick={() => goTo(active - 1)} disabled={active === 0}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15 5 8 12l7 7" />
                  </svg>
                  <span className={styles.srOnly}>Previous frame</span>
                </button>
                <button type="button" className={styles.step} onClick={() => goTo(active + 1)} disabled={active === count - 1}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m9 5 7 7-7 7" />
                  </svg>
                  <span className={styles.srOnly}>Next frame</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.gate}>
          <ol className={styles.strip}>
            {reelFrames.map((frame, index) => (
              <li key={frame.id} className={styles.cell} data-index={index} data-active={index === active || undefined}>
                <div className={styles.film}>
                  <p className={styles.edge}>
                    {frame.edge.map((fact) => (
                      <span key={fact}>{fact}</span>
                    ))}
                  </p>
                  <div className={styles.frame}>
                    <Image
                      src={frame.image}
                      alt={frame.alt}
                      fill
                      sizes="(max-width: 767px) 100vw, 60vw"
                      style={{ objectPosition: frame.focus ?? "50% 50%" }}
                    />
                    <span className={styles.leak} aria-hidden="true" />
                  </div>
                  <p className={styles.number} aria-hidden="true">
                    {pad(index + 1)}
                  </p>
                </div>
                <div className={styles.caption}>
                  <h3 className={styles.title}>{frame.title}</h3>
                  <p className={styles.text}>{frame.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
