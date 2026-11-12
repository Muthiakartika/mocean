import { contact } from "@/data/contact";
import { sendMail, resortRecipients } from "@/lib/mail";
import { formatDay, formatMoney, nightsBetween } from "@/lib/booking/stay";
import { manageUrl } from "./guest-link";
import type { ReservationDetail } from "./store";

/**
 * The emails of the booking system: to the guest when a booking arrives, is confirmed or is cancelled, and to the resort
 * when a booking arrives from the website. Plain text. Sending is best effort: a failed email never fails a booking
 * (the admin lists every booking anyway), it is only logged.
 */

const SIGN_OFF = `Mocean Beach Resort, West Sumbawa\nWhatsApp: ${contact.whatsappUrl}`;

function describe({ reservation, rooms, extras }: ReservationDetail) {
  const nights = nightsBetween(reservation.checkIn, reservation.checkOut);
  const lines = [
    `Booking number: ${reservation.code}`,
    `Check-in: ${formatDay(reservation.checkIn)}`,
    `Check-out: ${formatDay(reservation.checkOut)} (${nights} night${nights === 1 ? "" : "s"})`,
    "",
    "Rooms:",
    ...rooms.map((room) => `- ${room.roomName}, ${room.rateName}, ${room.adults + room.children} guest${room.adults + room.children === 1 ? "" : "s"}: ${formatMoney(room.total)}`),
  ];
  if (extras.length) {
    lines.push("", "Extras:", ...extras.map((extra) => `- ${extra.name}${extra.quantity > 1 ? ` x ${extra.quantity}` : ""}: ${formatMoney(extra.unitPrice * extra.quantity)}`));
  }
  lines.push("", `Total: ${formatMoney(reservation.total)} (tax and service included)`, `Deposit to confirm: ${formatMoney(reservation.deposit)}`);
  return lines.join("\n");
}

/** True when the email went out; false when the guest left no address or sending failed. */
async function toGuest(detail: ReservationDetail, subject: string, intro: string, outro: string): Promise<boolean> {
  const { reservation } = detail;
  if (!reservation.email) return false;
  // Every mail about a booking that still stands carries the guest's own page (see it, cancel it, write to the resort).
  const manage = reservation.status === "cancelled" ? [] : [`See or cancel your booking, or write to us: ${manageUrl(reservation.code, reservation.email)}`, ""];
  return sendMail({
    to: [reservation.email],
    subject,
    text: [`Hello ${reservation.firstName},`, "", intro, "", describe(detail), "", ...manage, outro, "", SIGN_OFF].join("\n"),
  });
}

/** A notice to the resort about one booking; answering it writes to the guest. */
function toResort(detail: ReservationDetail, subject: string, lines: string[]) {
  const { reservation } = detail;
  return sendMail({
    to: resortRecipients(),
    subject,
    replyTo: reservation.email ? { email: reservation.email, name: `${reservation.firstName} ${reservation.lastName}` } : undefined,
    text: [...lines, "", describe(detail), "", `Guest: ${reservation.firstName} ${reservation.lastName}`, `Email: ${reservation.email}`, `Phone: ${reservation.phone}`].join("\n"),
  });
}

/** A booking from the website: a request awaiting confirmation, or already confirmed when auto-confirm is on. */
export async function sendBookingReceived(detail: ReservationDetail, holdHours: number) {
  const { reservation } = detail;
  try {
    if (reservation.status === "confirmed") {
      await toGuest(
        detail,
        `Your booking ${reservation.code} is confirmed | Mocean Beach Resort`,
        "Thank you for booking with Mocean Beach Resort. Your booking is confirmed.",
        "Questions or a pickup to arrange? Reply to this email or message us on WhatsApp.",
      );
    } else {
      await toGuest(
        detail,
        `We received your booking request ${reservation.code} | Mocean Beach Resort`,
        `Thank you for booking with Mocean Beach Resort. We have your request and are holding your room for ${holdHours} hours while we confirm it.`,
        "We will email you to confirm your booking and to arrange the deposit. Questions? Reply to this email or message us on WhatsApp.",
      );
    }

    await sendMail({
      to: resortRecipients(),
      subject: `New website booking ${reservation.code}: ${reservation.firstName} ${reservation.lastName}, ${reservation.checkIn}`,
      replyTo: reservation.email ? { email: reservation.email, name: `${reservation.firstName} ${reservation.lastName}` } : undefined,
      text: [
        reservation.status === "confirmed" ? "A booking came in from the website (confirmed automatically)." : "A booking request came in from the website. Confirm or cancel it in the admin.",
        "",
        describe(detail),
        "",
        `Guest: ${reservation.firstName} ${reservation.lastName}`,
        `Email: ${reservation.email}`,
        `Phone: ${reservation.phone}`,
        `Country: ${reservation.country}`,
        reservation.arrivalTime ? `Arrival time: ${reservation.arrivalTime}` : "",
        reservation.notes ? `Requests: ${reservation.notes}` : "",
      ]
        .filter((line, index, all) => line !== "" || all[index - 1] !== "")
        .join("\n"),
    });
  } catch (error) {
    console.error("[booking] notification email failed:", error);
  }
}

