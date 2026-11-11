"use client";

import { useMemo } from "react";
import type { Guest } from "@/lib/booking/types";
import { countries } from "./countries";
import styles from "./Booking.module.css";

type Props = {
  guest: Guest;
  errors: Partial<Record<keyof Guest, string>>;
  onChange: (guest: Guest) => void;
  /** Field bots fill in and people never see. */
  honeypot: string;
  onHoneypot: (value: string) => void;
};

const ARRIVAL_TIMES = Array.from({ length: 16 }, (_, index) => `${String(index + 7).padStart(2, "0")}:00`);

/** Lead guest's details; the reservation is made in this name. */
export default function GuestForm({ guest, errors, onChange, honeypot, onHoneypot }: Props) {
  const list = useMemo(() => countries(), []);
  const set = (key: keyof Guest) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    onChange({ ...guest, [key]: event.target.value });

  const field = (key: keyof Guest, label: string, input: React.ReactNode, wide = false) => (
    <div className={`${styles.formField} ${wide ? styles.formWide : ""} ${errors[key] ? styles.invalid : ""}`}>
      <label htmlFor={`guest-${key}`}>{label}</label>
      {input}
      {errors[key] && (
        <span className={styles.fieldError} id={`guest-${key}-error`}>
          {errors[key]}
        </span>
      )}
    </div>
  );

  const aria = (key: keyof Guest) => ({
    id: `guest-${key}`,
    name: key,
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `guest-${key}-error` : undefined,
  });

  return (
    <div className={styles.formGrid}>
      {field(
        "firstName",
        "First name",
        <input {...aria("firstName")} autoComplete="given-name" value={guest.firstName} onChange={set("firstName")} required />,
      )}
      {field(
        "lastName",
        "Last name",
        <input {...aria("lastName")} autoComplete="family-name" value={guest.lastName} onChange={set("lastName")} required />,
      )}
      {field(
        "email",
        "Email",
        <input {...aria("email")} type="email" autoComplete="email" inputMode="email" value={guest.email} onChange={set("email")} required />,
      )}
      {field(
        "phone",
        "Phone or WhatsApp",
        <input
          {...aria("phone")}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+62 812 3456 7890"
          value={guest.phone}
          onChange={set("phone")}
          required
        />,
      )}
      {field(
        "country",
        "Country",
        <select {...aria("country")} autoComplete="country" value={guest.country} onChange={set("country")} required>
          <option value="">Choose your country</option>
          {list.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>,
      )}
      {field(
        "zip",
        "Postal code (optional)",
        <input {...aria("zip")} autoComplete="postal-code" value={guest.zip ?? ""} onChange={set("zip")} />,
      )}
      {field(
        "arrivalTime",
        "Arrival time (optional)",
        <select {...aria("arrivalTime")} value={guest.arrivalTime ?? ""} onChange={set("arrivalTime")}>
          <option value="">I don&apos;t know yet</option>
          {ARRIVAL_TIMES.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>,
        true,
      )}
      {field(
        "notes",
        "Requests for the resort (optional)",
        <textarea
          {...aria("notes")}
          rows={4}
          maxLength={1000}
          placeholder="Pickup from Poto Tano, dive or surf plans, dietary needs"
          value={guest.notes ?? ""}
          onChange={set("notes")}
        />,
        true,
      )}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="guest-website">Website</label>
        <input id="guest-website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => onHoneypot(event.target.value)} />
      </div>
    </div>
  );
}
