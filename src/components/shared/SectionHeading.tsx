import styles from "./SectionHeading.module.css";

type SectionHeadingProps = {
  /** Small coloured line above the title, e.g. "Mocean". Empty string renders an empty line (as the original). */
  sub: string;
  title: string;
  /** Extra class that sets the size/colour variables for this heading. */
  className?: string;
};

/** Sub heading + <h2>, the heading style used across the site. */
export default function SectionHeading({ sub, title, className }: SectionHeadingProps) {
  return (
    <div className={`${styles.heading} ${className ?? ""}`}>
      <span className={styles.sub}>
        <em>{sub}</em>
      </span>
      <h2 className={styles.title}>{title}</h2>
    </div>
  );
}
