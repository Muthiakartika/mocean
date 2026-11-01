import Image from "next/image";
import FadeInUp from "@/components/shared/FadeInUp";
import SectionHeading from "@/components/shared/SectionHeading";
import { activities as content } from "@/data/homepage";
import styles from "./Activities.module.css";

/** Sections 6 + 7: "Surf, Waterfalls and Island Tours" and the Surf / Nature / Activities boxes. */
export default function Activities() {
  return (
    <>
      <section className={`con con-full ${styles.intro}`}>
        <div className={`con con-boxed ${styles.introRow}`}>
          <div className="con-inner">
            <div className={`con con-full ${styles.introColumn}`}>
              <FadeInUp className={`widget ${styles.headingWrap}`}>
                <SectionHeading className={styles.heading} sub={content.sub} title={content.title} />
              </FadeInUp>
            </div>
            <div className={`con con-full ${styles.introColumn}`}>
              <div className={`widget ${styles.introText}`}>
                <p>
                  <span>{content.text}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`con con-full ${styles.boxes}`}>
        <div className={`con con-boxed ${styles.boxesRow}`}>
          <div className="con-inner">
            {content.boxes.map((box, index) => (
              <div key={box.title} className={`con con-full ${styles.boxColumn}`}>
                <div className={`widget ${styles.imageBox} ${index === 1 ? styles.imageBoxOffset : ""}`}>
                  <figure className={styles.imageBoxImg}>
                    <Image src={box.image} alt="" width={600} height={800} sizes="(max-width: 767px) 100vw, 410px" />
                  </figure>
                  <div>
                    <h3 className={styles.imageBoxTitle}>{box.title}</h3>
                    {box.hasDescription && <p className={styles.imageBoxDescription}> </p>}
                  </div>
                </div>
                <div className={`widget ${styles.boxText}`}>
                  <span>{box.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
