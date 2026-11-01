# Design Audit — moceanbeachresort.com

Values below come from computed CSS in a real browser (1440px and 390px) and from the original stylesheets.
All 107 original stylesheets are saved in [`audit/original-css/`](audit/original-css/) — when a value is missing here, look it up there instead of guessing.

## Stack the original uses

| Layer | What | Notes for the clone |
|---|---|---|
| Theme | **Moonlit** + child theme (ReacThemes) | `theme.css`, `elements.css`, `responsive.css`, `bootstrap-grid.min.css` |
| Page builder | Elementor 3.x / 4.x (flex containers `.e-con`) | One CSS file per page: `uploads/elementor/css/post-<id>.css` |
| Header/footer | ReacThemes HFE templates 10288 (header) / 10289 (footer) | |
| Menu | RT Mega Menu 1.5.3 | Desktop dropdown + right off-canvas on mobile |
| Hero | Slider Revolution 7 (`mocean-dive-banner`) | Config saved in [`audit/hero-slider-sr7.json`](audit/hero-slider-sr7.json) |
| Widgets | Essential Addons (data table, post grid), RT widgets (button, heading, testimonial slider, restaurant menu) | |
| Forms | WPForms (contact) — MetForm assets also load but no MetForm form is rendered | |
| Booking | Cloudbeds immersive widget `yPrE1K` + WhatsApp | See "Booking" below |
| Cache/optim | LiteSpeed (serves `.webp` copies) | not needed in Next.js (next/image does this) |

## Color tokens

| CSS variable (proposed) | Value | Source |
|---|---|---|
| `--color-primary` | `#111F90` | `--e-global-color-primary` / accent |
| `--color-secondary` | `#121212` | `--e-global-color-secondary` (headings) |
| `--color-text` | `#65676B` | `--e-global-color-text` (body) |
| `--color-white` | `#FFFFFF` | `--e-global-color-c9ffc55` |
| `--color-teal` | `#00A8BE` | `--e-global-color-4ea027e` (footer social icon bg, sticky-header link hover) |
| `--color-footer-top` | `#57D1D9` | footer gradient start (`linear-gradient(180deg, #57D1D9, #111F90)`) |
| `--color-whatsapp` | `#25D366` | floating WhatsApp button |
| `--color-section-grey` | `#F1F1F1` | computed section bg |
| `--shadow-dropdown` | `0 36px 35px rgba(0,0,0,.08)` | dropdown menu |

Per-page colors set directly in Elementor (overlays, card backgrounds) live in each page's `post-<id>.css` and are ported page by page.

## Typography

| Element | Font | Size / line-height | Weight | Color |
|---|---|---|---|---|
| Body | Quicksand | 16px / 27.2px (1.7) | 400 | `#65676B` |
| Text-editor paragraph | Quicksand | 16px / 30px | 400 | `#65676B` |
| Kit h1–h6 defaults | Quicksand | 80 / 60 / 50 / 40 / 30 / 20px | 400 | `#121212` |
| Home section H2 (widget override) | Quicksand | 25px / 35px (same on mobile) | 400 | `#121212` |
| Menu link | **Jost** | 16px / 27.2px | 400 | `#FFFFFF` |
| Dropdown link | Jost | 16px / 25px | 400 | `#121212`, hover `#111F90` |
| Button | Quicksand | 16px / 27.2px | 500 | `#FFFFFF` |
| Hero slider text | Quicksand 400/500/600 + Roboto 500 | per layer (see slider JSON) | | |

Fonts loaded by the original: Quicksand (100–900), Jost (100–900), Roboto 500 (slider), Gilda Display (theme default, check usage).
All are Google Fonts under the SIL Open Font License → self-host with `next/font` (Google loader downloads at build time, no runtime request to Google).

## Layout & breakpoints

- Elementor breakpoints actually used by page CSS: **2400 (min), 1366, 1200, 1024, 880, 767**. The PRD's 1280px viewport falls in the ≤1366 "laptop" range.

- Container: `max-width: 1320px` (`.e-con`), becomes 1024px ≤1024px and 767px ≤767px.
- Breakpoints: **≤1024px tablet**, **≤767px mobile** (Elementor defaults). Slider Revolution uses its own: widths `[1240, 1240, 1024, 778, 480]`.
- Widget gap: 20px (`--widgets-spacing`).
- Home section heights at 1440px (top to bottom): 870 · 709 · 843 · 700 · 720 · 313 · 894 · 747 · 1048 · 1243 · 942 · 869. Full page ≈10,549px at 1440 and ≈16,645px at 390.
- Common section padding: `0 10px`, `95px 10px 50px`, `98px 10px 87px`, `0 10px 108px`.

## Header

