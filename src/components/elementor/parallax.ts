/**
 * jarallax-style parallax for Elementor content (same math as src/components/shared/ParallaxImage.tsx).
 *
 * Two cases on the original site:
 *   1. Image widgets with class "has-jarallax-img": the <img> moves inside a fixed-height frame.
 *   2. Containers with class "jarallax": their background image moves behind the content.
 * Returns a cleanup function.
 */
const SPEED = 0.5;

type Item = { frame: HTMLElement; layer: HTMLElement };

function wrapImage(img: HTMLImageElement): Item | null {
  if (img.closest(".jarallax-container")) return null; // already wrapped
  const frame = document.createElement("div");
  frame.className = "jarallax jarallax-container";
  const clip = document.createElement("div");
  clip.className = "jarallax-container jarallax-clip";
  img.replaceWith(frame);
  frame.appendChild(clip);
  clip.appendChild(img);
  img.classList.add("jarallax-img");
  return { frame, layer: img };
}

function wrapBackground(section: HTMLElement): Item | null {
  const background = getComputedStyle(section).backgroundImage;
  if (!background || background === "none" || section.querySelector(":scope > .jarallax-clip")) return null;
  const clip = document.createElement("div");
  clip.className = "jarallax-container jarallax-clip";
  const layer = document.createElement("div");
  layer.className = "jarallax-bg";
  layer.style.backgroundImage = background;
  clip.appendChild(layer);
  section.prepend(clip);
  section.style.backgroundImage = "none";
  return { frame: section, layer };
}

function update({ frame, layer }: Item) {
  const rect = frame.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const frameHeight = rect.height;
  const layerHeight = frameHeight + (windowHeight - frameHeight) * (1 - SPEED);
  const marginTop = (windowHeight - layerHeight) / 2;
  const scrollDistance = (SPEED * (frameHeight + windowHeight)) / 2;
  const fromViewportCenter = 1 - 2 * ((windowHeight - rect.top) / (windowHeight + frameHeight));
  layer.style.height = `${layerHeight}px`;
  layer.style.marginTop = `${marginTop}px`;
  layer.style.transform = `translate3d(0, ${scrollDistance * fromViewportCenter - rect.top}px, 0)`;
}

export function applyParallax(): () => void {
  const items: Item[] = [];
  document.querySelectorAll<HTMLImageElement>(".has-jarallax-img img").forEach((img) => {
    const item = wrapImage(img);
    if (item) items.push(item);
  });
  document.querySelectorAll<HTMLElement>(".e-con.jarallax").forEach((section) => {
    const item = wrapBackground(section);
    if (item) items.push(item);
  });

  let frameRequest = 0;
  const run = () => {
    frameRequest = 0;
    items.forEach(update);
  };
  const schedule = () => {
    if (!frameRequest) frameRequest = requestAnimationFrame(run);
  };
  run();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  return () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    cancelAnimationFrame(frameRequest);
  };
}
