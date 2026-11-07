"use client";

import { useEffect } from "react";

/**
 * Sets data-scrolled on <html> once the page is scrolled a little, so the sticky header can show its glass background
 * (see Header.module.css). Renders nothing.
 */
export default function HeaderScroll() {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      if (window.scrollY > 24) root.dataset.scrolled = "";
      else delete root.dataset.scrolled;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      delete root.dataset.scrolled;
    };
  }, []);

  return null;
}
