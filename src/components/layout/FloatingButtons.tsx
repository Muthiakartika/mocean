import { contact } from "@/data/contact";
import { WhatsappIcon } from "@/components/shared/icons";
import BookButton from "./BookButton";
import styles from "./FloatingButtons.module.css";

/**
 * Floating WhatsApp + Cloudbeds buttons (bottom-right on every page).
 *
 * The book button is the same markup Cloudbeds expects on the original site:
 * `<button class="cb-book-btn" data-be-url="...">`. The Cloudbeds "immersive"
 * script finds it and opens the booking overlay when it is clicked (see BookButton).
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
