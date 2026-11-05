import FadeInUp from "@/components/shared/FadeInUp";
import LazyBackground from "@/components/shared/LazyBackground";
import SectionHeading from "@/components/shared/SectionHeading";
import { testimonials as content } from "@/data/homepage";
import TestimonialSlider from "./TestimonialSlider";
import styles from "./Testimonials.module.css";
import Wave from "./Wave";

/** Section 8: guest reviews on a dark photo background. */
export default function Testimonials() {
  return (
    <LazyBackground as="section" className={`con con-boxed has-overlay ${styles.section}`} src={content.background}>
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
    </LazyBackground>
  );
}
