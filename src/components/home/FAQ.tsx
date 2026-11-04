import Image from "next/image";
import Accordion from "@/components/shared/Accordion";
import ParallaxImage from "@/components/shared/ParallaxImage";
import SectionHeading from "@/components/shared/SectionHeading";
import { diving, faq as content, resortIntro } from "@/data/homepage";
import styles from "./FAQ.module.css";
import Wave from "./Wave";

/** Redesign collage beside the questions (not with ?original): the pool and the manta, then the FAQ photo, tall. */
const collage = [resortIntro.mainImage, diving.image];

/** Section 11: frequently asked questions next to a beach photo (in the redesign: a collage of three). */
export default function FAQ() {
  return (
    <section className={`con con-boxed ${styles.section}`}>
      <Wave edge="top" />
      <div className="con-inner">
        <div className={`widget ${styles.headingWrap}`}>
          <SectionHeading className={styles.heading} sub={content.sub} title={content.title} />
        </div>
        <div className={`con con-full ${styles.row}`}>
          <div className={`con con-full ${styles.imageColumn}`}>
            <div className={`widget ${styles.parallax}`}>
              <ParallaxImage
                className={styles.image}
                src={content.image.src}
                width={content.image.width}
                height={content.image.height}
                sizes="(max-width: 880px) 100vw, 600px"
              />
            </div>
            <div className={styles.collage}>
              {collage.map((photo) => (
                <Image key={photo.src} className={styles.collageSmall} src={photo.src} alt="" width={photo.width} height={photo.height} sizes="(max-width: 767px) 45vw, 22vw" />
              ))}
              <Image className={styles.collageTall} src={content.image.src} alt="" width={content.image.width} height={content.image.height} sizes="(max-width: 767px) 45vw, 22vw" />
            </div>
          </div>
          <div className={`con con-full ${styles.accordionColumn}`}>
            <div className="widget">
              <Accordion items={content.items} variant="cards" />
            </div>
          </div>
        </div>
      </div>
      <Wave />
    </section>
  );
}
