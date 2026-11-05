import Image from "next/image";
import Script from "next/script";
import { contact } from "@/data/contact";
import { WhatsappIcon } from "@/components/shared/icons";
import styles from "./FloatingButtons.module.css";

/**
 * Floating WhatsApp + Cloudbeds buttons (bottom-right on every page).
 *
 * The book button is the same markup Cloudbeds expects on the original site:
 * `<button class="cb-book-btn" data-be-url="...">`. The Cloudbeds "immersive"
 * script finds it and opens the booking overlay when it is clicked.
 */
export default function FloatingButtons() {
  return (
    <div className={styles.layer}>
      <div className={styles.whatsapp}>
        <a className={styles.whatsappLink} href={contact.whatsappUrl} aria-label="WhatsApp">
          <WhatsappIcon />
        </a>
      </div>

      <div className={styles.book}>
        <button className={`cb-book-btn ${styles.bookButton}`} data-be-url={contact.cloudbedsUrl}>
          {/* A 35px icon: the optimiser sends ~100px instead of the 704px PNG (12 KB), lazily, after the hero photo. */}
          <Image
            className={styles.bookIcon}
            src="/images/uploads/2025/11/mattress.png"
            alt="Book Now"
            width={704}
            height={704}
            sizes="35px"
          />
        </button>
      </div>

      {/* After page load, so the widget does not compete with the first paint. */}
      <Script src={contact.cloudbedsWidgetScript} strategy="lazyOnload" />
    </div>
  );
}
