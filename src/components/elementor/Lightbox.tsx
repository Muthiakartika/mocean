"use client";

import { useCallback, useEffect, useState } from "react";

export type LightboxSlide = { src: string; title: string };

/**
 * Full-screen image viewer, rebuilt with Elementor's lightbox class names so the
 * original lightbox CSS (vendor/lightbox.css + dialog.css) styles it.
 * Arrows / keyboard (←, →, Esc) / click outside the image to close.
 */
export default function Lightbox({ slides, startIndex, onClose }: { slides: LightboxSlide[]; startIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(startIndex);
  const count = slides.length;
  const go = useCallback((step: number) => setIndex((i) => (i + step + count) % count), [count]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  const slide = slides[index];

  return (
    <div
      className="dialog-widget dialog-lightbox-widget dialog-type-buttons dialog-type-lightbox elementor-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      style={{ display: "block" }}
    >
      <div className="dialog-widget-content dialog-lightbox-widget-content">
        <button type="button" className="dialog-lightbox-close-button dialog-close-button" aria-label="Close" onClick={onClose}>
          <svg aria-hidden="true" className="e-font-icon-svg e-eicon-close" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <path d="M742 167L500 408 258 167C246 154 233 150 217 150 196 150 179 158 167 167 154 179 150 196 150 212 150 229 154 242 171 254L408 500 167 742C138 771 138 800 167 829 196 858 225 858 254 829L496 587 738 829C750 842 767 846 783 846 800 846 817 842 829 829 842 817 846 804 846 783 846 767 842 750 829 737L588 500 833 258C863 229 863 200 833 171 804 137 775 137 742 167Z" />
          </svg>
        </button>
        <div
          className="dialog-message dialog-lightbox-message"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div className="elementor-lightbox-item elementor-lightbox-slideshow" style={{ height: "100%" }}>
            <div className="swiper elementor-slideshow__swiper" style={{ height: "100%" }}>
              <div className="elementor-slideshow__header elementor-lightbox-prevent-close">
                <span className="elementor-slideshow__counter">
                  {index + 1} / {count}
                </span>
              </div>
              <div className="swiper-wrapper" style={{ height: "100%" }}>
                <div
                  className="swiper-slide elementor-lightbox-item swiper-slide-active"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="elementor-lightbox-image" src={slide.src} alt={slide.title} />
                </div>
              </div>
              {count > 1 && (
                <>
                  <button type="button" className="elementor-swiper-button elementor-swiper-button-prev" aria-label="Previous slide" onClick={() => go(-1)}>
                    <svg aria-hidden="true" className="e-font-icon-svg e-eicon-chevron-left" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
                      <path d="M646 125C629 125 613 133 604 142L308 442C296 454 292 471 292 487 292 504 296 521 308 533L604 854C617 867 629 875 646 875 663 875 679 871 692 858 704 846 713 829 713 812 713 796 708 779 692 767L438 487 692 225C700 217 708 204 708 187 708 171 704 154 692 142 675 129 663 125 646 125Z" />
                    </svg>
                  </button>
                  <button type="button" className="elementor-swiper-button elementor-swiper-button-next" aria-label="Next slide" onClick={() => go(1)}>
                    <svg aria-hidden="true" className="e-font-icon-svg e-eicon-chevron-right" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
                      <path d="M696 533C708 521 713 504 713 487 713 471 708 454 696 446L400 146C388 133 375 125 354 125 338 125 325 129 313 142 300 154 292 171 292 187 292 204 296 221 308 233L563 492 304 771C292 783 288 800 288 817 288 833 296 850 308 863 321 871 338 875 354 875 371 875 388 867 400 854L696 533Z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
