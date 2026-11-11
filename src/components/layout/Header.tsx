import Link from "next/link";
import Button from "@/components/shared/Button";
import { WhatsappIcon } from "@/components/shared/icons";
import { contact } from "@/data/contact";
import HeaderScroll from "./HeaderScroll";
import MainNav from "./MainNav";
import styles from "./Header.module.css";

/**
 * Site header: a thin location line, then logo, main menu (desktop dropdown / mobile off-canvas) and "Book Now".
 * The location line (redesign only, hidden with ?original) puts the resort's place and phone on every page, in the same
 * words as the footer and the structured data (local search reads name, address and phone together). It folds away
 * once the page scrolls, so the sticky header stays slim.
 */
export default function Header() {
  return (
    <header className={styles.header}>
      <HeaderScroll />
      <div className={styles.bar}>
        <div className={styles.topline}>
          <div className={styles.toplineInner}>
            <a className={styles.toplineItem} href={contact.mapsUrl} target="_blank" rel="noopener">
              <i aria-hidden="true" className={`rt rt-location-dot ${styles.toplineIcon}`} />
              <span>
                {contact.address}
                <span className={styles.toplineNote}> · 30 min from Poto Tano ferry</span>
              </span>
            </a>
            <a className={`${styles.toplineItem} ${styles.toplinePhone}`} href={contact.whatsappUrl} target="_blank" rel="noopener">
              <WhatsappIcon className={styles.toplineIcon} />
              <span>WhatsApp {contact.phoneDisplay}</span>
            </a>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.logoCol}>
            <Link href="/" className={styles.logoLink}>
              {/* Plain <img>: the logo is small and must keep its exact rendered size. */}
              {/* The 1024px file (8 KB) is still sharp on 3x screens; the full one was 40 KB for a 172px logo. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.logo}
                src="/images/uploads/2025/02/Mocean-FULL-Logo_White-1024x578.png"
                // The logo is the link to the homepage: its alt is the link's name (was the file name).
                alt="Mocean Beach Resort"
                width={2048}
                height={1156}
              />
            </Link>
          </div>

          <div className={styles.menuCol}>
            <MainNav />
          </div>

          <div className={styles.buttonCol}>
            {/* Block wrapper: its line box makes the column 52px tall, like the original widget. */}
            <div>
              <Button href={contact.cloudbedsUrl} newTab nofollow solidBorder>
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
