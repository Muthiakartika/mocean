/**
 * Restaurant menu (theme widget "restaurant_menu", /restaurant/): the category buttons switch the dish panels.
 * On the original site the theme's script did this; without it the buttons did nothing.
 * Returns a cleanup function.
 */
export function applyMenuTabs(): () => void {
  const stops = [...document.querySelectorAll<HTMLElement>(".resturant__menu__list")].map((list) => {
    const root = list.parentElement ?? list;
    const buttons = [...list.querySelectorAll<HTMLButtonElement>(".menu-tab-btn")];
    const panels = [...root.querySelectorAll<HTMLElement>(":scope > .menu-tab-panel")];

    const select = (button: HTMLButtonElement) => {
      for (const b of buttons) {
        const on = b === button;
        b.classList.toggle("active", on);
        b.setAttribute("aria-selected", String(on));
        b.tabIndex = on ? 0 : -1;
      }
      for (const panel of panels) panel.classList.toggle("active", panel.id === button.dataset.tab);
      // In the one-row strip on phones, bring the chosen category into view.
      button.scrollIntoView({ block: "nearest", inline: "nearest" });
    };

    const onClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".menu-tab-btn");
      if (button && buttons.includes(button)) select(button);
    };

    // Arrow keys move between categories, as in a tab list.
    const onKeyDown = (event: KeyboardEvent) => {
      const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (i < 0 || (event.key !== "ArrowRight" && event.key !== "ArrowLeft")) return;
      event.preventDefault();
      const next = buttons[(i + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length];
      select(next);
      next.focus();
    };

    for (const b of buttons) {
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", b.dataset.tab ?? "");
      b.setAttribute("aria-selected", String(b.classList.contains("active")));
      b.tabIndex = b.classList.contains("active") ? 0 : -1;
    }
    for (const panel of panels) panel.setAttribute("role", "tabpanel");

    list.addEventListener("click", onClick);
    list.addEventListener("keydown", onKeyDown);
    return () => {
      list.removeEventListener("click", onClick);
      list.removeEventListener("keydown", onKeyDown);
    };
  });
  return () => stops.forEach((stop) => stop());
}
