/**
 * Testimonial sliders (RT "Testimonial Slider" widget). The original runs Swiper with:
 *   slidesPerView 1, speed 3000ms, autoplay delay 3000ms, loop.
 * The markup and swiper.css are already on the page; this only moves the slides.
 * Returns a cleanup function.
 */
const SPEED = 3000;
const DELAY = 3000;

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

  const move = (animate: boolean) => {
    wrapper.style.transitionDuration = animate ? `${SPEED}ms` : "0ms";
    wrapper.style.transform = `translate3d(${-index * swiper.clientWidth}px, 0, 0)`;
  };

  const next = () => {
    index += 1;
    move(true);
    timer = window.setTimeout(next, SPEED + DELAY);
  };

  const onTransitionEnd = () => {
    if (index === slides.length) {
      index = 0;
      move(false);
    }
  };

  const onResize = () => move(false);

  wrapper.addEventListener("transitionend", onTransitionEnd);
  window.addEventListener("resize", onResize);
  move(false);
  timer = window.setTimeout(next, DELAY);

  return () => {
    window.clearTimeout(timer);
    wrapper.removeEventListener("transitionend", onTransitionEnd);
    window.removeEventListener("resize", onResize);
    copy.remove();
  };
}

export function startTestimonialSliders(): () => void {
  const stops = [...document.querySelectorAll<HTMLElement>(".testimonial__slider .swiper")].map(startSlider);
  return () => stops.forEach((stop) => stop());
}
