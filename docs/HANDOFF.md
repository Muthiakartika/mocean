# Handoff — status on 2026-11-02

Read this first when continuing the project (also on another computer).
For Claude Code: *"Read docs/HANDOFF.md, README.md and docs/migration-checklist.md, then continue."*

## Overall status: about 85%

| Area | Status |
|---|---|
| Audit (`docs/page-inventory.md`, `design-audit.md`, `seo-audit.md`) | Done |
| Project setup, fonts, colours, original images | Done — 956 images + 150 `.jpg.webp` images added on 2026-11-02 (they were missing, see below) |
| Header, desktop + mobile menu, footer, floating WhatsApp / Cloudbeds buttons | Done — matches live site at 1440 and 390 |
| Homepage (12 sections, hero slider, parallax, testimonials, FAQ) | Done — all elements within 2px at 1440 / 1280 / 820 / 390 |
| SEO for all 56 URLs (title, description, canonical, OG, JSON-LD) | Done (`src/data/seo.json`, `src/lib/metadata.ts`) |
| `sitemap.xml` (55 URLs, lastmod + image) and `robots.txt` | Done (`src/app/sitemap.ts`, `src/app/robots.ts`). Production: allow + sitemap; preview/local: `Disallow: /` |
| 48 inner pages + 7 blog posts | Done — **every page within 2px of the live site at 1440 / 1280 / 768 / 390 / 375** in the original design (`?original`, which `scripts/compare-layout.ts` loads; `scripts/compare-all.sh`, see `docs/compare/summary.txt` after a run) |
| Inner-page redesign "Logbook" | Built, **waiting for the owner's approval** — see the section below. `?original` on any URL shows the original design |
| Interactions on inner pages (tabs, accordion, fade-in, parallax, lightbox, sliders, in-page anchors) | Working (`scripts/check-inner.ts`) |
| Mobile menu | Done — focus moves into the panel on open and back to the hamburger on close; `aria-expanded` on the hamburger |
| Lightbox | Done — same toolbar as the original (counter, fullscreen, zoom ×3 with drag, share menu, close), file name as caption, UI fades after 3.5 s without mouse movement |
| Links | `scripts/check-links.ts`: no broken internal links or images (4 anchors are broken on the original too, see questions) |
| Contact form | Done in code (2026-11-03): sends through **SendGrid** (`src/app/api/contact/route.ts`), validation, "Sending...", error and confirmation as WPForms showed them, honeypot. **Needs the SendGrid key and addresses on Vercel before going live** (see below) |
| Cloudflare cache purge | Done in code (2026-11-03): GitHub Action after each successful production deployment (`.github/workflows/purge-cloudflare.yml` → `scripts/purge-cloudflare.ts`). **Needs two GitHub secrets** (see below) |
| `npm run lint`, `npx tsc --noEmit`, `npm run build` | Pass (all 60 routes static) |

### Fixed on 2026-11-02 (in case something looks different from before)

