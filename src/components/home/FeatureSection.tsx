import Button from "@/components/shared/Button";
import LinkedText, { type TextLink } from "@/components/shared/LinkedText";
import ParallaxImage from "@/components/shared/ParallaxImage";
import SectionHeading from "@/components/shared/SectionHeading";
import styles from "./FeatureSection.module.css";
import Wave from "./Wave";

type FeatureSectionProps = {
  /** Which homepage section this is — selects its spacing. */
  variant: "rooms" | "diving" | "restaurant";
  sub: string;
  title: string;
  /** Paragraph text. `asParagraphs: false` renders the original's single block of text. */
  paragraphs: string[];
  asParagraphs?: boolean;
  /** Words in the paragraphs to link (first occurrence). */
  link?: TextLink;
  button: { label: string; href: string };
  image: { src: string; width: number; height: number };
  /** Redesign: the section sits on the pale sea band with wavy top and bottom edges. */
  band?: boolean;
};

/**
 * Photo + text section used three times on the homepage.
 * In the HTML the photo comes first for Rooms/Restaurant and the text first for
 * Diving, exactly like the original, so the photo appears on alternating sides.
 */
export default function FeatureSection({ variant, sub, title, paragraphs, asParagraphs = true, link, button, image, band }: FeatureSectionProps) {
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
          paragraphs.map((p) => (
            <p key={p}>
              <LinkedText text={p} link={link} />
            </p>
          ))
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
    <section className={`con con-boxed ${styles.section} ${styles[variant]} ${band ? styles.band : ""}`}>
      {band && <Wave edge="top" />}
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
      {band && <Wave />}
    </section>
  );
}
