import Link from "next/link";
import { contact } from "@/data/contact";
import { footerGuideLinks } from "@/data/navigation";
import { FacebookIcon, InstagramIcon, WhatsappIcon, EnvelopeIcon } from "@/components/shared/icons";
import styles from "./Footer.module.css";

/** Site footer: logos, guide links, contact info, map and copyright. */
export default function Footer() {
  const [row1, row2] = footerGuideLinks;
  const postal = contact.postalAddress;

  return (
    <footer className={styles.footer}>
      <div className={styles.main}>
        <div className={styles.columns}>
          {/* Logos */}
          <div className={styles.column}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.logo}
              src="/images/uploads/2025/02/Mocean-FULL-Logo_White-1024x578.png"
              alt=""
              width={640}
              height={361}
              loading="lazy"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.padi}
              src="/images/uploads/2025/02/PADI_Logo_SASO_EN_27-new-1024x151.png"
              alt=""
              width={640}
              height={94}
              loading="lazy"
            />
          </div>

          {/* Surf and Dive Guide */}
          <div className={`${styles.column} ${styles.columnLinks}`}>
            <div className={styles.heading}>Surf and Dive Guide</div>
            <div>
              <ul className={`${styles.inlineList} ${styles.inlineRow1}`}>
                {row1.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href!}>{link.label}</Link>
                  </li>
                ))}
              </ul>
              <ul className={`${styles.inlineList} ${styles.inlineRow2}`}>
                {row2.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href!}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Our Contact Info */}
          <div className={`${styles.column} ${styles.columnContact}`}>
            <div className={styles.heading}>Our Contact Info</div>
            <ul className={styles.iconItem}>
              <li>
                <a href={contact.whatsappUrl}>
                  <span className={`${styles.icon} ${styles.phoneIcon}`}>
                    <i aria-hidden="true" className="rt rt-phone-flip" />
                  </span>
                  <span className={styles.text}>{contact.phoneDisplay}</span>
                </a>
              </li>
            </ul>
            <ul className={styles.iconItem}>
              <li>
                <Link href="/contact/">
                  <span className={`${styles.icon} ${styles.mailIcon}`}>
                    <EnvelopeIcon />
                  </span>
                  <span className={styles.text}>Contact Us</span>
                </Link>
              </li>
            </ul>
            <ul className={styles.iconItem}>
              <li style={{ display: "flex" }}>
                <span className={`${styles.icon} ${styles.pinIcon}`}>
                  <i aria-hidden="true" className="rt rt-location-dot" />
                </span>
                <span className={styles.text} style={{ paddingInlineStart: 0 }}>
                  {/* Original design: its short line. Redesign: two lines with the district of the Google Business Profile
                      (Poto Tano), linking to the Maps place; the full postal address is in the structured data. */}
                  <span className={styles.addressShort}>{contact.address}</span>
                  <address className={styles.addressFull}>
                    <a href={contact.mapsUrl} target="_blank" rel="noopener">
                      Pantai Moro, {postal.locality}
                      <br />
                      {postal.regency}, {postal.country}
                    </a>
                  </address>
                </span>
              </li>
            </ul>
            <ul className={styles.social}>
              <li>
                <a className={styles.socialLink} href={contact.facebookUrl} target="_blank">
                  <span className="sr-only-text">Facebook-f</span>
                  <FacebookIcon />
                </a>
              </li>
              <li>
                <a className={styles.socialLink} href={contact.instagramUrl} target="_blank">
                  <span className="sr-only-text">Instagram</span>
                  <InstagramIcon />
                </a>
              </li>
              <li>
                <a className={styles.socialLink} href={contact.whatsappUrl} target="_blank">
                  <span className="sr-only-text">Whatsapp</span>
                  <WhatsappIcon />
                </a>
              </li>
            </ul>
          </div>

          {/* We Are Here */}
          <div className={`${styles.column} ${styles.columnMap}`}>
            <div className={styles.heading}>We Are Here</div>
            {/* The iframe stays inline (like the original HTML widget), which adds the same line space below it. */}
            <div>
              <iframe
                className={styles.map}
                src={contact.mapEmbedUrl}
                title="Mocean Resort and Dive on Google Maps"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <p className={styles.copyright}>© Copyright PT Mocean Dive Resort | All Rights Reserved</p>
        </div>
      </div>
      <div className={styles.spacer} />
    </footer>
  );
}
