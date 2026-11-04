/**
 * Testimonial sliders (RT "Testimonial Slider" widget). The original runs Swiper with:
 *   slidesPerView 1, speed 3000ms, autoplay delay 3000ms, loop.
 * The markup and swiper.css are already on the page; this only moves the slides, and makes the widget's
 * previous / next arrows work (on the restaurant page they did nothing).
 * Returns a cleanup function.
 */
const SPEED = 3000;
const DELAY = 3000;
/** A slide moved with an arrow goes faster than the autoplay. */
const STEP_SPEED = 600;

function startSlider(swiper: HTMLElement): () => void {
  const wrapper = swiper.querySelector<HTMLElement>(":scope > .swiper-wrapper");
  if (!wrapper) return () => {};
  const slides = [...wrapper.querySelectorAll<HTMLElement>(":scope > .swiper-slide")];
  if (slides.length < 2) return () => {};

  // A copy of the first slide at the end lets the loop always move forward.
  const copy = slides[0].cloneNode(true) as HTMLElement;
  copy.setAttribute("aria-hidden", "true");
  wrapper.appendChild(copy);

  let index = 0;
  let timer = 0;

  const move = (speed: number) => {
    wrapper.style.transitionDuration = `${speed}ms`;
    wrapper.style.transform = `translate3d(${-index * swiper.clientWidth}px, 0, 0)`;
  };

  /** One slide forward or back; past either end it jumps to the matching slide of the loop first. */
  const step = (direction: 1 | -1, speed: number) => {
    window.clearTimeout(timer);
    if (direction === 1 && index === slides.length) index = 0;
    if (direction === -1 && index === 0) index = slides.length;
    move(0);
    void wrapper.offsetWidth; // apply the jump before the animated move
    index += direction;
    move(speed);
    timer = window.setTimeout(next, speed + DELAY);
  };

  const next = () => step(1, SPEED);

  const onTransitionEnd = () => {
    if (index === slides.length) {
      index = 0;
      move(0);
    }
  };

  const onResize = () => move(0);

  // The arrows sit next to the slider in the widget, as divs: make them buttons.
  const arrows = [...(swiper.closest(".elementor-widget")?.querySelectorAll<HTMLElement>(".swiper-button-prev, .swiper-button-next") ?? [])];
  const arrowStep = (arrow: HTMLElement) => step(arrow.classList.contains("swiper-button-prev") ? -1 : 1, STEP_SPEED);
  const onArrowClick = (event: MouseEvent) => arrowStep(event.currentTarget as HTMLElement);
  const onArrowKey = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    arrowStep(event.currentTarget as HTMLElement);
  };
  for (const arrow of arrows) {
    arrow.setAttribute("role", "button");
    arrow.setAttribute("tabindex", "0");
    arrow.setAttribute("aria-label", arrow.classList.contains("swiper-button-prev") ? "Previous review" : "Next review");
    arrow.addEventListener("click", onArrowClick);
    arrow.addEventListener("keydown", onArrowKey);
  }

  wrapper.addEventListener("transitionend", onTransitionEnd);
  window.addEventListener("resize", onResize);
  move(0);
  timer = window.setTimeout(next, DELAY);

  return () => {
    window.clearTimeout(timer);
    wrapper.removeEventListener("transitionend", onTransitionEnd);
    window.removeEventListener("resize", onResize);
    for (const arrow of arrows) {
      arrow.removeEventListener("click", onArrowClick);
      arrow.removeEventListener("keydown", onArrowKey);
    }
    copy.remove();
  };
}

export function startTestimonialSliders(): () => void {
  const stops = [...document.querySelectorAll<HTMLElement>(".testimonial__slider .swiper")].map(startSlider);
  return () => stops.forEach((stop) => stop());
}