- **Mobile sub-headings**: the site's WordPress "Additional CSS" (`<style id="wp-custom-css">`) was never migrated. Its sub-heading rule (`padding-left: 0`) caused the one-line shifts at 390 on ~15 pages. Relevant rules now live in `src/styles/elementor/wp-custom-css.css`.
- **Elementor "CSS ID"s** (`id="gili-biaha"`, `id="sumbawa-heading"`, …) were dropped by the extractor. That broke the table-of-contents links on the dive-sites and surf-spots pages and the title/sub-heading order on `/kalela-waterfall/`, `/surf-spots/sumbawa/`. `extract_pages.py` now keeps them as `cssId`, `ElementorNode` renders them.
- **150 images** referenced as `….jpg.webp` (`/surf-spots/bali/`, `/dive-sites/diving-nusa-penida/`, `/fun-diving/`, `/contact/`) had never been downloaded and showed as broken. Downloaded from the live site into `public/images/uploads/`.
- **Contact form styling**: WPForms CSS was missing (`vendor/wpforms.css`, `vendor/wpforms-inline.css`, imported only by pages that contain a form — `generate-routes.mjs`). The anti-spam honeypot field "Email Message Name" is hidden like on the original (`elementor-fixes.css`).
- **Parallax images invisible in `npm run dev`**: React Strict Mode runs effects twice; the second `applyParallax()` found everything already wrapped and returned no items, so the images stayed at their scroll-0 position, outside their frames (large empty areas, e.g. on `/coral-reefs/`). `parallax.ts` now reuses existing wrappers. The layout comparison did not catch this because it measures the frame, not the image inside.
- **Testimonial stars on `/restaurant/` showed as empty boxes**: the theme CSS asks for `font-family: "rt-icons"`, but next/font registers the icon font under a generated name. `convert-css.mjs` now rewrites `"rt-icons"` to `var(--font-rt-icons)` like the text fonts.
- **Blog posts at 1200–1399px**: the content was 111px too wide. `posts.css` used 1320px from 1200px (theme style.css), but on the original bootstrap-grid.min.css loads after it, so the container is 1140px until 1400px.
- **Lightbox**: the prev/next areas were `<button>`s with the browser's grey background covering the image edges and hiding the white toolbar icons; now `div role="button"` as on the original. The handoff note about a "zoom-in opening animation" was wrong: the original adds the `zoomIn` class but never loads its CSS, so it opens without animation (kept that way).
- **Tabs showed two panels after a click** (all 51 tab widgets, original design too): Elementor's CSS keeps the first panel visible until the widget has the class `e-activated`, which Elementor's JavaScript sets on the first click. `ElementorBehaviors` now sets it. The layout comparison could not see this (it measures before any click); `scripts/check-inner.ts` now reports the panels that are actually visible.
- **Phones (2026-11-03)**: Elementor's own heading widget had no size ceiling in the redesign (the `/contact/` title was 80px on a 390px screen, section titles 40px); `convert-css.mjs` now adds the `--rd-hcap` hook to `.elementor-heading-title` too, and the layer caps them on phones (30px, hero 40px). The jump-nav runs flush along the top on phones and hides at the footer; back-to-top shows on phones only while scrolling up. The hamburger keeps its 20×19 icon but reacts to taps in a 44×43 area (it reaches further left than right, because anything past the screen edge widens the page on phones; that is how a first version made every page 2px wider).
- **WPForms spinner** (`submit-spin.svg`) was a 404 on `/contact/`; copied from the live site to `public/wp-content/plugins/wpforms-lite/assets/images/` (same path as the original markup).

## Inner-page redesign "Logbook" (built 2026-11-02, waiting for approval)

