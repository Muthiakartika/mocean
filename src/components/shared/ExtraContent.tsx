import Image from "next/image";
import Link from "next/link";
import Accordion from "@/components/shared/Accordion";
import { extraContent } from "@/data/extra-content";
import styles from "./ExtraContent.module.css";

/** Arrow of the link buttons (same shape as the arrow in the site's pill buttons). */
function Arrow() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M8.7 3.3a1 1 0 0 1 1.4 0l4 4a1 1 0 0 1 0 1.4l-4 4a1 1 0 1 1-1.4-1.4L11 9H2.5a1 1 0 1 1 0-2H11L8.7 4.7a1 1 0 0 1 0-1.4z" />
    </svg>
  );
}

/**
 * The planning block under a thin page's own content (src/data/extra-content.ts), redesign only (hidden with ?original):
 *   1. fact cards, each ending with link buttons (no links inside the text, owner 2026-11-11);
 *   2. the FAQ band in the same design as the FAQs on the other pages: question cards (Accordion "cards") beside a
 *      collage of three photos. The questions are also the page's FAQPage structured data (structuredData.ts).
 * Renders nothing for pages without extra content.
 */
export default function ExtraContent({ path }: { path: string }) {
  const content = extraContent[path];
  if (!content) return null;
  const id = `extra-${path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`;
  const [small1, small2, tall] = content.photos;

  return (
    <>
      <section className={styles.plan} aria-labelledby={id}>
        <div className={styles.inner}>
          <p className={styles.kicker}>{content.kicker}</p>
          <h2 id={id} className={styles.title}>
            {content.title}
          </h2>
          {content.intro && <p className={styles.intro}>{content.intro}</p>}

          <div className={styles.cards}>
            {content.cards.map((card) => (
              <div key={card.heading} className={styles.card}>
                <h3 className={styles.cardTitle}>{card.heading}</h3>
                {card.facts && (
                  <dl className={styles.facts}>
                    {card.facts.map(([label, value]) => (
                      <div key={label} className={styles.fact}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {card.text?.map((paragraph, i) => (
                  <p key={i} className={styles.text}>
                    {paragraph}
                  </p>
                ))}
                {card.links && (
                  <div className={styles.links}>
                    {card.links.map(([label, href]) => (
                      <Link key={href} href={href} className={styles.chip}>
                        {label}
                        <Arrow />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.faqBand} aria-labelledby={`${id}-faq`}>
        <div className={styles.inner}>
          <h2 id={`${id}-faq`} className={styles.faqTitle}>
            {content.faqTitle}
          </h2>
          <div className={styles.faqRow}>
            <div className={styles.faqList}>
              <Accordion items={content.faq} variant="cards" />
            </div>
            <div className={styles.collage}>
              {[small1, small2, tall].map((photo, i) => (
                <Image
                  key={photo.src}
                  className={i === 2 ? styles.tall : styles.small}
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  sizes="(max-width: 767px) 45vw, 22vw"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
