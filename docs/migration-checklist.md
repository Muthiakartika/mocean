# Migration Plan & Checklist

Source of truth: the live site https://moceanbeachresort.com/. Audit docs: [page-inventory](page-inventory.md) · [design-audit](design-audit.md) · [seo-audit](seo-audit.md).

## Approach

The original is 56 Elementor pages built from ~20 widget types. Two ways to rebuild that:

1. **Hand-write a React page per URL** — 56 large files, every text change means editing JSX.
2. **Components per widget + content per page as data** ← chosen.
   Each widget type (heading, text, image, button, tabs, accordion, gallery, icon list, …) becomes one small React component. Each page is a typed data file in `src/content/pages/` listing its sections in order. Page-specific spacing/colors come from that page's original Elementor CSS values, stored next to the content.
   This keeps every page's own design (PRD §6: no generic template) while keeping the code small and readable for a beginner.

The home page gets dedicated components as the PRD's folder structure lists (`components/home/*`), because it is the most visible page and has unique pieces (hero slider, testimonials).

### Folder decisions that differ from PRD §9 (and why)

| PRD suggests | We do | Why |
|---|---|---|
| `public/images/home/`, `rooms/`, `diving/` … | `public/images/uploads/YYYY/MM/file.jpg` (WordPress path kept) | 956 files; keeping the original path makes every image traceable to the WP media library and lets us 301 `/wp-content/uploads/*` for Google Images. Sorting 956 files into topics by hand is error-prone. |
| project root `mocean-nextjs/` | the existing folder `mocean/` | already holds the audit docs |

## Access limitations / questions for you

1. **Contact form backend.** The WPForms form (Name, second text field, Email, Message) sends email from WordPress. For Next.js I need: the **destination email**, and an email service (Resend, SMTP credentials, etc.). Until then the form can't truly send (PRD §7.3 forbids faking it).
2. **Which booking email is right?** Pages show `bookings@moceandive.com`; schema says `bookings@moceanbeachresort.com`.
3. **GA4/GTM.** Only Ahrefs Analytics is on the pages. Confirm there is no GA4/GTM injected elsewhere.
4. **`/luxury-surf-resort/`** — keep serving a duplicate with canonical (current behaviour) or 301 it to `/tropical-beach-resort/`?
5. **Preloader** — the white full-screen fade on load hurts LCP. Keep (exact clone) or drop?
6. **`WebSite` SearchAction** in schema points to WP search, which won't exist. OK to remove?
7. ~~Asset rights~~ — confirmed by the owner (2026-10-31): site and images are theirs.
8. **Vercel project / domain** — needed for deployment (Phase 8). I won't deploy without your go-ahead.

## Phase checklist

### Phase 1 — Discovery & audit
- [x] Crawl: sitemap, REST API, menus, footer, internal links → 56 URLs
- [x] Page inventory with SEO, headings, sections, buttons, images, links (`page-inventory.md`, `audit/pages.json`)
- [x] Design tokens from computed CSS and kit CSS (`design-audit.md`)
- [x] All original stylesheets saved (`audit/original-css/`)
- [x] Hero slider config extracted (`audit/hero-slider-sr7.json`)
- [x] SEO, schema, analytics, booking audit (`seo-audit.md`, `audit/seo.json`)
- [x] Asset list: 956 files actually rendered (srcset variants excluded)
- [ ] Full-page screenshots × 5 viewports × 56 pages
- [ ] Tablet (768) measurements, per-page tab/accordion/gallery styles

### Phase 2 — Project setup
- [x] Next.js (App Router, TS, Tailwind, `src/`), `trailingSlash: true`
- [x] CSS variables (`src/styles/variables.css`), Quicksand + Jost (+ Roboto 500) via `next/font`
- [x] Download images to `public/images/uploads/`
- [ ] Playwright installed, `scripts/capture-original.ts`, `scripts/compare.ts` (pixelmatch)

### Phase 3 — Global layout
> Header + footer measured against the live site at 1440 and 390: heights, logo, menu item widths, columns and floating buttons match. Pixel diff still pending (Playwright).

