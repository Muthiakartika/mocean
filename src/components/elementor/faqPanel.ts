/**
 * Logbook redesign (MASTER.md): on wide screens each FAQ accordion becomes an index of questions
 * with the chosen answer shown in a panel beside it.
 *
 * The original <details> markup stays as it is: on phones and tablets, without JavaScript and in the
 * original design ("?original") it is the normal accordion. On wide screens:
 *   - the widget gets the class rd-faq-index (styles in src/styles/redesign/inner-pages.css);
 *   - one question is always open (the first by default) and its answer is copied into the panel;
 *   - ArrowUp / ArrowDown move between questions, and the panel links to the next question.
 * Returns a cleanup function.
 */
const WIDE = "(min-width: 1025px)";

// A copy of the whole answer (some answers are full layouts, e.g. the price cards on /pricing/). It keeps its
// classes so the page CSS still applies; ids and the region role stay with the original.
function answerContent(item: HTMLDetailsElement): Node[] {
  const region = item.querySelector(":scope > :not(summary)");
  if (!region) return [];
  const copy = region.cloneNode(true) as Element;
  copy.removeAttribute("role");
  copy.removeAttribute("aria-labelledby");
  [copy, ...copy.querySelectorAll("[id]")].forEach((el) => el.removeAttribute("id"));
  return [copy];
}

const questionText = (item: HTMLDetailsElement) =>
  (item.querySelector(".e-n-accordion-item-title-text")?.textContent ?? "").replace(/\s+/g, " ").trim();

function setup(accordion: HTMLElement): () => void {
  const widget = accordion.closest<HTMLElement>(".elementor-widget-n-accordion");
  const items = [...accordion.querySelectorAll<HTMLDetailsElement>(":scope > .e-n-accordion-item")];
  if (!widget || items.length < 2) return () => {};

  const panel = document.createElement("div");
  panel.className = "rd-faq-panel";
  panel.setAttribute("aria-live", "polite");
  accordion.after(panel);

  const wide = window.matchMedia(WIDE);

  const render = (item: HTMLDetailsElement) => {
    const i = items.indexOf(item);
    const next = items[(i + 1) % items.length];
    const title = document.createElement("p");
    title.className = "rd-faq-panel-title";
    title.textContent = questionText(item);
    const body = document.createElement("div");
    body.className = "rd-faq-panel-body";
    body.append(...answerContent(item));
    const nav = document.createElement("div");
    nav.className = "rd-faq-panel-next";
    const label = document.createElement("span");
    label.textContent = "Next question";
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = questionText(next);
    button.addEventListener("click", () => {
      open(next);
      reveal();
      next.querySelector<HTMLElement>(":scope > summary")?.focus({ preventScroll: true });
    });
    nav.append(label, button);
    panel.replaceChildren(title, body, nav);
  };

  // After the visitor picks a question far down a long answer, bring the start of the new answer into view
  // (scrolling to the grid, not to the sticky panel).
  const grid = accordion.parentElement!;
  const reveal = () => {
    if (grid.getBoundingClientRect().top < 0) grid.scrollIntoView({ block: "start" });
  };

  const open = (item: HTMLDetailsElement) => {
    items.forEach((other) => {
      other.open = other === item;
      other.querySelector(":scope > summary")?.setAttribute("aria-expanded", String(other === item));
    });
    render(item);
  };

  // A summary click (or Enter / Space on it) opens its item natively; the toggle event follows.
  let picked = false;

  const onToggle = (event: Event) => {
    const item = event.target as HTMLDetailsElement;
    if (!wide.matches || !item.open || !items.includes(item)) return;
    render(item);
    if (picked) reveal();
    picked = false;
  };

  // In the index the open question stays open (clicking it again would leave the panel empty).
  const onClick = (event: MouseEvent) => {
    const summary = (event.target as HTMLElement).closest("summary");
    const item = summary?.parentElement as HTMLDetailsElement | null;
    if (!wide.matches || !item || !items.includes(item)) return;
    if (item.open) event.preventDefault();
    else picked = true;
  };

  const onKey = (event: KeyboardEvent) => {
    if (!wide.matches || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
    const item = (event.target as HTMLElement).closest("details") as HTMLDetailsElement | null;
    const i = item ? items.indexOf(item) : -1;
    if (i < 0) return;
    event.preventDefault();
    const target = items[(i + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length];
    open(target);
    reveal();
    target.querySelector<HTMLElement>(":scope > summary")?.focus();
  };

  const apply = () => {
    widget.classList.toggle("rd-faq-index", wide.matches);
    panel.hidden = !wide.matches;
    if (wide.matches) open(items.find((item) => item.open) ?? items[0]);
  };

  apply();
  wide.addEventListener("change", apply);
  accordion.addEventListener("toggle", onToggle, true);
  accordion.addEventListener("click", onClick);
  accordion.addEventListener("keydown", onKey);
  return () => {
    wide.removeEventListener("change", apply);
    accordion.removeEventListener("toggle", onToggle, true);
    accordion.removeEventListener("click", onClick);
    accordion.removeEventListener("keydown", onKey);
    widget.classList.remove("rd-faq-index");
    panel.remove();
  };
}

export function applyFaqPanels(): () => void {
  if (document.documentElement.dataset.design === "original") return () => {};
  const cleanups = [...document.querySelectorAll<HTMLElement>(".e-n-accordion")].map(setup);
  return () => cleanups.forEach((cleanup) => cleanup());
}
