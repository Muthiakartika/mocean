"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LIMITS, addDays, formatDay, nightsBetween, parseDay, toDay } from "@/lib/booking/stay";
import styles from "./Booking.module.css";

type Props = {
  checkIn: string;
  checkOut: string;
  today: string;
  onChange: (checkIn: string, checkOut: string) => void;
};

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/** First day of the month of `day`, as "YYYY-MM-01". */
function monthOf(day: string) {
  return `${day.slice(0, 7)}-01`;
}

function shiftMonth(month: string, by: number) {
  const date = parseDay(month)!;
  return toDay(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + by, 1)));
}

/** The days of a month, padded with nulls so the first one falls on its weekday (weeks start on Monday). */
function monthGrid(month: string): (string | null)[] {
  const first = parseDay(month)!;
  const lead = (first.getUTCDay() + 6) % 7;
  const length = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return [...Array<null>(lead).fill(null), ...Array.from({ length }, (_, index) => addDays(month, index))];
}

/**
 * Check-in / check-out field with a two-month calendar (one month on phones). The first click picks check-in, the
 * second check-out; days before today, past the booking window or beyond the longest stay are not selectable.
 */
export default function DateRangePicker({ checkIn, checkOut, today, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draftIn, setDraftIn] = useState(checkIn);
  const [draftOut, setDraftOut] = useState(checkOut);
  const [hover, setHover] = useState("");
  const [month, setMonth] = useState(monthOf(checkIn || today));
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const lastDay = addDays(shiftMonth(monthOf(today), LIMITS.maxMonthsAhead), -1);
  const choosingOut = Boolean(draftIn && !draftOut);

  function openPanel() {
    setDraftIn(checkIn);
    setDraftOut(checkOut);
    setMonth(monthOf(checkIn || today));
    setOpen(true);
  }

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        root.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function disabled(day: string) {
    if (day < today || day > lastDay) return true;
    if (choosingOut) return day > draftIn && nightsBetween(draftIn, day) > LIMITS.maxNights;
    return false;
  }

  function pick(day: string) {
    if (choosingOut && day > draftIn) {
      setDraftOut(day);
      onChange(draftIn, day);
      setOpen(false);
      return;
    }
    setDraftIn(day);
    setDraftOut("");
  }

  const rangeEnd = draftOut || (choosingOut && hover > draftIn ? hover : "");
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;

  return (
    <div className={styles.field} ref={root}>
      <button
        type="button"
        className={styles.fieldButton}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? setOpen(false) : openPanel())}
      >
        <span className={styles.fieldPart}>
          <span className={styles.fieldLabel}>Check-in</span>
          <span className={styles.fieldValue}>{checkIn ? formatDay(checkIn, { year: undefined }) : "Add date"}</span>
        </span>
        <span className={styles.fieldArrow} aria-hidden="true" />
        <span className={styles.fieldPart}>
          <span className={styles.fieldLabel}>Check-out</span>
          <span className={styles.fieldValue}>{checkOut ? formatDay(checkOut, { year: undefined }) : "Add date"}</span>
        </span>
        {nights > 0 && <span className={styles.nightsBadge}>{nights === 1 ? "1 night" : `${nights} nights`}</span>}
      </button>

      {open && (
        <div className={`${styles.popover} ${styles.calendarPopover}`} id={panelId} role="dialog" aria-label="Choose your dates">
          <p className={styles.calendarHint} aria-live="polite">
            {choosingOut ? "Now choose your check-out day." : "Choose your check-in day."}
          </p>
          <div className={styles.calendarNav}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setMonth(shiftMonth(month, -1))}
              disabled={month <= monthOf(today)}
              aria-label="Previous month"
            >
              <Chevron direction="left" />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setMonth(shiftMonth(month, 1))}
              disabled={shiftMonth(month, 1) > lastDay}
              aria-label="Next month"
            >
              <Chevron direction="right" />
            </button>
          </div>
          <div className={styles.months}>
            {[month, shiftMonth(month, 1)].map((shown, index) => (
              <div key={shown} className={`${styles.month} ${index === 1 ? styles.secondMonth : ""}`}>
                <div className={styles.monthTitle}>{formatDay(shown, { weekday: undefined, day: undefined, month: "long" })}</div>
                <div className={styles.weekdays} aria-hidden="true">
                  {WEEKDAYS.map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>
                <div className={styles.days} onPointerLeave={() => setHover("")}>
                  {monthGrid(shown).map((day, cell) => {
                    if (!day) return <span key={`blank-${cell}`} />;
                    const isStart = day === draftIn;
                    const isEnd = day === rangeEnd;
                    const between = Boolean(draftIn && rangeEnd && day > draftIn && day < rangeEnd);
                    const off = disabled(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        className={[
                          styles.day,
                          isStart ? styles.dayStart : "",
                          isEnd ? styles.dayEnd : "",
                          between ? styles.dayBetween : "",
                          isStart && rangeEnd ? styles.dayHasRange : "",
                          day === today ? styles.dayToday : "",
                        ].join(" ")}
                        disabled={off}
                        aria-pressed={isStart || isEnd}
                        aria-label={formatDay(day, { weekday: "long", month: "long" })}
                        onClick={() => pick(day)}
                        onPointerEnter={() => setHover(day)}
                        onFocus={() => setHover(day)}
                      >
                        {Number(day.slice(8))}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Chevron({ direction }: { direction: "left" | "right" | "down" }) {
  const path = { left: "M15 6l-6 6 6 6", right: "M9 6l6 6-6 6", down: "M6 9l6 6 6-6" }[direction];
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
