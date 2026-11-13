import Link from "next/link";
import { property } from "@/config/property";
import { formatDay, formatMoney, nightsBetween } from "@/lib/booking/stay";
import { displayStatus, type ReservationListItem } from "@/lib/booking/native/store";
import { AlertIcon, ArrowRightIcon, CheckIcon } from "./icons";

/** Small pieces shared by the admin pages. */

/** A query value as one string (Next gives string | string[] | undefined). */
export function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function Flash({ done, error }: { done?: string; error?: string }) {
  if (error)
    return (
      <p className="adm-flash adm-flash--error" role="alert">
        <AlertIcon />
        {error}
      </p>
    );
  if (done)
    return (
      <p className="adm-flash adm-flash--done" role="status">
        <CheckIcon />
        {done}
      </p>
    );
  return null;
}

const STATUS_LABEL = { pending: "Waiting", confirmed: "Confirmed", cancelled: "Cancelled", expired: "Expired" } as const;

export function StatusBadge({ row }: { row: { status: "pending" | "confirmed" | "cancelled"; expiresAt: Date | null } }) {
  const status = displayStatus(row);
  return <span className={`adm-badge adm-badge--${status}`}>{STATUS_LABEL[status]}</span>;
}

export const money = (amount: number) => formatMoney(amount);

/** A payment's state: paid, an online page still open, or never paid. */
export function PaymentBadge({ status }: { status: "pending" | "paid" | "expired" | "failed" }) {
  const label = { pending: "Waiting for payment", paid: "Paid", expired: "Expired", failed: "Failed" }[status];
  const tone = status === "paid" ? "confirmed" : status === "pending" ? "pending" : "cancelled";
  return <span className={`adm-badge adm-badge--${tone}`}>{label}</span>;
}

/** "12 Nov 2026, 14:30" in the property's time zone (src/config/property.ts), which is what the staff's clocks show. */
export const resortTime = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: property.timeZone, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);

export function stayLabel(checkIn: string, checkOut: string) {
  const nights = nightsBetween(checkIn, checkOut);
  return `${formatDay(checkIn, { weekday: undefined })} to ${formatDay(checkOut, { weekday: undefined })} (${nights} night${nights === 1 ? "" : "s"})`;
}

/** The same word always gets the same of the five brand tints (room chips, avatars). */
export function tint(text: string): number {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 5;
}

/** Rounded square with the initials of a name or an email address. */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const words = name.split("@")[0].split(/[\s._-]+/).filter(Boolean);
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2)).toUpperCase();
  return (
    <span className={`adm-avatar adm-avatar--${size} adm-tint-${tint(name)}`} aria-hidden="true">
      {initials}
    </span>
  );
}

/** Room type names as coloured tags; repeats ("Deluxe King" twice) are counted. */
export function RoomChips({ names }: { names: string[] }) {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return (
    <span className="adm-chips">
      {[...counts].map(([name, count]) => (
        <span key={name} className={`adm-chip adm-tint-${tint(name)}`}>
          {count > 1 && <b>{count}x</b>} {name}
        </span>
      ))}
    </span>
  );
}

function StayCell({ checkIn, checkOut }: { checkIn: string; checkOut: string }) {
  const nights = nightsBetween(checkIn, checkOut);
  return (
    <span className="adm-stay">
      <span>
        {formatDay(checkIn, { weekday: undefined, year: undefined })} <span aria-hidden="true">→</span>
        <span className="sr-only"> to </span> {formatDay(checkOut, { weekday: undefined, year: undefined })}
      </span>
      <span className="adm-nights">
        {nights} night{nights === 1 ? "" : "s"}
      </span>
    </span>
  );
}

/**
 * Bookings as table rows. `compact` (the dashboard's narrower column) shows the booking number under the guest instead
 * of in its own column.
 */
export function ReservationTable({ rows, empty, compact }: { rows: ReservationListItem[]; empty: string; compact?: boolean }) {
  if (rows.length === 0) return <EmptyState text={empty} />;
  return (
    <div className="adm-scroll">
      <table className="adm-table">
        <thead>
          <tr>
            <th>Guest</th>
            {!compact && <th>Booking</th>}
            <th>Stay</th>
            <th>Rooms</th>
            <th className="adm-num">Total</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const name = `${row.firstName} ${row.lastName}`.trim();
            return (
              <tr key={row.id}>
                <td>
                  <span className="adm-person">
                    <Avatar name={name || row.code} />
                    <span>
                      <span className="adm-person-name">{name}</span>
                      {compact ? (
                        <Link className="adm-code" href={`/admin/reservations/${row.code}/`}>
                          {row.code}
                        </Link>
                      ) : (
                        row.email && <span className="adm-muted adm-small adm-block">{row.email}</span>
                      )}
                    </span>
                  </span>
                </td>
                {!compact && (
                  <td>
                    <Link className="adm-code" href={`/admin/reservations/${row.code}/`}>
                      {row.code}
                    </Link>
                    <span className="adm-muted adm-small adm-block">{row.source === "admin" ? "Entered by staff" : "Website"}</span>
                  </td>
                )}
                <td>
                  <StayCell checkIn={row.checkIn} checkOut={row.checkOut} />
                </td>
                <td>
                  <RoomChips names={row.roomNames} />
                </td>
                <td className="adm-num adm-strong">{money(row.total)}</td>
                <td>
                  <StatusBadge row={row} />
                  {row.cancelRequestedAt && row.status === "confirmed" && <span className="adm-badge adm-badge--asked">Asked to cancel</span>}
                </td>
                <td className="adm-row-action">
                  <Link className="adm-icon-btn" href={`/admin/reservations/${row.code}/`} aria-label={`Open booking ${row.code}`} title="Open booking">
                    <ArrowRightIcon />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Compact list of bookings (dashboard side panels): guest, rooms, dates. */
export function GuestList({ rows, empty, date }: { rows: ReservationListItem[]; empty: string; date: "checkIn" | "checkOut" }) {
  if (rows.length === 0) return <EmptyState text={empty} />;
  return (
    <ul className="adm-guests">
      {rows.map((row) => {
        const name = `${row.firstName} ${row.lastName}`.trim();
        return (
          <li key={row.id}>
            <Link href={`/admin/reservations/${row.code}/`} className="adm-guest">
              <Avatar name={name || row.code} />
              <span className="adm-guest-main">
                <span className="adm-person-name">{name}</span>
                <RoomChips names={row.roomNames} />
              </span>
              <span className="adm-guest-date">
                <span className="adm-guest-day">{Number(row[date].slice(8))}</span>
                <span className="adm-muted adm-small">{formatDay(row[date], { weekday: undefined, day: undefined, year: undefined, month: "short" })}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="adm-empty">
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 70C200 40 380 30 600 56s380 40 580 20 200-24 260-18V100H0Z" />
      </svg>
      <p>{text}</p>
    </div>
  );
}

/** Ring showing a share (0 to 1), as in the stat cards. */
export function Ring({ value, label }: { value: number; label: string }) {
  const share = Math.max(0, Math.min(1, value));
  const length = 2 * Math.PI * 22;
  return (
    <svg className="adm-ring" viewBox="0 0 56 56" role="img" aria-label={label}>
      <circle cx="28" cy="28" r="22" className="adm-ring-track" />
      <circle cx="28" cy="28" r="22" className="adm-ring-fill" strokeDasharray={`${share * length} ${length}`} transform="rotate(-90 28 28)" />
      <text x="28" y="32" textAnchor="middle">
        {Math.round(share * 100)}%
      </text>
    </svg>
  );
}