- `position: absolute; top: 0`, transparent, over the hero. **Not sticky** (checked after scrolling 2000px: header stays at the top of the document, despite the `fixed-header` class).
- Height 91px (1440) / 112px (390).
- Logo white PNG, 132×75 (1440) / 93×52 (390).
- Menu items: padding `32px 0`.
- Right side: **"Book Now"** button → `https://us2.cloudbeds.com/reservation/yPrE1K`, `target="_blank" rel="nofollow"`.
- Dropdown: white, min-width 220px, shadow above, items `12px 35px 12px 25px`; opens on hover via `transform: scaleY(0→1)` + opacity.
- Mobile: hamburger → white off-canvas panel from the right (`rtmega-menu-mobile-sidebar position-right`) with accordion sub-menus.

## Footer

- Background `linear-gradient(180deg, #57D1D9 0%, #111F90 100%)`, ≈451px tall at 1440. Padding 80px top / 60px bottom, 4 columns of 25%.
- Headings Quicksand 24px white; links Quicksand 14px white; copyright Jost 18px white, centered, top border `#FFFFFF26`.
- Columns: "Surf and Dive Guide" links · "Our Contact Info" (WhatsApp number, Contact Us, address) · social icons (Facebook, Instagram, WhatsApp) · "We Are Here".
- Social icon hover: background white, icon `#00A8BE`.
- Bottom bar: "© Copyright PT Mocean Dive Resort | All Rights Reserved".

## Buttons

`theme-btn btn-style fill` (rt-button widget):
- Default: bg `#111F90`, white text, Quicksand 16/500, padding `8px 20px`, radius 6px (≈118×45 for "Book Now").
- Hover: two-layer animation — `::before` scales in (`transform .4s cubic-bezier(.1,0,.3,1)`), `::after` follows after .4s delay, and the label runs keyframes `MoveScaleUpInitial` → `MoveScaleUpEnd` (.3s each). Exact rules: `audit/original-css/plugins__rt-moonlit__assets__css__elements.css`.

## Floating elements (every page)

| Element | Position | Behaviour |
|---|---|---|
| Book button (`.book_button`) | fixed, bottom-right, 55×55, above WhatsApp | `<button class="cb-book-btn" data-be-url="…/reservation/yPrE1K">` with `mattress.png` icon; opens the **Cloudbeds immersive** booking overlay (script `us2.cloudbeds.com/widget/load/yPrE1K/immersive`) |
| WhatsApp button (`.whatsapp_button`) | fixed, bottom-right, 55×55 | link to `https://wa.me/6282144191647`, Font Awesome WhatsApp SVG |
| Preloader (`#rt--preloader`) | fixed full-screen, white | fades out after load. Keep it only if we accept the LCP cost — **decision needed** |

## Hero slider (home)

- Slider Revolution, `type: standard`, full width, height 870px (desktop) / 718 (≤1024) / 960 (≤778) / 720 (≤480).
- 7 slides in the module; 6 have content, slide `51` is empty (check if it is hidden/disabled).
- Each slide: background image (`Slider-mocean-1/3/4/5.jpg` …), H1/text "Mocean Beach Resort" (separate desktop and mobile layers), "West Sumbawa, Indonesia", **Book Now** → Cloudbeds (`target="_self"`).
- Transition: **fade**, slide duration **4500ms**, swipe enabled, no arrows or bullets found in the config.

## Animations

- Elementor entrance **`fadeInUp`** on 32 sections (scroll-triggered, once).
- Dropdown scaleY/opacity, button hover (above), image-box title color on hover, accordion title hover color.
- **Parallax on images** (correction): image widgets with class `has-jarallax-img` use jarallax (`type: scroll`, `speed: 0.5`). Rebuilt with the same formulas in `src/components/shared/ParallaxImage.tsx`.

## Interactive components to rebuild

| Component | Where | Count |
|---|---|---|
| Nested tabs | dive/surf/scuba pages | 88 sections |
| Nested accordion (FAQ) | most pages | 45 sections |
| Image gallery (+ lightbox — check per page) | dive sites, surf spots, restaurant | 13 |
| Testimonial slider | home, 1 other | 2 |
| Data table (EA) | pricing etc. | 2 |
| Post grid (EA) | `/news/` | 1 |
| Restaurant menu | `/restaurant/` | 1 |
| Google Maps iframe | contact, manta-rays, diving-lombok (27) | 29 |
| YouTube embed | manta-rays | 1 |
| Contact form (WPForms) | contact | 1 |

## Viewports still to capture

Screenshots for 1440 / 1280 / 768 / 390 / 375 go in `docs/screenshots/original/<viewport>/<slug>.png` (Playwright script `scripts/capture-original.ts`).
