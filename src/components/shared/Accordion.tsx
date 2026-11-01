"use client";

import { useId, useState } from "react";
import { MinusIcon, PlusIcon } from "./icons";
import styles from "./Accordion.module.css";

type AccordionProps = {
  items: { question: string; answer: string }[];
  className?: string;
};

/** FAQ accordion: all closed at first, only one item open at a time. */
export default function Accordion({ items, className }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const id = useId();

  return (
    <div className={`${styles.accordion} ${className ?? ""}`}>
      {items.map((item, index) => {
        const open = openIndex === index;
        const panelId = `${id}-panel-${index}`;
        return (
          <div key={item.question} className={`${styles.item} ${open ? styles.open : ""}`}>
            <h3 className={styles.heading}>
              <button
                type="button"
                className={styles.title}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span className={styles.titleText}>{item.question}</span>
                <span className={styles.icon}>{open ? <MinusIcon /> : <PlusIcon />}</span>
              </button>
            </h3>
            <div id={panelId} role="region" className={styles.panel}>
              <div className={styles.panelInner}>
                <div className={`${styles.content} ${open ? "" : styles.closedContent}`}>
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