- [x] Header (logo, menu, hover dropdown, nested dropdown, Book Now)
- [x] Mobile off-canvas menu (open/close, accordion, Esc to close, hidden panel is `inert`)
- [ ] Mobile menu: move focus into the panel on open and back to the hamburger on close
- [x] Footer
- [x] Floating Cloudbeds button (immersive script) + WhatsApp button
- [x] Button component with original hover animation
- [x] `fadeInUp` on-scroll animation (IntersectionObserver, no Framer Motion)
- [ ] Visual diff of header/footer at 5 viewports

### Phase 4 — Homepage (12 sections)
> Checked with `scripts/compare-layout.ts` (element positions vs live site): all headings, text, buttons, list items and images within 2px at 1440 / 1280 / 820 / 390. Hero checked by screenshot at 1440 / 600 / 390. Interactions checked with `scripts/check-home.ts`.

- [x] Hero slider (fade, 4.5s, swipe, desktop/mobile text layers)
- [x] Resort intro · Bungalows & Rooms · Diving · Mutiara restaurant · Surf/Waterfalls/Tours (3 image boxes)
- [x] Testimonials slider · Facilities · Rooms & Rates · FAQ accordion · Book Your Stay CTA
- [x] Visual diff after each section

### Phase 5 — Inner pages (55)
> **Approach chosen by the owner (2026-10-31): renderer + data.**
> `scripts/migration/extract_pages.py` / `extract_posts.py` turn the saved HTML into `src/content/pages|posts/*.json`;
> `scripts/migration/convert-css.mjs` copies the original Elementor/theme CSS to `src/styles/elementor/` (image URLs + font names rewritten);
> `scripts/migration/generate-routes.mjs` writes one `src/app/<url>/page.tsx` per page.
> Rendering: `src/components/elementor/` (ElementorPage, PostPage, ElementorNode) keeps the original class names so the original CSS applies;
> `ElementorBehaviors` re-creates Elementor's JS (tabs, accordion, fadeInUp, jarallax parallax, lightbox, testimonial sliders).
> Checked with `scripts/compare-all.sh` (all pages × 1440 / 390) and `scripts/check-inner.ts`.

- [x] Renderer for all widget types (original markup + CSS) and behaviours: tabs, accordion, fadeInUp, parallax, lightbox, testimonial sliders
- [ ] Lightbox: add the original toolbar (zoom / fullscreen / share), image-name caption and zoom-in opening animation
- [x] Content JSON + route per page (48 Elementor pages + 7 posts)
- [ ] Visit & Stay (5) · Surfing (2 + surf-spots 7 + surf posts) · Diving (scuba 8, fun-diving, snorkeling, dive-resort, dive-sites 9, seasonal) · Wildlife (2) · Tours (5) · Pricing · Contact · News · 8 posts · `lombok-2` (noindex)

### Phase 6 — Functionality
- [ ] All Cloudbeds/WhatsApp/mailto links identical (automated check vs `audit/pages.json`)
- [ ] Contact form: fields, required validation, success/error states, server-side send, honeypot (WPForms' anti-spam equivalent)
- [ ] Tabs, accordions, galleries, sliders, maps, video

### Phase 7 — SEO & performance
- [ ] Metadata API per page from `audit/seo.json` (title, description, canonical, robots, OG, Twitter)
- [ ] JSON-LD (Yoast graph + page schemas)
- [ ] `sitemap.ts`, `robots.ts`, preview noindex, sitemap redirects, uploads redirect
- [ ] Ahrefs analytics script once, in root layout, production only
- [ ] Hero image `priority`, everything else lazy; static generation for all routes

### Phase 8 — QA
- [ ] Playwright visual diff, 56 pages × 5 viewports, every difference reviewed
- [ ] Link checker (no broken internal links)
- [ ] No console errors
- [ ] `npm run build` passes, Lighthouse/CWV check
- [ ] Deployment prep (Vercel) — after your approval
