"use client";

import { useEffect, useState } from "react";
import { applyParallax } from "./parallax";
import { startTestimonialSliders } from "./sliders";
import Lightbox, { type LightboxSlide } from "./Lightbox";

/**
 * Adds the interactive behaviour that Elementor's JavaScript provided on the original site:
 *   - entrance animations (fadeInUp) when an element scrolls into view
 *   - nested tabs (switch panels on click)
 *   - nested accordions (only one item open at a time)
 *   - parallax images and section backgrounds (jarallax)
 *   - image lightbox for gallery / image links
 *   - testimonial sliders
 * It works on the HTML rendered by ElementorNode, the same way Elementor did.
 */
export default function ElementorBehaviors() {
  const [lightbox, setLightbox] = useState<{ slides: LightboxSlide[]; index: number } | null>(null);

  // Entrance animations
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-animation].elementor-invisible");
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.classList.remove("elementor-invisible");
        el.classList.add("animated", el.dataset.animation!);
        observer.unobserve(el);
      }
    });
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Tabs, accordions and lightbox links (event delegation on the page)
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Nested tabs
      const tab = target.closest<HTMLButtonElement>(".e-n-tab-title");
      if (tab) {
        const tabs = tab.closest(".e-n-tabs")!;
        const index = tab.dataset.tabIndex;
        tabs.querySelectorAll<HTMLElement>(":scope > .e-n-tabs-heading > .e-n-tab-title, :scope > .e-n-tabs-content > .e-n-tab-title").forEach((t) => {
          const active = t.dataset.tabIndex === index;
          t.setAttribute("aria-selected", String(active));
          t.tabIndex = active ? 0 : -1;
        });
        tabs.querySelectorAll<HTMLElement>(":scope > .e-n-tabs-content > [role=tabpanel]").forEach((panel) => {
          panel.classList.toggle("e-active", panel.dataset.tabIndex === index);
        });
        return;
      }

      // Lightbox
      const link = target.closest<HTMLAnchorElement>('a[data-elementor-open-lightbox="yes"]');
      if (link) {
        event.preventDefault();
        const group = link.dataset.elementorLightboxSlideshow;
        const links = group
          ? [...document.querySelectorAll<HTMLAnchorElement>(`a[data-elementor-lightbox-slideshow="${group}"]`)]
          : [link];
        setLightbox({
          slides: links.map((a) => ({ src: a.getAttribute("href")!, title: a.dataset.elementorLightboxTitle ?? "" })),
          index: Math.max(0, links.indexOf(link)),
        });
      }
    };

    // Accordion: when an item opens, close the others (Elementor "max items expanded: one").
    const onToggle = (event: Event) => {
      const item = event.target as HTMLDetailsElement;
      if (!item.matches?.(".e-n-accordion-item") || !item.open) return;
      const summary = item.querySelector(":scope > summary");
      summary?.setAttribute("aria-expanded", "true");
      item.parentElement?.querySelectorAll<HTMLDetailsElement>(":scope > .e-n-accordion-item[open]").forEach((other) => {
        if (other !== item) {
          other.open = false;
          other.querySelector(":scope > summary")?.setAttribute("aria-expanded", "false");
        }
      });
    };

    document.addEventListener("click", onClick);
    document.addEventListener("toggle", onToggle, true);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("toggle", onToggle, true);
    };
  }, []);

  // Parallax (jarallax) for images and section backgrounds
  useEffect(() => applyParallax(), []);

  // Testimonial sliders (Swiper on the original)
  useEffect(() => startTestimonialSliders(), []);

  return lightbox ? (
    <Lightbox slides={lightbox.slides} startIndex={lightbox.index} onClose={() => setLightbox(null)} />
  ) : null;
}
