"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { formatMoney } from "@/lib/booking/stay";
import type { RateOffer, RoomOffer } from "@/lib/booking/types";
import { Chevron } from "./DateRangePicker";
import styles from "./Booking.module.css";

type Props = {
  room: RoomOffer;
  nights: number;
  currency: string;
  /** Rooms of this type already in the stay. */
  chosen: number;
  onAdd: (rate: RateOffer) => void;
  /** Loads the photo first (the first card on the page). */
  priority?: boolean;
};

/** A room type in the search results: photo, facts, details, and one row per rate with its price for the stay. */
export default function RoomCard({ room, nights, currency, chosen, onAdd, priority }: Props) {
  const [details, setDetails] = useState(false);
  const detailsId = useId();
  const left = room.available - chosen;
  const photo = room.photos[0];

  return (
    <article className={styles.roomCard} aria-labelledby={`${detailsId}-name`}>
      <div className={styles.roomTop}>
        <div className={styles.roomPhoto}>
          {photo ? (
            <Image
              src={photo}
              alt=""
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1024px) 40vw, 300px"
              priority={priority}
              unoptimized={photo.startsWith("http")}
            />
          ) : (
            <span className={styles.photoPlaceholder} aria-hidden="true" />
          )}
          {room.available <= 2 && (
            <span className={styles.leftBadge}>{room.available === 1 ? "Only 1 left" : `Only ${room.available} left`}</span>
          )}
        </div>

        <div className={styles.roomBody}>
          <h3 className={styles.roomName} id={`${detailsId}-name`}>
            {room.name}
          </h3>
          <ul className={styles.roomMeta}>
            <li>
              <GuestsIcon /> Up to {room.maxGuests} guests
            </li>
            {room.features.slice(0, 2).map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <p className={`${styles.roomText} ${details ? "" : styles.clamped}`}>{room.description}</p>
          {(room.features.length > 2 || room.photos.length > 1 || room.description.length > 160) && (
            <button
              type="button"
              className={styles.linkButton}
              aria-expanded={details}
              aria-controls={`${detailsId}-details`}
              onClick={() => setDetails(!details)}
            >
              {details ? "Fewer details" : "Room details"}
              <span className={details ? styles.flip : ""}>
                <Chevron direction="down" />
              </span>
            </button>
          )}
          {details && (
            <div id={`${detailsId}-details`} className={styles.roomDetails}>
              {room.features.length > 0 && (
                <ul className={styles.featureList}>
                  {room.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              )}
              {room.photos.length > 1 && (
                <div className={styles.thumbs}>
                  {room.photos.slice(1, 7).map((src) => (
                    <span key={src} className={styles.thumb}>
                      <Image src={src} alt="" fill sizes="120px" unoptimized={src.startsWith("http")} />
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ul className={styles.rates} aria-label={`Rates for ${room.name}`}>
        {room.rates.map((rate) => (
          <li key={rate.rateId} className={styles.rateRow}>
            <div className={styles.rateInfo}>
              <span className={styles.rateName}>{rate.name}</span>
              <span className={styles.rateNightly}>
                {formatMoney(rate.total / Math.max(1, nights), currency)} per night
                {rate.compareAtTotal && rate.compareAtTotal > rate.total && (
                  <span className={styles.saving}> · save {formatMoney(rate.compareAtTotal - rate.total, currency)}</span>
                )}
              </span>
            </div>
            <div className={styles.ratePrice}>
              {rate.compareAtTotal && rate.compareAtTotal > rate.total && (
                <s className={styles.compareAt}>{formatMoney(rate.compareAtTotal, currency)}</s>
              )}
              <span className={styles.rateTotal}>{formatMoney(rate.total, currency)}</span>
              <span className={styles.rateFor}>{nights === 1 ? "1 night" : `${nights} nights`}, tax and service included</span>
            </div>
            <button
              type="button"
              className={styles.addButton}
              disabled={left <= 0}
              onClick={() => onAdd(rate)}
              aria-label={`Add ${room.name}, ${rate.name}`}
            >
              {left <= 0 ? "All chosen" : chosen > 0 ? "Add another" : "Add"}
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function GuestsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
      <path d="M15.5 5.2a3 3 0 0 1 0 5.6M17.5 14.3c1.6.6 2.7 2.2 3 4.7" />
    </svg>
  );
}
