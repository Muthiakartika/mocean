import Image from "next/image";
import Button from "@/components/shared/Button";
import FadeInUp from "@/components/shared/FadeInUp";
import ParallaxImage from "@/components/shared/ParallaxImage";
import SectionHeading from "@/components/shared/SectionHeading";
import { resortIntro as content } from "@/data/homepage";
import styles from "./ResortIntro.module.css";

/** Section 2: resort introduction with two photos. */
export default function ResortIntro() {
  return (
    <section className={`con con-boxed ${styles.section}`}>
      <div className="con-inner">
        <div className={`con con-full ${styles.imageColumn}`}>
          <div className="widget">
            <ParallaxImage
              className={styles.mainImage}
              src={content.mainImage.src}
              width={content.mainImage.width}
              height={content.mainImage.height}
              sizes="(max-width: 767px) 100vw, 425px"
            />
          </div>
          <div className={`con con-full ${styles.smallImageAnchor}`}>
            <div className={`widget ${styles.smallImageBox}`}>
              <Image
                className={styles.smallImage}
                src={content.smallImage.src}
                alt=""
                width={content.smallImage.width}
                height={content.smallImage.height}
                sizes="274px"
              />
            </div>
          </div>
        </div>

        <div className={`con con-full ${styles.textColumn}`}>
          <FadeInUp className="widget">
            <SectionHeading className={styles.heading} sub={content.sub} title={content.title} />
          </FadeInUp>
          <div className={`widget ${styles.text}`}>
            {content.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <p>
              <strong>{content.strongParagraph}</strong>
            </p>
          </div>
          <div className={`widget ${styles.buttonWrap}`}>
            <Button href={content.button.href} newTab={content.button.newTab}>
              {content.button.label}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
