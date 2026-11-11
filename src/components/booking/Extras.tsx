"use client";

import { formatMoney } from "@/lib/booking/stay";
import type { AddOn } from "@/lib/booking/types";
import { Stepper } from "./Stepper";
import styles from "./Booking.module.css";

type Props = {
  addOns: AddOn[];
  currency: string;
  chosen: Record<string, number>;
  onChange: (id: string, quantity: number) => void;
};

/** Optional extras (transfers and the like), each with a quantity. */
export default function Extras({ addOns, currency, chosen, onChange }: Props) {
  return (
    <ul className={styles.extras}>
      {addOns.map((addOn) => {
        const quantity = chosen[addOn.id] ?? 0;
        return (
          <li key={addOn.id} className={`${styles.extra} ${quantity ? styles.extraChosen : ""}`}>
            <div className={styles.extraText}>
              <span className={styles.extraName}>{addOn.name}</span>
              {addOn.description && <span className={styles.extraDescription}>{addOn.description}</span>}
              <span className={styles.extraPrice}>{formatMoney(addOn.price, currency)} each</span>
            </div>
            {quantity === 0 ? (
              <button type="button" className={styles.addButton} onClick={() => onChange(addOn.id, 1)} aria-label={`Add ${addOn.name}`}>
                Add
              </button>
            ) : (
              <Stepper compact label="Quantity" value={quantity} min={0} max={20} onChange={(value) => onChange(addOn.id, value)} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
