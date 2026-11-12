/**
 * Sends a plain-text email through SendGrid, with the same environment as the contact form (src/app/api/contact/route.ts):
 *   SENDGRID_API_KEY, CONTACT_FROM_EMAIL (verified sender), CONTACT_FROM_NAME (optional).
 * Without them, `npm run dev` prints the message to the server log instead of sending it (answers true, so flows can be
 * tried); a production server logs the problem and answers false.
 */
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
      from: { email: from, name: fromName || "Mocean Beach Resort" },
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
