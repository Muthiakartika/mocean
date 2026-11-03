import { MESSAGES, validateContact } from "@/lib/contactForm";

/**
 * Contact form (/contact/, the original WPForms markup): behaves like WPForms' AJAX form did.
 *   - checks the fields on submit and then as the visitor types, with WPForms' messages under each field;
 *   - sends to /api/contact/ (SendGrid), the button shows "Sending..." and the spinner meanwhile;
 *   - replaces the form with the confirmation message, or shows an error above the button.
 * Works in the redesign and in the original design. Returns a cleanup function.
 */
const fieldIds = ["1", "2", "3"];

function setup(form: HTMLFormElement): () => void {
  // WPForms (jQuery Validate) showed its own messages instead of the browser's.
  form.noValidate = true;
  const field = (id: string) => form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="wpforms[fields][${id}]"]`);
  const values = () => ({ name: field("1")?.value.trim() ?? "", email: field("2")?.value.trim() ?? "", message: field("3")?.value.trim() ?? "" });
  const button = form.querySelector<HTMLButtonElement>(".wpforms-submit");
  const spinner = form.querySelector<HTMLElement>(".wpforms-submit-spinner");
  let checking = false;

  // Same markup as WPForms: <em id="…-error" class="wpforms-error" role="alert"> after the field.
  const showErrors = (errors: Record<string, string>) => {
    for (const id of fieldIds) {
      const input = field(id);
      if (!input) continue;
      const message = errors[id];
      let note = form.querySelector<HTMLElement>(`[id="${input.id}-error"]`);
      input.classList.toggle("wpforms-error", !!message);
      input.closest(".wpforms-field")?.classList.toggle("wpforms-has-error", !!message);
      if (message) {
        input.setAttribute("aria-invalid", "true");
        if (!note) {
          note = document.createElement("em");
          note.id = `${input.id}-error`;
          note.className = "wpforms-error";
          note.setAttribute("role", "alert");
          input.after(note);
        }
        note.textContent = message;
      } else {
        input.removeAttribute("aria-invalid");
        note?.remove();
      }
    }
  };

  const showFormError = (message?: string) => {
    form.querySelector(".wpforms-error-container")?.remove();
    if (!message) return;
    const box = document.createElement("div");
    box.className = "wpforms-error-container";
    box.setAttribute("role", "alert");
    const text = document.createElement("p");
    text.textContent = message;
    box.append(text);
    form.querySelector(".wpforms-submit-container")?.before(box);
  };

  const setSending = (sending: boolean) => {
    if (button) {
      button.disabled = sending;
      button.textContent = (sending ? button.dataset.altText : button.dataset.submitText) ?? button.textContent;
    }
    if (spinner) spinner.style.display = sending ? "inline-block" : "none";
  };

  const showConfirmation = () => {
    const box = document.createElement("div");
    box.className = "wpforms-confirmation-container-full wpforms-confirmation-scroll";
    box.id = `wpforms-confirmation-${form.dataset.formid}`;
    box.setAttribute("role", "status");
    const text = document.createElement("p");
    text.textContent = MESSAGES.sent;
    box.append(text);
    form.replaceWith(box);
    box.scrollIntoView({ block: "center" });
  };

  const check = () => {
    const errors = validateContact(values());
    showErrors(errors);
    return Object.keys(errors);
  };

  const onInput = () => {
    if (checking) check();
  };

  const onSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (button?.disabled) return;
    checking = true;
    showFormError();
    const invalid = check();
    if (invalid.length) {
      field(invalid[0])?.focus();
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/contact/", { method: "POST", body: new FormData(form) });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; errors?: Record<string, string>; message?: string };
      if (response.ok && result.ok) return showConfirmation();
      if (result.errors) {
        showErrors(result.errors);
        field(Object.keys(result.errors)[0])?.focus();
      } else {
        showFormError(result.message ?? MESSAGES.sendFailed);
      }
    } catch {
      showFormError(MESSAGES.sendFailed);
    }
    setSending(false);
  };

  form.addEventListener("submit", onSubmit);
  form.addEventListener("input", onInput);
  return () => {
    form.removeEventListener("submit", onSubmit);
    form.removeEventListener("input", onInput);
  };
}

export function applyContactForms(): () => void {
  const cleanups = [...document.querySelectorAll<HTMLFormElement>("#mocean-page form.wpforms-form")].map(setup);
  return () => cleanups.forEach((cleanup) => cleanup());
}
