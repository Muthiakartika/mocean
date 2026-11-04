import FadeInUp from "@/components/shared/FadeInUp";
import SectionHeading from "@/components/shared/SectionHeading";
import { testimonials as content } from "@/data/homepage";
import TestimonialSlider from "./TestimonialSlider";
import styles from "./Testimonials.module.css";
import Wave from "./Wave";

/** Section 8: guest reviews on a dark photo background. */
export default function Testimonials() {
  return (
    <section
      className={`con con-boxed has-overlay ${styles.section}`}
      style={{ backgroundImage: `url(${content.background})` }}
    >
      <Wave edge="top" />
      <div className="con-inner">
        <FadeInUp className={`widget ${styles.headingWrap}`}>
          <SectionHeading className={styles.heading} sub={content.sub} title={content.title} />
        </FadeInUp>
        <div className="widget">
          <TestimonialSlider />
        </div>
      </div>
      <Wave className={styles.waveBottom} />
    </section>
  );
}
