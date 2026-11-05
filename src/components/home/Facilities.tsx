import Button from "@/components/shared/Button";
import ParallaxImage from "@/components/shared/ParallaxImage";
import SectionHeading from "@/components/shared/SectionHeading";
import { facilities as content } from "@/data/homepage";
import styles from "./Facilities.module.css";
import Wave from "./Wave";

/** Section 9: resort facilities with icons and two photos. */
export default function Facilities() {
  return (
    <section className={`con con-boxed ${styles.section}`}>
      <div className="con-inner">
        <div className={`con con-full ${styles.row}`}>
          <div className={`con con-full ${styles.photoColumn}`}>
            <div className="widget">
              <ParallaxImage
                className={styles.topImage}
                src={content.topImage.src}
                width={content.topImage.width}
                height={content.topImage.height}
                sizes="(max-width: 767px) 100vw, 600px"
              />
            </div>
            <div className={`widget ${styles.buttonWrap}`}>
              <Button href={content.button.href}>{content.button.label}</Button>
            </div>
          </div>

          <div className={`con con-full ${styles.textColumn}`}>
            <div className="widget">
              <SectionHeading className={styles.heading} sub={content.sub} title={content.title} />
            </div>
            <div className={`widget ${styles.text}`}>{content.text}</div>

            <div className={`con con-full ${styles.list}`}>
              {content.rows.map((row) => (
                <div key={row.items[0].label} className={`widget ${styles.listRow}`}>
                  <ul className={styles.items} style={{ "--gap": `${row.gap}px` } as React.CSSProperties}>
                    {row.items.map((item) => (
                      <li key={item.label} className={styles.item}>
                        <span className={styles.icon}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`/icons/facilities/${item.icon}.svg`} alt="" width={14} height={14} loading="lazy" />
                        </span>
                        <span className={styles.label}>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className={`widget ${styles.bottomImageWrap}`}>
              <ParallaxImage
                className={styles.bottomImage}
                src={content.bottomImage.src}
                width={content.bottomImage.width}
                height={content.bottomImage.height}
                sizes="(max-width: 767px) 100vw, 620px"
              />
            </div>
          </div>
        </div>
      </div>
      <Wave />
    </section>
  );
}
