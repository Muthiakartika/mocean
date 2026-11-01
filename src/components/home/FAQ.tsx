import Accordion from "@/components/shared/Accordion";
import ParallaxImage from "@/components/shared/ParallaxImage";
import SectionHeading from "@/components/shared/SectionHeading";
import { faq as content } from "@/data/homepage";
import styles from "./FAQ.module.css";

/** Section 11: frequently asked questions next to a beach photo. */
export default function FAQ() {
  return (
    <section className={`con con-boxed ${styles.section}`}>
      <div className="con-inner">
        <div className={`widget ${styles.headingWrap}`}>
          <SectionHeading className={styles.heading} sub={content.sub} title={content.title} />
        </div>
        <div className={`con con-full ${styles.row}`}>
          <div className={`con con-full ${styles.imageColumn}`}>
            <div className="widget">
              <ParallaxImage
                className={styles.image}
                src={content.image.src}
                width={content.image.width}
                height={content.image.height}
                sizes="(max-width: 880px) 100vw, 600px"
              />
            </div>
          </div>
          <div className={`con con-full ${styles.accordionColumn}`}>
            <div className="widget">
              <Accordion items={content.items} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
