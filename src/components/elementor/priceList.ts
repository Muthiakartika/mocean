/**
 * Logbook redesign (MASTER.md): an accordion that holds price tables (/pricing/) becomes a price list.
 *
 * Every category is open under its own heading, with a menu of the categories beside it (above it on phones):
 * "All prices" shows them all, a category shows only that one. The choice goes into the URL hash
 * (e.g. /pricing/#dive-prices), so a link can open a category directly.
 *
 * The original <details> markup stays: without JavaScript and in the original design ("?original") it is the
 * normal accordion. The accordion behaviour in ElementorBehaviors (one item open at a time) leaves it alone.
 * Returns a cleanup function.
 */

/** An accordion is a price list when its answers hold price tables. */
export const isPriceList = (accordion: Element) => accordion.querySelector(".eael-data-table") !== null;

const titleOf = (item: HTMLDetailsElement) =>
  (item.querySelector(".e-n-accordion-item-title-text")?.textContent ?? "").replace(/\s+/g, " ").trim();

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function setup(accordion: HTMLElement): () => void {
  const widget = accordion.closest<HTMLElement>(".elementor-widget-n-accordion");
  const items = [...accordion.querySelectorAll<HTMLDetailsElement>(":scope > .e-n-accordion-item")];
  if (!widget || items.length < 2) return () => {};

  const titles = items.map(titleOf);
  const slugs = titles.map(slug);
  const wasOpen = items.map((item) => item.open);

  // Each category: open, its summary replaced by a plain heading (same level as the summary's).
  const headings = items.map((item, i) => {
    const summary = item.querySelector<HTMLElement>(":scope > summary");
    const heading = document.createElement("h2");
    heading.className = "rd-price-title";
    heading.id = `rd-price-${slugs[i]}`;
    heading.textContent = titles[i];
    summary?.after(heading);
    if (summary) summary.hidden = true;
    item.open = true;
    item.setAttribute("aria-labelledby", heading.id);
    return heading;
  });

  // The category menu.
  const nav = document.createElement("nav");
  nav.className = "rd-price-nav";
  nav.setAttribute("aria-label", "Price categories");
  const buttons = ["All prices", ...titles].map((label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "rd-price-nav-item";
    button.textContent = label;
    nav.append(button);
    return button;
  });
  accordion.before(nav);
  widget.classList.add("rd-price-list");

  const grid = accordion.parentElement!;

  // On phones the menu scrolls sideways: keep the chosen category in view (after layout and web fonts settle).
  const showActive = () =>
    requestAnimationFrame(() => {
      const active = nav.querySelector<HTMLElement>('[aria-pressed="true"]')?.getBoundingClientRect();
      if (!active) return;
      const left = active.left - nav.getBoundingClientRect().left + nav.scrollLeft;
      nav.scrollTo({ left: left - (nav.clientWidth - active.width) / 2 });
    });

  /** -1 = all categories. */
  const select = (index: number, { scroll }: { scroll: boolean }) => {
    items.forEach((item, i) => {
      item.hidden = index >= 0 && i !== index;
    });
    buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index + 1)));
    showActive();
    const hash = index >= 0 ? `#${slugs[index]}` : "";
    if (location.hash !== hash) history.replaceState(null, "", hash || location.pathname + location.search);
    if (scroll && grid.getBoundingClientRect().top < 0) grid.scrollIntoView({ block: "start" });
  };

  const onNavClick = (event: MouseEvent) => {
    const button = (event.target as HTMLElement).closest("button");
    const i = button ? buttons.indexOf(button as HTMLButtonElement) : -1;
    if (i >= 0) select(i - 1, { scroll: true });
  };

  const fromHash = () => {
    const i = slugs.indexOf(decodeURIComponent(location.hash.slice(1)));
    select(i, { scroll: false });
    if (i >= 0) grid.scrollIntoView({ block: "start" });
  };

  // A link to a category (/pricing/#dive-prices): the browser's own jump to the hash finds no element and runs
  // after this setup, so the list is brought into view once the page has loaded.
  const i = slugs.indexOf(decodeURIComponent(location.hash.slice(1)));
  select(i, { scroll: false });
  const timer = i >= 0 ? window.setTimeout(() => grid.scrollIntoView({ block: "start" }), 120) : 0;
  document.fonts?.ready.then(showActive);
  nav.addEventListener("click", onNavClick);
  window.addEventListener("hashchange", fromHash);

  return () => {
    window.clearTimeout(timer);
    nav.removeEventListener("click", onNavClick);
    window.removeEventListener("hashchange", fromHash);
    nav.remove();
    widget.classList.remove("rd-price-list");
    items.forEach((item, i) => {
      headings[i].remove();
      const summary = item.querySelector<HTMLElement>(":scope > summary");
      if (summary) summary.hidden = false;
      item.hidden = false;
      item.open = wasOpen[i];
      item.removeAttribute("aria-labelledby");
    });
  };
}

export function applyPriceLists(): () => void {
  if (document.documentElement.dataset.design === "original") return () => {};
  const cleanups = [...document.querySelectorAll<HTMLElement>(".e-n-accordion")].filter(isPriceList).map(setup);
  return () => cleanups.forEach((cleanup) => cleanup());
}
