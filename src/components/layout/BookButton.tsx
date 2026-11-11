"use client";

import Image from "next/image";
import Script from "next/script";
import { contact } from "@/data/contact";
import styles from "./FloatingButtons.module.css";

/**
 * The Cloudbeds "immersive" script only wires `button[data-be-url]` (and adds its booking overlay to the page) in a
 * `window` DOMContentLoaded listener. With `lazyOnload` it runs after that event has already fired, so the button
 * stayed dead. Replay the event once the script is in. Safe today: no other script on the site listens for it on
 * `window` this late (Ahrefs checks `document.readyState` first).
 */
function wireCloudbeds() {
  if (document.readyState !== "loading") window.dispatchEvent(new Event("DOMContentLoaded"));
}

/**
 * Cloudbeds' own click listener sits on the button and runs before React's, so the overlay is already open here
 * when the widget works. If it is not (clicked before the lazy script loaded, or the script is blocked), open the
 * booking engine in a new tab instead, like the header's Book button.
 */
function openFallback() {
  if (!document.querySelector("#immersive-experience-overlay.open")) {
    window.open(contact.cloudbedsUrl, "_blank", "noopener");
  }
}

/** Floating Cloudbeds book button (widget 35bad87, class .cb-book-btn), the same markup Cloudbeds expects. */
export default function BookButton() {
  return (
    <>
      <button
        type="button"
        className={`cb-book-btn ${styles.bookButton}`}
        data-be-url={contact.cloudbedsUrl}
        aria-label="Book Now"
        onClick={openFallback}
      >
        {/* A 35px icon: the optimiser sends ~100px instead of the 704px PNG (12 KB), lazily, after the hero photo. */}
        <Image
          className={styles.bookIcon}
          src="/images/uploads/2025/11/mattress.png"
          alt=""
          width={704}
          height={704}
          sizes="35px"
        />
      </button>

      {/* After page load, so the widget does not compete with the first paint. */}
      <Script src={contact.cloudbedsWidgetScript} strategy="lazyOnload" onLoad={wireCloudbeds} />
    </>
  );
}
