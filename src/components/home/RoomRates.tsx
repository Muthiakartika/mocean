import Button from "@/components/shared/Button";
import FadeInUp from "@/components/shared/FadeInUp";
import SectionHeading from "@/components/shared/SectionHeading";
import { TagIcon } from "@/components/shared/icons";
import { roomRates as content } from "@/data/homepage";
import styles from "./RoomRates.module.css";

/** Section 10: four room cards with season prices. */
export default function RoomRates() {
  return (
    <section className={`con con-full ${styles.section}`}>
      <div className={`con con-boxed ${styles.headingRow}`}>
        <div className="con-inner">
          <div className={`con con-full ${styles.headingColumn}`}>
            <FadeInUp className="widget">
              <SectionHeading className={styles.heading} sub={content.sub} title={content.title} />
            </FadeInUp>
          </div>
          <div className={`con con-full ${styles.headingColumn}`}>
            <div className={`widget ${styles.introText}`}>{content.text}</div>
          </div>
        </div>
      </div>

      <div className={`con con-boxed ${styles.cards}`}>
        <div className="con-inner">
          {content.rooms.map((room) => (
            <div
              key={room.name}
              className={`con con-full has-overlay ${styles.card}`}
              style={{ backgroundImage: `url(${room.image})`, "--overlay-opacity": room.overlayOpacity } as React.CSSProperties}
            >
              <div className={`widget ${styles.cardTitle}`}>{room.name}</div>
              <div className={`widget ${styles.list}`}>
                <ul className={styles.items}>
                  <li className={styles.item}>
                    <span className={styles.itemText}>{room.size}</span>
                  </li>
                  <li className={styles.item}>
                    <span className={styles.icon}>
                      <i aria-hidden="true" className="rt rt-user-2" />
                    </span>
                    <span className={styles.itemText}>{room.guests}</span>
                  </li>
                </ul>
              </div>
              <div className={`widget ${styles.list}`}>
                <ul className={styles.items}>
                  {room.prices.map((price) => (
                    <li key={price} className={styles.item}>
                      <span className={styles.icon}>
                        <TagIcon />
                      </span>
                      <span className={styles.itemText}>{price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`con con-full ${styles.footer}`}>
        <div className="widget">
          <p style={{ textAlign: "center" }}>{content.note}</p>
        </div>
        <div className={`widget ${styles.buttonWrap}`}>
          <Button href={content.button.href} newTab={content.button.newTab}>
            {content.button.label}
          </Button>
        </div>
      </div>
    </section>
  );
}
