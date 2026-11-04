"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./PageNav.module.css";

/** `tab`: a surf spot that is a tab on the page (chapters.ts); its entry opens that tab. */
type Section = { id: string; label: string; tab?: string };

/** Pages shorter than this many screens get neither the jump-nav nor the back-to-top button. */
const LONG_PAGE_SCREENS = 4;
const MIN_SECTIONS = 3;
/** The surf guides list only their spots, two on some pages. */
const MIN_CHAPTERS = 2;

/** The surf spots of a surf guide (rd-chapter markers from chapters.ts), when the page has them. */
function findChapters(content: HTMLElement): Section[] {
  return [...content.querySelectorAll<HTMLElement>(".rd-chapter[data-rd-chapter]")].map((el) => ({
    id: el.id,
    label: el.dataset.rdChapter!,
    tab: el.dataset.rdTab,
  }));
}

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
 * Redesign (MASTER.md): a sticky jump-nav built from the page's own table-of-contents links (dive sites) or from
 * the page's sections (surf guides, chapters.ts), plus a back-to-top button on long pages.
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
      const chapters = findChapters(content);
      const found = chapters.length >= MIN_CHAPTERS ? chapters : findSections(content);
      if (long && found.length >= (found === chapters ? MIN_CHAPTERS : MIN_SECTIONS)) setSections(found);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Show the bar once the page's own table of contents (on the surf guides: the hero) has scrolled away, until the
  // footer comes in, and mark the section being read.
  useEffect(() => {
    if (!sections.length) return;
    const tocLink =
      document.querySelector<HTMLElement>(`#content a[href="#${CSS.escape(sections[0].id)}"]`) ??
      (document.querySelector(".rd-chapter") ? document.querySelector<HTMLElement>("#content .elementor > .e-con:first-child") : null);
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

    // A surf guide marker is an empty dot at the top of its section: the whole section is watched instead. Several
    // spots can share a section (tabs): the one whose tab is open is the one being read.
    const watched = new Map<Element, Section[]>();
    const isOpen = (s: Section) => !!s.tab && document.getElementById(s.tab)?.getAttribute("aria-selected") === "true";
    const reading = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const list = hit && watched.get(hit.target);
        if (list) setCurrent((list.find(isOpen) ?? list[0]).id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      const target = el?.classList.contains("rd-chapter") ? el.closest(".elementor > .e-con") : el;
      if (!target) return;
      watched.set(target, [...(watched.get(target) ?? []), s]);
      reading.observe(target);
    });
    observers.push(reading);

    // Opening a spot's tab on the page marks it in the bar too (after ElementorBehaviors has switched it).
    const onTabClick = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest(".e-n-tab-title")) return;
      requestAnimationFrame(() => {
        const open = sections.find(isOpen);
        if (open) setCurrent(open.id);
      });
    };
    document.addEventListener("click", onTabClick);
    return () => {
      observers.forEach((o) => o.disconnect());
      document.removeEventListener("click", onTabClick);
    };
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
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  data-id={s.id}
                  className={styles.pill}
                  aria-current={current === s.id ? "true" : undefined}
                  // A spot that is a tab: open it (ElementorBehaviors switches the panel), then the link scrolls there.
                  onClick={s.tab ? () => document.getElementById(s.tab!)?.click() : undefined}
                >
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
