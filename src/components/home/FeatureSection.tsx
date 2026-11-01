import Button from "@/components/shared/Button";
import ParallaxImage from "@/components/shared/ParallaxImage";
import SectionHeading from "@/components/shared/SectionHeading";
import styles from "./FeatureSection.module.css";

type FeatureSectionProps = {
  /** Which homepage section this is — selects its spacing. */
  variant: "rooms" | "diving" | "restaurant";
  sub: string;
  title: string;
  /** Paragraph text. `asParagraphs: false` renders the original's single block of text. */
  paragraphs: string[];
  asParagraphs?: boolean;
  button: { label: string; href: string };
  image: { src: string; width: number; height: number };
};

/**
 * Photo + text section used three times on the homepage.
 * In the HTML the photo comes first for Rooms/Restaurant and the text first for
 * Diving, exactly like the original, so the photo appears on alternating sides.
 */
export default function FeatureSection({ variant, sub, title, paragraphs, asParagraphs = true, button, image }: FeatureSectionProps) {
  const imageColumn = (
    <div className={`con con-full ${styles.imageColumn}`}>
      <div className="widget">
        <ParallaxImage
          className={styles.image}
          src={image.src}
          width={image.width}
          height={image.height}
          sizes="(max-width: 880px) 100vw, 600px"
        />
      </div>
    </div>
  );

  const textColumn = (
    <div className={`con con-full ${styles.textColumn}`}>
      <div className={`widget ${styles.headingWrap}`}>
        <SectionHeading className={styles.heading} sub={sub} title={title} />
      </div>
      <div className={`widget ${styles.text}`}>
        {asParagraphs ? (
          paragraphs.map((p) => <p key={p}>{p}</p>)
        ) : (
          <p>
            {paragraphs.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </p>
        )}
      </div>
      <div className={`widget ${styles.buttonWrap}`}>
        <Button href={button.href}>{button.label}</Button>
      </div>
    </div>
  );

  return (
    <section className={`con con-boxed ${styles.section} ${styles[variant]}`}>
      <div className="con-inner">
        <div className={`con con-full ${styles.row}`}>
          {variant === "diving" ? (
            <>
              {textColumn}
              {imageColumn}
            </>
          ) : (
            <>
              {imageColumn}
              {textColumn}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
