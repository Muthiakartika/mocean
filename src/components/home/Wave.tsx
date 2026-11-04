import styles from "./Wave.module.css";

type WaveProps = {
  /** Which edge of the parent the wave sits on. The fill is the colour of the neighbouring section (--wave-fill). */
  edge?: "top" | "bottom";
  className?: string;
};

/**
 * Wavy edge of a homepage section in the redesign: a pale wave behind a solid one.
 * The parent needs `position: relative`; hidden with ?original.
 */
export default function Wave({ edge = "bottom", className }: WaveProps) {
  return (
    <svg
      className={`${styles.wave} ${styles[edge]} ${className ?? ""}`}
      viewBox="0 0 1440 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path className={styles.back} d="M0 44C180 84 360 92 560 64S900 4 1100 20s260 36 340 28V100H0Z" />
      <path d="M0 70C200 40 380 30 600 56s380 40 580 20 200-24 260-18V100H0Z" />
    </svg>
  );
}
