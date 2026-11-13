import Link from "next/link";
import { getDb } from "@/lib/db";
import { countSampleBookings } from "@/lib/booking/native/samples";
import { loadSettings } from "@/lib/booking/native/settings";
import { trialMode } from "@/lib/booking/native/trial";
import { addSamplesAction, removeSamplesAction } from "../../actions";
import { ArrowRightIcon } from "../../icons";
import { Flash, one } from "../../ui";

type Task = { id: string; title: string; who: string; steps: React.ReactNode[]; note?: string; open: { href: string; label: string } };

/**
 * The everyday jobs, in a few steps each, for the owner and the staff. In the trial version it starts with the sample
 * bookings (add, remove). Keep the words here the same as the buttons and headings they point to.
 */
export default async function GuidePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const db = await getDb();
  const trial = trialMode();
  const [settings, samples] = await Promise.all([loadSettings(db), trial ? countSampleBookings(db) : Promise.resolve(0)]);
  const hold = `${settings.pendingHoldHours} hour${settings.pendingHoldHours === 1 ? "" : "s"}`;

  const tasks: Task[] = [
    {
      id: "prices",
      title: "Set prices for each season",
      who: "Owner",
      steps: [
        <>Open Prices. One table shows the price per night of every room type in low, shoulder and high season.</>,
        <>Change the prices you want, then press Save prices.</>,
        <>Under Seasons, add the first and last night of each high and shoulder season. Every other night is low season.</>,
        <>The coloured bar shows the whole year. For the next year, use the button that copies this year&apos;s dates, then adjust what moves.</>,
      ],
      note: "Bookings already made keep the price they were made at.",
      open: { href: "/admin/rates/", label: "Open Prices" },
    },
    {
      id: "requests",
      title: "Answer a booking request",
      who: "Staff",
      steps: [
        <>A booking made on the website is a request. It shows on Today under Requests waiting and holds its rooms for {hold}.</>,
        <>Open it and press Confirm booking. The guest gets an email.</>,
        <>Can&apos;t take it? Use Cancel this booking at the bottom of the page: the rooms go back on sale.</>,
        <>A request nobody answers in time stops holding its rooms and shows as expired.</>,
      ],
      open: { href: "/admin/reservations/?status=pending", label: "Open waiting requests" },
    },
    {
      id: "new-booking",
      title: "Add a booking from WhatsApp, phone or walk-in",
      who: "Staff",
      steps: [
        <>Press New booking in the menu (or + at the top of any page).</>,
        <>Choose check-in and check-out, then press Show free rooms.</>,
        <>Choose the rooms and extras and enter the guest. A price agreed with the guest goes in Total price; empty means the website price.</>,
        <>Press Save booking. It is confirmed at once, unless you choose Pending under Status.</>,
      ],
      note: "Only free rooms are offered, so the website can't sell the same room twice.",
      open: { href: "/admin/reservations/new/", label: "New booking" },
    },
    {
      id: "payment",
      title: "Record a payment",
      who: "Staff",
      steps: [
        <>Find the booking with the search at the top (number, name or email) and open it.</>,
        <>Under Payments, open Record a payment received. Enter the amount, how it was paid and the day.</>,
        <>Leave Confirm the booking ticked to confirm a waiting request at the same time, and Email the guest a receipt to send one.</>,
      ],
      note: "Every payment is also listed on Payments.",
      open: { href: "/admin/payments/", label: "Open Payments" },
    },
    {
      id: "calendar",
      title: "Read the calendar",
      who: "Everyone",
      steps: [
        <>Each room type has one row per room. Each bar is a stay, with the guest&apos;s name.</>,
        <>The key above the calendar says what each colour means: confirmed, waiting for you, or blocked.</>,
        <>Click a bar to open the booking. Earlier and Later move the dates; Today comes back.</>,
      ],
      open: { href: "/admin/calendar/", label: "Open Calendar" },
    },
    {
      id: "block",
      title: "Close rooms for some nights",
      who: "Staff",
      steps: [
        <>For repairs, the owner&apos;s own use, or rooms sold somewhere else: open Block dates.</>,
        <>Choose the room type, the first and last night and how many rooms, then save.</>,
        <>Those rooms disappear from the booking page for those nights. Remove the block to sell them again.</>,
      ],
      open: { href: "/admin/blocks/", label: "Open Block dates" },
    },
    {
      id: "cancel-asked",
      title: "When a guest asks to cancel",
      who: "Staff",
      steps: [
        <>Today shows Guests asking to cancel. Open the booking: the guest&apos;s note is at the top.</>,
        <>Agree with the guest what happens to the deposit (refunds are made outside this system).</>,
        <>Then cancel the booking under Cancel this booking. Until you do, it keeps its rooms.</>,
      ],
      open: { href: "/admin/", label: "Open Today" },
    },
    {
      id: "rooms",
      title: "Change room photos and text",
      who: "Owner",
      steps: [
        <>Open Rooms and click a room.</>,
        <>Add photos (several at once), make one the cover, or remove one. The cover is the first photo guests see.</>,
        <>Change the name, description, features or the number of rooms, then press Save.</>,
      ],
      open: { href: "/admin/rooms/", label: "Open Rooms" },
    },
  ];

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Guide</h1>
          <p className="adm-muted">The everyday jobs, a few steps each.</p>
        </div>
      </div>
      <Flash done={one(query.done)} error={one(query.error)} />

      {trial && (
        <section className="adm-card adm-guide-practice" id="practice" aria-labelledby="practice-title">
          <h2 id="practice-title">Try it with sample bookings</h2>
          <p>
            This is the trial version: nothing here reaches guests or the live website. Sample bookings fill the system with made-up guests around today:
            requests waiting, guests arriving and leaving, a guest asking to cancel, a cancelled booking and an expired request. Confirm, cancel and
            record payments on them as you like.
          </p>
          <div className="adm-actions">
            {samples > 0 ? (
              <>
                <span className="adm-muted">{samples} sample bookings are in the system.</span>
                <form action={removeSamplesAction}>
                  <button className="adm-btn adm-btn--quiet" type="submit">
                    Remove sample bookings
                  </button>
                </form>
              </>
            ) : (
              <form action={addSamplesAction}>
                <button className="adm-btn" type="submit">
                  Add sample bookings
                </button>
              </form>
            )}
          </div>
          <p className="adm-muted adm-small">Removing them leaves the bookings you made yourself, and your prices, seasons and rooms.</p>
        </section>
      )}

      <div className="adm-guide">
        {tasks.map((task) => (
          <section key={task.id} className="adm-card adm-guide-task" id={task.id} aria-labelledby={`${task.id}-title`}>
            <div className="adm-guide-head">
              <h2 id={`${task.id}-title`}>{task.title}</h2>
              <span className="adm-guide-who">{task.who}</span>
            </div>
            <ol>
              {task.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
            {task.note && <p className="adm-muted adm-small">{task.note}</p>}
            <Link className="adm-guide-open" href={task.open.href}>
              {task.open.label}
              <ArrowRightIcon />
            </Link>
          </section>
        ))}
      </div>
    </>
  );
}
