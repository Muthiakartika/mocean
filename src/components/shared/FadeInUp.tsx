"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./FadeInUp.module.css";

/**
 * Elementor "Fade In Up" entrance animation: the element stays hidden until it
 * scrolls into view, then slides up 100% of its height while fading in (1.25s).
 */
export default function FadeInUp({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${className ?? ""} ${visible ? styles.animated : styles.hidden}`}>
      {children}
    </div>
  );
}
