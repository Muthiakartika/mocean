import Link from "next/link";
import { getDb } from "@/lib/db";
import { listSeasonRanges } from "@/lib/booking/native/admin-store";
import { calendarUsage, displayStatus, listCancelRequests, listReservations } from "@/lib/booking/native/store";
import { addDays, resortToday } from "@/lib/booking/stay";
import { trialMode } from "@/lib/booking/native/trial";
import { AlertIcon, ArrivalIcon, ArrowRightIcon, BedIcon, CheckIcon, DepartureIcon, HourglassIcon, PlusIcon } from "../icons";
import { GuestList, ReservationTable, Ring } from "../ui";

export default async function Dashboard() {
  const db = await getDb();
  const now = new Date();
  const today = resortToday(now);

  const [requests, arriving, leaving, seasons, tonight, cancelAsks] = await Promise.all([
    listReservations(db, { status: "pending" }, now),
    listReservations(db, { status: "confirmed", checkInFrom: today, checkInTo: addDays(today, 8) }, now),
    listReservations(db, { status: "confirmed", checkOutOn: today }, now),
    listSeasonRanges(db),
    calendarUsage(db, today, addDays(today, 1), now),
    listCancelRequests(db),
  ]);
  const waiting = requests.filter((row) => displayStatus(row, now) === "pending");
  const arrivingToday = arriving.filter((row) => row.checkIn === today).length;

  // Tonight, per room type and in total.
  const rooms = tonight.types.map((type) => {
    const night = type.perDay[0] ?? { booked: 0, blocked: 0, free: type.units };
    return { id: type.id, name: type.name, units: type.units, used: type.units - night.free, blocked: night.blocked };
  });
  const totalUnits = rooms.reduce((sum, room) => sum + room.units, 0);
  const usedUnits = rooms.reduce((sum, room) => sum + room.used, 0);

  // What still has to be set before the website should use this system.
  const checks: { ok: boolean; done: string; todo: string; fix?: string; fixText?: string }[] = [
    {
      ok: seasons.length > 0,
      done: "Season dates are set.",
      todo: "No season dates are set, so every night is priced as low season.",
      fix: "/admin/rates/#seasons",
      fixText: "Set season dates",
    },
    {
      ok: process.env.BOOKING_PROVIDER === "native",
      done: "The /book/ page uses this system.",
      todo: "The /book/ page does not use this system yet (the server needs BOOKING_PROVIDER=native).",
    },
    {
      ok: Boolean(process.env.SENDGRID_API_KEY && process.env.CONTACT_FROM_EMAIL),
      done: "Emails to guests and to the resort can be sent.",
      todo: "Emails can't be sent yet: SendGrid is not set up on this server.",
    },
    {
      ok: Boolean(process.env.DATABASE_URL),
      done: trialMode() ? "This is the trial's own database: what you do here does not reach the live site." : "This is the real database.",
      todo: "This is a local test database (DATABASE_URL is not set). Bookings made here are not real.",
    },
  ];
  const open = checks.filter((check) => !check.ok).length;

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Today</h1>
          <p className="adm-muted">Requests to answer, who arrives and leaves, and how full the resort is tonight.</p>
        </div>
        <Link className="adm-btn" href="/admin/reservations/new/">
          <PlusIcon />
          New booking
        </Link>
      </div>

      <div className="adm-stats">
        <Link href="/admin/reservations/?status=pending" className={`adm-stat ${waiting.length ? "adm-stat--hot" : ""}`}>
          <span className="adm-stat-icon adm-tint-3">
            <HourglassIcon />
          </span>
          <span className="adm-stat-value">{waiting.length}</span>
          <span className="adm-stat-label">{waiting.length === 1 ? "Request waiting" : "Requests waiting"}</span>
          <span className="adm-stat-go" aria-hidden="true">
            <ArrowRightIcon />
          </span>
        </Link>
        <div className="adm-stat">
          <span className="adm-stat-icon adm-tint-1">
            <ArrivalIcon />
          </span>
          <span className="adm-stat-value">{arriving.length}</span>
          <span className="adm-stat-label">
            Arriving in 7 days{arrivingToday > 0 && <span className="adm-stat-note"> · {arrivingToday} today</span>}
          </span>
        </div>
        <div className="adm-stat">
          <span className="adm-stat-icon adm-tint-0">
            <DepartureIcon />
          </span>
          <span className="adm-stat-value">{leaving.length}</span>
          <span className="adm-stat-label">Leaving today</span>
        </div>
        <Link href="/admin/calendar/" className="adm-stat adm-stat--ring">
          <Ring value={totalUnits ? usedUnits / totalUnits : 0} label={`${usedUnits} of ${totalUnits} rooms taken tonight`} />
          <span className="adm-stat-value">
            {usedUnits}
            <span className="adm-stat-of">/{totalUnits}</span>
          </span>
          <span className="adm-stat-label">Rooms taken tonight</span>
        </Link>
      </div>

      <div className="adm-dash">
        {cancelAsks.length > 0 && (
          <section className="adm-card adm-dash-main adm-callout" aria-labelledby="cancel-asks">
            <div className="adm-card-head">
              <h2 id="cancel-asks">
                Guests asking to cancel <span className="adm-count adm-count--bad">{cancelAsks.length}</span>
              </h2>
            </div>
            <ReservationTable compact rows={cancelAsks} empty="" />
          </section>
        )}

        <section className="adm-card adm-dash-main" aria-labelledby="requests">
          <div className="adm-card-head">
            <h2 id="requests">
              Requests waiting for you <span className="adm-count">{waiting.length}</span>
            </h2>
            <Link href="/admin/reservations/" className="adm-link">
              All bookings <ArrowRightIcon />
            </Link>
          </div>
          <ReservationTable compact rows={waiting} empty="No requests are waiting. New website bookings show up here." />
        </section>

        <section className="adm-card adm-dash-side" aria-labelledby="tonight">
          <div className="adm-card-head">
            <h2 id="tonight">Tonight</h2>
            <Link href="/admin/calendar/" className="adm-link">
              Calendar <ArrowRightIcon />
            </Link>
          </div>
          <ul className="adm-occupancy">
            {rooms.map((room) => (
              <li key={room.id}>
                <span className="adm-occupancy-name">
                  <BedIcon />
                  {room.name}
                </span>
                <span className="adm-occupancy-count">
                  {room.used}/{room.units}
                </span>
                <span className="adm-bar" aria-hidden="true">
                  <span style={{ width: `${room.units ? (room.used / room.units) * 100 : 0}%` }} />
                </span>
                {room.blocked > 0 && <span className="adm-muted adm-small">{room.blocked} blocked by staff</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className="adm-card" aria-labelledby="arriving">
          <div className="adm-card-head">
            <h2 id="arriving">
              Arriving in the next 7 days <span className="adm-count">{arriving.length}</span>
            </h2>
          </div>
          <GuestList rows={arriving} date="checkIn" empty="Nobody arrives in the next 7 days." />
        </section>

        <section className="adm-card" aria-labelledby="leaving">
          <div className="adm-card-head">
            <h2 id="leaving">
              Leaving today <span className="adm-count">{leaving.length}</span>
            </h2>
          </div>
          <GuestList rows={leaving} date="checkOut" empty="Nobody leaves today." />
        </section>

        {open > 0 && (
          <section className="adm-card adm-checklist" aria-labelledby="checklist">
            <div className="adm-card-head">
              <h2 id="checklist">
                Before going live <span className="adm-count adm-count--warn">{open} to do</span>
              </h2>
            </div>
            <ul className="adm-steps">
              {checks.map((check) => (
                <li key={check.done} className={check.ok ? "adm-step-done" : undefined}>
                  <span className="adm-step-mark">{check.ok ? <CheckIcon /> : <AlertIcon />}</span>
                  <span>
                    {check.ok ? check.done : check.todo}{" "}
                    {!check.ok && check.fix && <Link href={check.fix}>{check.fixText}</Link>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