export async function sendBookingConfirmed(detail: ReservationDetail): Promise<boolean> {
  try {
    return await toGuest(
      detail,
      `Your booking ${detail.reservation.code} is confirmed | Mocean Beach Resort`,
      "Good news: your booking at Mocean Beach Resort is confirmed.",
      "Questions or a pickup to arrange? Reply to this email or message us on WhatsApp.",
    );
  } catch (error) {
    console.error("[booking] confirmation email failed:", error);
    return false;
  }
}

export async function sendBookingCancelled(detail: ReservationDetail): Promise<boolean> {
  try {
    return await toGuest(
      detail,
      `Your booking ${detail.reservation.code} was cancelled | Mocean Beach Resort`,
      "Your booking at Mocean Beach Resort was cancelled.",
      "If this is a surprise, reply to this email or message us on WhatsApp.",
    );
  } catch (error) {
    console.error("[booking] cancellation email failed:", error);
    return false;
  }
}

/** The guest cancelled a request that was not confirmed yet (Manage my booking). */
export async function sendGuestCancelled(detail: ReservationDetail) {
  const { reservation } = detail;
  try {
    await toGuest(
      detail,
      `Your booking request ${reservation.code} is cancelled | Mocean Beach Resort`,
      "As you asked, we cancelled your booking request. Nothing was charged.",
      "Changed your mind? Book again on our website or message us on WhatsApp.",
    );
    await toResort(detail, `Guest cancelled request ${reservation.code}: ${reservation.firstName} ${reservation.lastName}, ${reservation.checkIn}`, [
      "The guest cancelled this booking request on the website. Its rooms are for sale again; nothing to do.",
    ]);
  } catch (error) {
    console.error("[booking] cancellation emails failed:", error);
  }
}

/** The guest asks to cancel a confirmed booking: staff settle the deposit and cancel it in the admin. */
export async function sendCancelRequested(detail: ReservationDetail) {
  const { reservation } = detail;
  try {
    await toResort(detail, `Cancellation request ${reservation.code}: ${reservation.firstName} ${reservation.lastName}, ${reservation.checkIn}`, [
      "The guest asked to cancel this confirmed booking on the website. It keeps its rooms until you cancel it in the admin.",
      reservation.cancelRequestNote ? `Guest's note: ${reservation.cancelRequestNote}` : "The guest left no note.",
    ]);
    await toGuest(
      detail,
      `We received your cancellation request for ${reservation.code} | Mocean Beach Resort`,
      "We received your request to cancel this booking. We will reply by email about the cancellation and your deposit.",
      "Questions? Reply to this email or message us on WhatsApp.",
    );
  } catch (error) {
    console.error("[booking] cancellation request emails failed:", error);
  }
}

/** A message the guest wrote on Manage my booking. True when it went to the resort's mailbox. */
export async function sendGuestMessage(detail: ReservationDetail, message: string): Promise<boolean> {
  const { reservation } = detail;
  try {
    return await toResort(detail, `Message about ${reservation.code} from ${reservation.firstName} ${reservation.lastName}`, [
      "The guest sent this message from the website (reply to this email to answer them):",
      "",
      message,
    ]);
  } catch (error) {
    console.error("[booking] guest message email failed:", error);
    return false;
  }
}
