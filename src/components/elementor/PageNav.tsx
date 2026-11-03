"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./PageNav.module.css";

type Section = { id: string; label: string };

/** Pages shorter than this many screens get neither the jump-nav nor the back-to-top button. */
const LONG_PAGE_SCREENS = 4;
const MIN_SECTIONS = 3;

/** In-page anchor targets in document order, labelled by the text of the links that point to them. */
function findSections(content: HTMLElement): Section[] {
  const labels = new Map<string, string>();
  content.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    const id = decodeURIComponent(link.hash.slice(1));
    // innerText: rendered text only (icon links carry an SVG <style> block in textContent).
    const label = link.innerText.replace(/\s+/g, " ").trim();
    if (id && label && !labels.has(id)) labels.set(id, label);
  });
  return [...labels.entries()]
    .map(([id, label]) => ({ id, label, el: document.getElementById(id) }))
    .filter((s): s is Section & { el: HTMLElement } => !!s.el && content.contains(s.el))
    .sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    .map(({ id, label }) => ({ id, label }));
}

/**
 * Redesign (MASTER.md): a sticky jump-nav built from the page's own table-of-contents links
 * (dive sites, surf spots), plus a back-to-top button on long pages.
 * Not rendered for the original design ("?original") or on short pages.
 */
export default function PageNav() {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLong, setIsLong] = useState(false);
  const [pastToc, setPastToc] = useState(false);
  const [atFooter, setAtFooter] = useState(false);
  const [topVisible, setTopVisible] = useState(false);
  const [scrollingUp, setScrollingUp] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Read the page after its first layout.
  useEffect(() => {
    if (document.documentElement.dataset.design === "original") return;
    const frame = requestAnimationFrame(() => {
      const content = document.getElementById("content");
      if (!content) return;
      const long = document.documentElement.scrollHeight > window.innerHeight * LONG_PAGE_SCREENS;
      setIsLong(long);
      const found = findSections(content);
      if (long && found.length >= MIN_SECTIONS) setSections(found);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Show the bar once the page's own table of contents has scrolled away (until the footer comes in),
  // and mark the section being read.
  useEffect(() => {
    if (!sections.length) return;
    const tocLink = document.querySelector<HTMLAnchorElement>(`#content a[href="#${CSS.escape(sections[0].id)}"]`);
    const observers: IntersectionObserver[] = [];

    if (tocLink) {
      const toc = new IntersectionObserver(([entry]) => setPastToc(!entry.isIntersecting && entry.boundingClientRect.top < 0));
      toc.observe(tocLink);
      observers.push(toc);
    }

    const footer = document.querySelector("footer");
    if (footer) {
      const end = new IntersectionObserver(([entry]) => setAtFooter(entry.isIntersecting));
      end.observe(footer);
      observers.push(end);
    }

    const reading = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setCurrent(hit.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) reading.observe(el);
    });
    observers.push(reading);
    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  // Back-to-top appears after two screens of scrolling.
  useEffect(() => {
    if (!isLong) return;
    const marker = document.createElement("div");
    marker.setAttribute("aria-hidden", "true");
    marker.style.cssText = "position:absolute;top:200vh;left:0;width:1px;height:1px;pointer-events:none";
    document.body.appendChild(marker);
    const observer = new IntersectionObserver(([entry]) => setTopVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(marker);
    return () => {
      observer.disconnect();
      marker.remove();
    };
  }, [isLong]);

  // Scroll direction: on phones the back-to-top button only shows while scrolling up (CSS), so it does not
  // sit over the text being read next to the WhatsApp and booking buttons.
  useEffect(() => {
    if (!isLong) return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 24) return;
      setScrollingUp(y < last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLong]);

  // Keep the current pill in view inside the bar (horizontal only, never moves the page).
  useEffect(() => {
    const bar = barRef.current;
    const pill = current ? bar?.querySelector<HTMLElement>(`[data-id="${CSS.escape(current)}"]`) : null;
    if (!bar || !pill) return;
    const left = pill.offsetLeft - (bar.clientWidth - pill.offsetWidth) / 2;
    bar.scrollTo({ left, behavior: "smooth" });
  }, [current]);

  if (!isLong) return null;
  const navVisible = pastToc && !atFooter;

  return (
    <>
      {sections.length > 0 && (
        <div className={`${styles.wrap} ${navVisible ? styles.visible : ""}`} inert={!navVisible}>
          <nav className={styles.bar} aria-label="On this page">
            <div className={styles.track} ref={barRef}>
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} data-id={s.id} className={styles.pill} aria-current={current === s.id ? "true" : undefined}>
                  {s.label}
                </a>
              ))}
            </div>
          </nav>
        </div>
      )}
      <button
        type="button"
        className={`${styles.top} ${topVisible ? styles.visible : ""} ${scrollingUp ? styles.up : ""}`}
        aria-label="Back to top"
        tabIndex={topVisible ? 0 : -1}
        onClick={() => window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
      />
    </>
  );
}