The owner asked for a redesign of the inner pages (not the homepage). Direction "Logbook": dive/surf information as clear data, brand kept (navy #111F90, Quicksand/Jost, real photos). Design system and every rule: **`MASTER.md`** in the project root.

- **It is a layer, not a rewrite.** All rules sit in `src/styles/redesign/` (`tokens.css`, `inner-pages.css`) under `html:not([data-design="original"]) #mocean-page`. Adding `?original` to any URL sets `data-design="original"` (inline script in `src/app/layout.tsx`) and the page is the migrated original again; the layout comparison runs in that mode. Removing the two imports in `styles-after.ts` and the `rd-*` components switches the redesign off completely.
- **Hooks in the original CSS** (`convert-css.mjs`): `#F1F1F1` → `var(--rd-band, #F1F1F1)`, `justify` → `var(--rd-justify, justify)`, `font-weight:400` → `var(--rd-w400, 400)`, heading sizes capped with `min(…, var(--rd-hcap, 999px))`. Without the layer the fallbacks are the original values.
- **Heading roles** per page (`scripts/migration/heading-roles.mjs` → `src/data/heading-roles.json`, keyed by page path because Elementor ids repeat across copied pages).
- **Facts bars and spec rows** (`src/data/facts.json`, `Facts.tsx`): 14 pages have a strip under the hero, 48 dive sites a spec row. **Every figure is stated in that page's own text** (nothing invented or converted; "seven" may be written 7, month names shortened). They were extracted with a quote per figure and checked by script against the page text. Site rows are keyed by page path + section id (the surf pages reuse ids such as `desert-point`). Figures about another place (copied text, see question 9) were left out. `/surf-camp/surf-spots/lombok-2/` has none because its text is about Sumbawa.
- **FAQ** (changed 2026-11-03): question cards beside a collage of three of the page's photos (`faqPhotos.ts`), on all screen sizes; `?original` keeps the original accordion and photo. The price accordion on `/pricing/` is a price list with a category menu instead (`priceList.ts`). The earlier index + panel (`faqPanel.ts`) is gone.
- **Text alignment**: justified only for full-width text directly in a section (owner's request); text in columns and tabs is left-aligned without hyphenation (owner's feedback: narrow justified columns were hard to read).
- **Card grids** become table rows (`rd-card` / `rd-cards`, computed in `ElementorNode.tsx`), a sticky in-page jump-nav (`PageNav.tsx`) appears on pages with a table of contents.
- **Checked on 2026-11-02/03**: all 55 pages at 1440 and 390 (no console errors, no broken images, every FAQ has its index and panel, all 51 tab widgets show one panel after a click, no justified text narrower than 420px at 1440 / 1100; sideways scroll only where the live site has it too, clipped by `body{overflow-x:hidden}`), `?original` within 2px of the live site, keyboard use of the FAQ, contrast of every token pair (lowest 5.4:1, meta labels on ice; hairlines are decorative), `prefers-reduced-motion`, genjutsu static audit (no critical or important findings) and the impeccable detector.
- **Full check on 2026-11-03** (all 57 pages at 1440 / 1024 / 820 / 390): no console errors, broken images, hidden content, narrow text columns, overlapping text, content past the screen edge or sideways scroll; every tab widget shows one panel; every FAQ collage loads; no empty band larger than on the original (`?original`); every text element in Jost or Quicksand. `scripts/check-links.ts`: 1,192 internal URLs fine, only the 4 anchors broken on the original too. Fixed in that pass: the restaurant menu tabs (wrap), the empty band under the overlay card on the course pages (tablets and phones), and the remaining theme/browser fonts.
- **Not checked yet**: real iPhone / Android devices, a screen reader (VoiceOver / NVDA), 200% zoom, Lighthouse.

## Next steps (in order)

1. **Contact form and cache purge: set the secrets** (the code is done and tested; without these the form answers with an error on the live site, so this **blocks going live**):
   - SendGrid: create an API key with "Mail Send", verify the sender address (Single Sender Verification, or authenticate the domain moceanbeachresort.com so mail does not land in spam). On Vercel set `SENDGRID_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` (and optionally `CONTACT_FROM_NAME`) for Production, then redeploy.
   - Cloudflare: create an API token with Zone → Cache Purge → Purge for this zone; copy the Zone ID (domain → Overview). In GitHub → Settings → Secrets and variables → Actions add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID`. The Vercel project must be connected to the GitHub repository (that is what sends the deployment status the workflow listens to).
   - Tested without sending anything: the route against a fake SendGrid (15 checks: payload, reply-to, honeypot, validation, other origin, SendGrid refusing, missing configuration), the form in the browser at 1440 and 390 (errors, "Sending...", server error, confirmation, `?original`), the purge script against a fake Cloudflare API (2 requests of 30 + 28 URLs, `--everything`, refusal → exit 1).
2. **Lighthouse / Core Web Vitals** on a production build (`npm run build && npm start`). Not run yet (needs `npx lighthouse` or Chrome DevTools).
3. Full-page screenshots / pixel diff (`scripts/capture-screenshots.ts`) — element positions already match at all five widths, this is the remaining visual check from the PRD.
4. Deployment prep (Vercel) — deploy only with the owner's approval. Set `SITE_ENV=production` (or rely on `VERCEL_ENV=production`) only on the real production deployment.

## Open questions for the owner

1. **Contact form**: service answered on 2026-11-03 (SendGrid). Still needed: the address messages go to and the verified sender address. The confirmation text is WPForms' default ("Thanks for contacting us! We will be in touch with you shortly."), because the live site's own text can only be seen by sending a real message; replace it in `src/lib/contactForm.ts` if the owner set a different one. Optional against spam bursts: a Cloudflare rate-limiting rule on `/api/contact/`, or Turnstile.
   Cloudflare purge: only pages, `sitemap.xml` and `robots.txt` are purged (not images); it only matters if a Cloudflare Cache Rule caches HTML. Purge everything with "Run workflow" → "everything".
2. Correct booking email: `bookings@moceandive.com` (shown on pages) or `bookings@moceanbeachresort.com` (schema + homepage)?
3. Is there a GA4/GTM property? Only Ahrefs Analytics was found on the site.
4. `/luxury-surf-resort/`: keep as duplicate with canonical (current) or 301 → `/tropical-beach-resort/`?
5. Keep the white page preloader of the original? (not rebuilt yet)
6. Remove the `WebSite` SearchAction from the schema (points to WordPress search, which won't exist)?
7. Four table-of-contents links are **broken on the original too** (no element with that id): `#pasir-putih-komodo` on `/dive-sites/diving-komodo-island/`, `#surf-levels` on `/surf-camp/surf-spots/lombok-2/`, `#bombie-area` and `#impossibles` on `/surf-spots/uluwatu/`. Fix them in the content (point to the right section) or keep them identical?
8. **Approve the inner-page redesign** (or ask for changes) before anything is deployed.
9. **Content errors on the original pages** (found while extracting the facts; same on the live site). Fix in the content JSON, or leave as is?
   - Text copied from another page: `/surf-spots/uluwatu/` General Info paragraph and "Outside Corner" card are Canggu's; `/surf-spots/nusa-lembongan/` Intermediate/Advanced paragraphs, the Shipwrecks card and the label "Levels of Surfing in Bali" come from `/surf-spots/bali/`; `/surf-camp/surf-spots/lombok-2/` is about Sumbawa (near copy of `/surf-spots/sumbawa/`, heading typo "Surfin"); `/dive-sites/diving-tulamben/` Kubu starts with Lombok text (Gili Rengit); `/dive-sites/diving-nusa-penida/` Batu Nunggul contains a Sampalan paragraph that contradicts Sampalan's own currents; `/dive-sites/diving-raja-ampat/` Saonek Kecil mentions "Jerief's 25-meter plateau"; the Bali dive FAQ mentions "Bali Dive Cove".
   - Surf wording on dive pages and the reverse: "Explore the best places to surf" (Komodo), "chill Kuta vibes" (Nusa Penida), "Types of dives" and "beginner-friendly dives" on the Bali, Canggu, Lombok and Uluwatu surf pages.
   - Contradictions: Lombok dive seasons (April-October, March-November, October-April) and its conditions table ("Visibility: 26-30°C", "Prime Seasaon"); Lombok surf seasons and Senggigi (beginner text, Intermediate/Advanced label); Mansuar "550 coral species" vs "537 coral types" for all of Raja Ampat; Supersuck and Lakey Peak labelled "Intermediate Advance" while the text says advanced/expert.
- Answered: images and site belong to the owner (OK to copy 1:1). Inner pages: "renderer + data" approach.

## Things that are easy to get wrong

- **Don't run `create-next-app` or `npm install` without `--prefer-offline` on a slow connection**; `package-lock.json` pins everything.
- **Port 3000 may belong to another project** on this PC (`charisma-code`). `next dev` then picks 3001. The check scripts read `LOCAL_URL`, e.g. `LOCAL_URL=http://localhost:3001 bash scripts/compare-all.sh 1440 390`.
- **Tailwind only scans `src/components` and `src/app`** (`src/app/globals.css`, `source(none)`). The migrated WordPress HTML uses class names like `mb-20`, `d-block`, `container` that Tailwind would otherwise style differently. Same reason the page wrapper is `.theme-container`, not `.container`.
- Tailwind's preflight reset is **off** on purpose (the original uses browser defaults).
- **CSS order matters** for inner pages: `src/components/elementor/styles.ts` → page `post-<id>.css` → `styles-after.ts` (… → `wp-custom-css.css` → `elementor-fixes.css`) → WPForms CSS on `/contact/`, mirroring the original `<link>` order.
- Turbopack rejects some original CSS (e.g. empty rules `{}`); `convert-css.mjs` cleans those.
- After changing `globals.css` sources or CSS loaders, stop the dev server and delete `.next/` (Turbopack caches).
- Git Bash turns `/pricing/` into a Windows path → use `MSYS_NO_PATHCONV=1`.
- **Line endings**: Git is set to `core.autocrlf=true`, the generators write LF. After re-running a generator every file shows as modified; `git diff --ignore-cr-at-eol --stat` shows the real changes, `git checkout -- <file>` restores the ones that only differ in line endings.
- The extractors reproduce the committed JSON exactly (checked 2026-11-02), so re-running them is safe.
- The live site is the source of truth; `docs/audit/source-html/` is the snapshot from 2026-10-31.
- **Redesign vs original**: compare against the live site only in `?original` mode (the comparison script does this). A change to the original CSS goes into `convert-css.mjs` (keep the `--rd-*` hooks), a change to the look goes into `src/styles/redesign/` scoped under `#mocean-page`, so `?original` stays identical to the live site.
- **New facts** go in `src/data/facts.json` only with a sentence from that page's text that states them; keys are page paths (and section ids for spec rows).
- **Playwright element screenshots of elements taller than the window** re-lay out the page and catch 140ms colour transitions halfway (a faded navy row). Use viewport screenshots to judge colours.

## Moving to another computer

Copy the whole project folder **without** `node_modules/` and `.next/`, then on the new PC:

```bash
npm install
npm run dev
```

The comparison scripts need Microsoft Edge (standard on Windows). The migration scripts need Python 3 with `beautifulsoup4` and `lxml` (only to regenerate content).
