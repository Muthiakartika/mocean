import { contact } from "@/data/contact";
import { WhatsappIcon } from "@/components/shared/icons";
import BookButton from "./BookButton";
import styles from "./FloatingButtons.module.css";

/**
 * Floating WhatsApp + Cloudbeds buttons (bottom-right on every page).
 *
 * The book button opens the Cloudbeds booking page in a new tab (see BookButton:
 * Cloudbeds retired the "immersive" overlay the original site used).
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
        <BookButton />
      </div>
    </div>
  );
}
