import Button from "@/components/shared/Button";
import FadeInUp from "@/components/shared/FadeInUp";
import LazyBackground from "@/components/shared/LazyBackground";
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
            <LazyBackground
              key={room.name}
              className={`con con-full has-overlay ${styles.card}`}
              src={room.image}
              style={{ "--overlay-opacity": room.overlayOpacity } as React.CSSProperties}
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
                <ul className={`${styles.items} ${styles.prices}`}>
                  {room.prices.map((price) => {
                    // "High Season Price: 2,800,000 IDR" -> label and amount (the text reads the same in the original design).
                    const [, label, amount] = price.match(/^([^:]+:)\s*(.+)$/) ?? [];
                    return (
                      <li key={price} className={styles.item}>
                        <span className={styles.icon}>
                          <TagIcon />
                        </span>
                        <span className={styles.itemText}>
                          {label ? (
                            <>
                              <span className={styles.priceLabel}>
                                {label.replace(/ Price:$/, "")}
                                <span className={styles.priceWord}>{label.endsWith(" Price:") ? " Price:" : ""}</span>
                              </span> <span className={styles.priceAmount}>{amount}</span>
                            </>
                          ) : (
                            price
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </LazyBackground>
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
