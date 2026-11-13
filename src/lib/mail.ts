/**
 * Sends a plain-text email through SendGrid, with the same environment as the contact form (src/app/api/contact/route.ts):
 *   SENDGRID_API_KEY, CONTACT_FROM_EMAIL (verified sender), CONTACT_FROM_NAME (optional).
 * Without them, `npm run dev` prints the message to the server log instead of sending it (answers true, so flows can be
 * tried); a production server logs the problem and answers false.
 *
 * In the trial version (BOOKING_TRIAL=1, src/lib/booking/native/trial.ts) nothing reaches guests or the resort: every
 * message goes to BOOKING_TRIAL_EMAIL only, or nowhere when that is not set.
 */
import { property } from "@/config/property";
import { trialInbox, trialMode } from "@/lib/booking/native/trial";

const SENDGRID_URL = "https://api.sendgrid.com/v3/mail/send";

export type Mail = {
  to: string[];
  subject: string;
  text: string;
  /** Where an answer goes (the guest, for mail to the resort). */
  replyTo?: { email: string; name?: string };
};

export async function sendMail(mail: Mail): Promise<boolean> {
  const recipients = mail.to.map((address) => address.trim()).filter(Boolean);
  if (recipients.length === 0) return false;
  if (!trialMode()) return deliver(recipients, mail);

  const inbox = trialInbox();
  if (inbox.length === 0) {
    console.info(`[mail] Trial version without BOOKING_TRIAL_EMAIL: not sent to ${recipients.join(", ")}: ${mail.subject}`);
    return true;
  }
  return deliver(inbox, {
    ...mail,
    subject: `[Trial] ${mail.subject}`,
    text: `Trial version: in the real system this email would go to ${recipients.join(", ")}.\n\n${mail.text}`,
  });
}

async function deliver(recipients: string[], mail: Mail): Promise<boolean> {
  const { SENDGRID_API_KEY: key, CONTACT_FROM_EMAIL: from, CONTACT_FROM_NAME: fromName } = process.env;
  if (!key || !from) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[mail] SendGrid is not configured; this message would be sent to ${recipients.join(", ")}:\n${mail.subject}\n\n${mail.text}`);
      return true;
    }
    console.error("[mail] SENDGRID_API_KEY or CONTACT_FROM_EMAIL is not set");
    return false;
  }

  const response = await fetch(SENDGRID_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: recipients.map((email) => ({ email })) }],
      from: { email: from, name: fromName || property.name },
      ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      subject: mail.subject,
      content: [{ type: "text/plain", value: mail.text }],
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch((error: unknown) => {
    console.error("[mail] SendGrid request failed:", error);
    return null;
  });

  if (!response?.ok) {
    if (response) console.error(`[mail] SendGrid answered ${response.status}: ${await response.text().catch(() => "")}`);
    return false;
  }
  return true;
}

/** Where the resort's own notices go: BOOKING_TO_EMAIL, else the contact form's CONTACT_TO_EMAIL; comma-separated. */
export function resortRecipients(): string[] {
  return (process.env.BOOKING_TO_EMAIL || process.env.CONTACT_TO_EMAIL || "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}
