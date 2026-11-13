"use client";

import { useState } from "react";

const group = (digits: string) => (digits ? new Intl.NumberFormat("en-US").format(Number(digits)) : "");

/**
 * A whole amount of money, shown with separators ("2,200,000") once the field is left, and the currency beside it.
 * The server reads only the digits (`money` in admin/actions.ts), so "2.200.000" typed the Indonesian way works too.
 */
export default function MoneyInput({
  id,
  name,
  defaultValue,
  currency,
  required = true,
  placeholder,
}: {
  id: string;
  name: string;
  defaultValue?: number;
  currency: string;
  required?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue === undefined ? "" : group(String(defaultValue)));
  return (
    <div className="adm-money">
      <span aria-hidden="true">{currency}</span>
      <input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value.replace(/[^\d.,\s]/g, ""))}
        onBlur={() => setValue(group(value.replace(/[^\d]/g, "")))}
      />
    </div>
  );
}
