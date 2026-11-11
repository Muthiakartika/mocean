import Image from "next/image";
import { contact } from "@/data/contact";
import styles from "./FloatingButtons.module.css";

/**
 * Floating book button (widget 35bad87, class .cb-book-btn): opens the Cloudbeds booking page in a new tab, like the
 * header's "Book Now".
 *
 * It used to open Cloudbeds' "immersive" overlay (script /widget/load/yPrE1K/immersive). Cloudbeds retired that
 * overlay: by 2026-11-11 it only showed a card saying "This live booking component is outdated" with another Book Now
 * link and an email line that ran out of the card, all inside Cloudbeds' iframe where the site's CSS cannot reach.
 * A plain link takes guests straight to the booking page and drops the third-party script from every page.
 */
export default function BookButton() {
  return (
    <a
      className={`cb-book-btn ${styles.bookButton}`}
      href={contact.cloudbedsUrl}
      target="_blank"
      rel="nofollow noopener"
      aria-label="Book Now"
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
    </a>
  );
}
