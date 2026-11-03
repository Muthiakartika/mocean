import { FIELDS, MESSAGES, validateContact } from "@/lib/contactForm";

/**
 * Receives the contact form (/contact/) and sends it by email through SendGrid.
 *
 * Environment (Vercel project settings; locally .env.local, see .env.example):
 *   SENDGRID_API_KEY    SendGrid API key with the "Mail Send" permission
 *   CONTACT_TO_EMAIL    where messages go; several addresses separated by commas
 *   CONTACT_FROM_EMAIL  sender address verified in SendGrid (Single Sender or an authenticated domain)
 *   CONTACT_FROM_NAME   optional sender name, default "Mocean Beach Resort website"
 * Without them, `npm run dev` prints the message to the server log instead of sending it;
 * a production server answers with an error.
 *
 * Answers JSON: { ok: true } | { ok: false, errors: { [fieldId]: text } } | { ok: false, message }.
 */
const SENDGRID_URL = "https://api.sendgrid.com/v3/mail/send";

const failed = (status: number) => Response.json({ ok: false, message: MESSAGES.sendFailed }, { status });

/** Only the site's own form may post here (browsers send Origin with every fetch POST). */
function fromThisSite(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (request.headers.get("host") ?? new URL(request.url).host);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!fromThisSite(request)) return Response.json({ ok: false }, { status: 403 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return failed(400);
  }
  const text = (name: string) => String(form.get(name) ?? "").trim();

  // People never see the honeypot field; bots fill it in. Answer as if the message was sent.
  if (text(FIELDS.honeypot)) return Response.json({ ok: true });

  const values = { name: text(FIELDS.name), email: text(FIELDS.email), message: text(FIELDS.message) };
  const errors = validateContact(values);
  if (Object.keys(errors).length) return Response.json({ ok: false, errors }, { status: 422 });

  const name = values.name.replace(/\s+/g, " ");
  const subject = `Website contact form: ${name}`;
  const body = [`Name: ${name}`, `Email: ${values.email}`, "", values.message || "(no message)"].join("\n");

  const { SENDGRID_API_KEY: key, CONTACT_TO_EMAIL: to, CONTACT_FROM_EMAIL: from, CONTACT_FROM_NAME: fromName } = process.env;
  if (!key || !to || !from) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[contact] SendGrid is not configured; this message would be sent:\n${subject}\n${body}`);
      return Response.json({ ok: true });
    }
    console.error("[contact] SENDGRID_API_KEY, CONTACT_TO_EMAIL or CONTACT_FROM_EMAIL is not set");
    return failed(500);
  }

  const recipients = to.split(",").map((email) => email.trim()).filter(Boolean);
  const response = await fetch(SENDGRID_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: recipients.map((email) => ({ email })) }],
      from: { email: from, name: fromName || "Mocean Beach Resort website" },
      // Answering the email goes to the visitor.
      reply_to: { email: values.email, name },
      subject,
      content: [{ type: "text/plain", value: body }],
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch((error: unknown) => {
    console.error("[contact] SendGrid request failed:", error);
    return null;
  });

  // SendGrid answers 202 Accepted when it takes the message.
  if (!response?.ok) {
    if (response) console.error(`[contact] SendGrid answered ${response.status}: ${await response.text().catch(() => "")}`);
    return failed(502);
  }
  return Response.json({ ok: true });
}
