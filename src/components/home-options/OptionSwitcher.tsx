import Link from "next/link";
import styles from "./OptionSwitcher.module.css";

const options = [
  { id: "a", label: "A", name: "The day board" },
  { id: "b", label: "B", name: "Chart" },
  { id: "c", label: "C", name: "Reel" },
] as const;

/** Small bar for flipping between the three homepage options while comparing them. */
export default function OptionSwitcher({ current }: { current: (typeof options)[number]["id"] }) {
  return (
    <nav className={styles.bar} aria-label="Homepage options">
      <span className={styles.title}>Homepage options</span>
      {options.map((o) => (
        <Link
          key={o.id}
          href={`/home-${o.id}/`}
          className={o.id === current ? styles.current : styles.link}
          aria-current={o.id === current ? "page" : undefined}
          title={o.name}
        >
          {o.label}
        </Link>
      ))}
      <Link href="/" className={styles.link} title="The current homepage">
        Now
      </Link>
    </nav>
  );
}
