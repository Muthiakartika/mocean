"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LIMITS } from "@/lib/booking/stay";
import styles from "./Booking.module.css";

type StepperProps = {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  compact?: boolean;
};

/** "- 2 +" control for a count (guests, quantity). */
export function Stepper({ label, hint, value, min, max, onChange, compact }: StepperProps) {
  const id = useId();
  return (
    <div className={`${styles.stepperRow} ${compact ? styles.stepperCompact : ""}`}>
      <span className={styles.stepperText} id={id}>
        <span className={styles.stepperLabel}>{label}</span>
        {hint && <span className={styles.stepperHint}>{hint}</span>}
      </span>
      <span className={styles.stepper} role="group" aria-labelledby={id}>
        <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Fewer ${label.toLowerCase()}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 12h12" />
          </svg>
        </button>
        <output aria-live="polite">{value}</output>
        <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`More ${label.toLowerCase()}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 12h12M12 6v12" />
          </svg>
        </button>
      </span>
    </div>
  );
}

type GuestPickerProps = {
  adults: number;
  childCount: number;
  onChange: (adults: number, children: number) => void;
};

/** Guests field of the search bar: a button that opens adults / children steppers. */
export function GuestPicker({ adults, childCount: children, onChange }: GuestPickerProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const summary = [`${adults} ${adults === 1 ? "adult" : "adults"}`, children ? `${children} ${children === 1 ? "child" : "children"}` : ""]
    .filter(Boolean)
    .join(", ");

  return (
    <div className={styles.field} ref={root}>
      <button type="button" className={styles.fieldButton} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
        <span className={styles.fieldPart}>
          <span className={styles.fieldLabel}>Guests</span>
          <span className={styles.fieldValue}>{summary}</span>
        </span>
      </button>
      {open && (
        <div className={`${styles.popover} ${styles.guestPopover}`} id={panelId} role="dialog" aria-label="Guests">
          <Stepper label="Adults" value={adults} min={1} max={LIMITS.maxAdults} onChange={(value) => onChange(value, children)} />
          <Stepper label="Children" value={children} min={0} max={LIMITS.maxChildren} onChange={(value) => onChange(adults, value)} />
          <button type="button" className={styles.linkButton} onClick={() => setOpen(false)}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}
