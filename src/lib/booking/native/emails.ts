import { property } from "@/config/property";
import { sendMail, resortRecipients } from "@/lib/mail";
import { formatDay, formatMoney, nightsBetween } from "@/lib/booking/stay";
import { manageUrl } from "./guest-link";
import type { PaymentSettings } from "./payment-settings";
import { amountToPay, payOptions, summarize } from "./payments";
import type { ReservationDetail } from "./store";

/**
 * How to pay the deposit, for an email: the online page (the guest's booking page has the button) and/or the bank
 * account. Nothing when no way to pay is set up, or nothing is due.
 */
function howToPay(detail: ReservationDetail, settings: PaymentSettings | undefined, lead: string): string[] {
  if (!settings) return [];
  const { reservation } = detail;
  const summary = summarize(reservation, detail.payments);
  if (summary.depositDue <= 0 || amountToPay(reservation, summary) <= 0) return [];
  const options = payOptions(settings);
  const online = options.online && Boolean(reservation.email);
  if (!online && !options.bank) return [];
  const lines = [`${lead} ${formatMoney(summary.depositDue)}.`];
  if (online) lines.push(`Pay online on your booking page: ${manageUrl(reservation.code, reservation.email)}`);
  if (options.bank) {
    lines.push(
      "",
      online ? "Or by bank transfer:" : "By bank transfer:",
      `Bank: ${settings.bankName}`,
      `Account name: ${settings.bankAccountName}`,
      `Account number: ${settings.bankAccountNumber}`,
      `Reference: ${reservation.code}`,
    );
    if (settings.bankNote) lines.push(settings.bankNote);
  }
  return lines;
}

/**
 * The emails of the booking system: to the guest when a booking arrives, is confirmed or is cancelled, and to the resort
 * when a booking arrives from the website. Plain text. Sending is best effort: a failed email never fails a booking
 * (the admin lists every booking anyway), it is only logged.
 */

const NAME = property.name;
const SIGN_OFF = `${NAME}, ${property.region}\nWhatsApp: ${property.whatsappUrl}`;

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

/**
 * A booking from the website: a request awaiting confirmation, or already confirmed when auto-confirm is on. With a way
 * to pay set up (admin > Payments), the request mail says how to pay the deposit that confirms it.
 */
export async function sendBookingReceived(detail: ReservationDetail, holdHours: number, payment?: PaymentSettings) {
  const { reservation } = detail;
  try {
    if (reservation.status === "confirmed") {
      const pay = howToPay(detail, payment, "Please pay the deposit of");
      await toGuest(
        detail,
        `Your booking ${reservation.code} is confirmed | ${NAME}`,
        [`Thank you for booking with ${NAME}. Your booking is confirmed.`, ...(pay.length ? ["", ...pay] : [])].join("\n"),
        "Questions or a pickup to arrange? Reply to this email or message us on WhatsApp.",
      );
    } else {
      const pay = howToPay(detail, payment, "To confirm it, please pay the deposit of");
      await toGuest(
        detail,
        `We received your booking request ${reservation.code} | ${NAME}`,
        [`Thank you for booking with ${NAME}. We have your request and are holding your room for ${holdHours} hours.`, ...(pay.length ? ["", ...pay] : [])].join(
          "\n",
        ),
        pay.length
          ? "We confirm your booking by email as soon as the deposit arrives. Questions? Reply to this email or message us on WhatsApp."
          : "We will email you to confirm your booking and to arrange the deposit. Questions? Reply to this email or message us on WhatsApp.",
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

/** Staff confirmed the booking. If the deposit is still open (and a way to pay is set up), the mail says how to pay. */
export async function sendBookingConfirmed(detail: ReservationDetail, payment?: PaymentSettings): Promise<boolean> {
  try {
    const pay = howToPay(detail, payment, "Please pay the deposit of");
    return await toGuest(
      detail,
      `Your booking ${detail.reservation.code} is confirmed | ${NAME}`,
      [`Good news: your booking at ${NAME} is confirmed.`, ...(pay.length ? ["", ...pay] : [])].join("\n"),
      "Questions or a pickup to arrange? Reply to this email or message us on WhatsApp.",
    );
  } catch (error) {
    console.error("[booking] confirmation email failed:", error);
    return false;
  }
}

/**
 * Money arrived: to the guest ("we received your payment", and "your booking is confirmed" when the payment just did
 * that) and to the resort. `problem` tells the resort what it still has to do (e.g. the room went to someone else).
 */
export async function sendPaymentReceived(
  detail: ReservationDetail,
  payment: { amount: number; how: string; confirmed: boolean; problem?: string; notifyGuest?: boolean },
): Promise<boolean> {
  const { reservation } = detail;
  const summary = summarize(reservation, detail.payments);
  let sent = false;
  try {
    if (payment.notifyGuest !== false) {
      const status = payment.confirmed ? " Your booking is confirmed." : reservation.status === "confirmed" ? " Your booking stays confirmed." : "";
      sent = await toGuest(
        detail,
        `Payment received for booking ${reservation.code} | ${NAME}`,
        [
          `Thank you: we received your payment of ${formatMoney(payment.amount)}.${status}`,
          summary.balance > 0 ? `Paid so far: ${formatMoney(summary.paid)}. Still to pay: ${formatMoney(summary.balance)}.` : "Your booking is paid in full.",
        ].join("\n"),
        "Questions or a pickup to arrange? Reply to this email or message us on WhatsApp.",
      );
    }
    await toResort(detail, `Payment received ${reservation.code}: ${formatMoney(payment.amount)} (${payment.how})`, [
      `${reservation.firstName} ${reservation.lastName} paid ${formatMoney(payment.amount)} (${payment.how}).`,
      payment.confirmed ? "The booking was confirmed automatically." : "",
      payment.problem ? `To do: ${payment.problem}` : "",
      `Paid so far: ${formatMoney(summary.paid)} of ${formatMoney(reservation.total)}.`,
    ].filter(Boolean));
  } catch (error) {
    console.error("[booking] payment emails failed:", error);
  }
  return sent;
}

export async function sendBookingCancelled(detail: ReservationDetail): Promise<boolean> {
  try {
    return await toGuest(
      detail,
      `Your booking ${detail.reservation.code} was cancelled | ${NAME}`,
      `Your booking at ${NAME} was cancelled.`,
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
      `Your booking request ${reservation.code} is cancelled | ${NAME}`,
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
      `We received your cancellation request for ${reservation.code} | ${NAME}`,
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
