import Link from "next/link";
import styles from "./Button.module.css";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  /** Open in a new tab (the original uses this for Cloudbeds links). */
  newTab?: boolean;
  /** rel="nofollow", as on the original booking links. */
  nofollow?: boolean;
  /** Header "Book Now" uses a solid brand-colored border. */
  solidBorder?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/** The site's standard button (theme class `theme-btn btn-style fill`). */
export default function Button({ href, children, newTab, nofollow, solidBorder, className, style }: ButtonProps) {
  const classes = [styles.button, solidBorder ? styles.solidBorder : "", className ?? ""].join(" ").trim();

  // Internal pages use next/link for instant navigation; external ones stay plain links.
  if (href.startsWith("/") && !newTab) {
    return (
      <Link href={href} className={classes} style={style}>
        <span className={styles.label}>{children}</span>
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={classes}
      style={style}
      target={newTab ? "_blank" : undefined}
      rel={nofollow ? "nofollow" : undefined}
    >
      <span className={styles.label}>{children}</span>
    </a>
  );
}
