/**
 * Contact form on /contact/ (the original WPForms form 16609, markup in src/content/pages/contact.json).
 * Shared by the browser (src/components/elementor/contactForm.ts) and the server (src/app/api/contact/route.ts),
 * so both check the fields the same way.
 */

/** WPForms field names of form 16609. Field 4 is the anti-spam honeypot, hidden from people. */
export const FIELDS = {
  name: "wpforms[fields][1]",
  email: "wpforms[fields][2]",
  message: "wpforms[fields][3]",
  honeypot: "wpforms[fields][4]",
} as const;

/**
 * Texts shown to the visitor. Validation and confirmation are WPForms' default texts (what the original
 * showed unless the owner changed them in WPForms); sendFailed is new, there was no such state to copy.
 */
export const MESSAGES = {
  required: "This field is required.",
  email: "Please enter a valid email address.",
  tooLong: (max: number) => `Please enter no more than ${max} characters.`,
  sent: "Thanks for contacting us! We will be in touch with you shortly.",
  sendFailed: "Your message could not be sent. Please try again later.",
};

export const LIMITS = { name: 200, email: 254, message: 5000 };

export type ContactValues = { name: string; email: string; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Errors keyed by WPForms field id ("1" name, "2" email, "3" message); empty when the values can be sent. */
export function validateContact({ name, email, message }: ContactValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!name) errors["1"] = MESSAGES.required;
  else if (name.length > LIMITS.name) errors["1"] = MESSAGES.tooLong(LIMITS.name);
  if (!email) errors["2"] = MESSAGES.required;
  else if (email.length > LIMITS.email || !EMAIL.test(email)) errors["2"] = MESSAGES.email;
  if (message.length > LIMITS.message) errors["3"] = MESSAGES.tooLong(LIMITS.message);
  return errors;
}
