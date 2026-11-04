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

// Both wrappers reuse an existing wrapper: React runs effects twice in development (Strict Mode),
// and the second run must still return the items so the scroll handler moves them.
function wrapImage(img: HTMLImageElement): Item {
  const existing = img.closest<HTMLElement>(".jarallax.jarallax-container");
  if (existing) return { frame: existing, layer: img };
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
  const existing = section.querySelector<HTMLElement>(":scope > .jarallax-clip > .jarallax-bg");
  if (existing) return { frame: section, layer: existing };
  const background = getComputedStyle(section).backgroundImage;
  if (!background || background === "none") return null;
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

/** Redesign (MASTER.md): under reduced motion the image just fills its frame. The original design always moves. */
function staysStill() {
  return document.documentElement.dataset.design !== "original" && matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  // In the redesign the FAQ photo sits still in its collage (faqPhotos.ts), next to the two extra photos.
  const stillFaqPhoto = (img: Element) => document.documentElement.dataset.design !== "original" && img.closest(".rd-faq-photos");
  document.querySelectorAll<HTMLImageElement>(".has-jarallax-img img").forEach((img) => {
    if (!stillFaqPhoto(img)) items.push(wrapImage(img));
  });
  document.querySelectorAll<HTMLElement>(".e-con.jarallax").forEach((section) => {
    const item = wrapBackground(section);
    if (item) items.push(item);
  });

  if (staysStill()) {
    items.forEach(({ layer }) => {
      layer.style.height = "100%";
      layer.style.marginTop = "0";
      layer.style.transform = "none";
    });
    return () => {};
  }

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
