import Button from "@/components/shared/Button";
import FadeInUp from "@/components/shared/FadeInUp";
import SectionHeading from "@/components/shared/SectionHeading";
import { bookingCta as content } from "@/data/homepage";
import styles from "./BookingCTA.module.css";
import Wave from "./Wave";

/** Section 12: final booking call to action. */
export default function BookingCTA() {
  return (
    <section className={`con con-boxed ${styles.section}`}>
      <div className="con-inner">
        <div
          className={`con con-full has-overlay ${styles.banner}`}
          style={{ backgroundImage: `url(${content.background})` }}
        >
          <FadeInUp className={`widget ${styles.headingWrap}`}>
            <SectionHeading className={styles.heading} sub="" title={content.title} />
          </FadeInUp>
          <Wave className={styles.bannerWave} />
        </div>
        <div className={`widget ${styles.text}`}>
          <p>{content.text}</p>
          <p>
            <strong>WhatsApp:</strong> +62 821 4419 1647 · <strong>Email:</strong> bookings@moceanbeachresort.com
          </p>
        </div>
        <div className={`con con-full ${styles.buttons}`}>
          {content.buttons.map((button) => (
            <div key={button.label} className="widget">
              <Button href={button.href} newTab={button.newTab}>
                {button.label}
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Wave className={styles.footerWave} />
    </section>
  );
}
