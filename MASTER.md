# Mocean design system: Logbook (inner pages)

Single source of truth for the redesign layer of the 55 inner pages (Elementor content rendered by `src/components/elementor/`).
Direction "A. Logbook", chosen 2026-11-02 from three options (https://claude.ai/artifact/Y93HUFETEJ3HVAJm5hLDH3, private).
Code: `src/styles/redesign/tokens.css` (tokens), `src/styles/redesign/inner-pages.css` (the layer), `src/components/elementor/Facts.tsx` + `src/data/facts.json` (facts bars), `src/components/elementor/PageNav.tsx` (jump-nav, back to top).

The homepage is not part of this layer. The original design stays reachable with `?original` in the URL (sets `<html data-design="original">`, which switches the whole layer and the facts bars off); the layout comparison scripts use it.

## Theses

**Visual.** A dive log: the numbers a diver plans with come before the prose. Light and technical: white pages, an ice-blue band colour, ink text, navy #111F90 as the only accent. One face, Quicksand, as on the live site (owner, 2026-11-03): headings at the live weight 400, buttons and FAQ questions 500, running text 500 at 17px flush with the section edges, figures 600, uppercase labels for data. Sharp 4px corners everywhere, 1px hairlines, tables and rows instead of floating cards. Each dive site shows a spec row (depth, water, currents, wildlife, level) taken from its own text; pages with numbers in their copy get a facts bar under the hero; card grids read as rows; FAQs are white question cards beside a collage of three photos.

**Interaction.** Dry and immediate: 140ms ease-out colour changes, no lift, no entrance animation (content is there when the page loads). Hover tints a row ice-blue or darkens a button; press moves a button 1px. Tabs and FAQ answers swap instantly. The sticky jump-nav marks the section being read. No bounce, no scroll reveals, no image zoom, no loops. Under `prefers-reduced-motion` the few transitions and the parallax stop too.

Design read: redesign of a dive and surf resort site for international travellers, PADI/Surfline-style clear data. Dials: variance 3, motion 2, density 6.

## Colour

| Token | Value | Role | Contrast |
|---|---|---|---|
| `--rd-navy` | `#111F90` | accent: buttons, links, chips, active tab, figures | 12.9:1 on white, 11.9:1 on ice |
| `--rd-navy-deep` | `#0D1873` | button hover | 15.0:1 on white |
| `--rd-ink` | `#0E1530` | headings, questions, facts bar background | 18.0:1 on white |
| `--rd-body` | `#454A57` | running text | 8.9:1 on white |
| `--rd-meta` | `#5E6575` | labels, decks, captions | 5.8:1 on white, 5.4:1 on ice |
| `--rd-ice` | `#F2F5FB` | bands (replaces `#F1F1F1`), spec rows, row hover | |
| `--rd-line` | `#D9DFEA` | 1px hairlines | |
| `--rd-white` | `#FFFFFF` | surfaces, text on ink and navy | |
| `--rd-on-ink-meta` | `#C5CCE4` | labels on the ink facts bar | 11.2:1 on ink |

Text on photographs keeps the colour each page sets (white). WhatsApp green stays on the floating button only.

## Typography

| Role | Face | Size / line-height | Weight | Colour |
|---|---|---|---|---|
| Section heading (the larger line of each Elementor heading pair) | Quicksand | page size, capped 40px desktop / 30px mobile; 1.1 | 400 (live weight) | page colour (navy or ink) |
| Elementor heading widget on phones | Quicksand | page size, capped 30px; the page title in the hero 40px; line height 1.15 | page | page colour |
| Deck (the smaller line) | Quicksand | 19px / 1.4 (17px mobile) | 500 | at 80% opacity |
| Body | Quicksand | 17px / 1.65; full-width text runs flush with the section, justified where the original was (left on phones), with hyphenation; text in columns is left-aligned without hyphenation | 500 | body |
| Figure (facts) | Quicksand | 28px / 1, units 15px | 600 | navy (white on ink) |
| Label | Quicksand | 12px uppercase, tracking 0.08em | 500 | meta |
| FAQ question (card) | Quicksand | 17px / 1.35 | 500 | ink, hover navy |
| FAQ answer | Quicksand | 16px / 1.65 | 500 | body |
| Price list category | Quicksand | 28px / 1.2 (24px below 1025px) | 400 | navy |
| Chip, tab, button | Quicksand | 14-16px / 1 | 500 | navy / white |

One face on every page, Quicksand, as on the live site (owner decision 2026-11-03, replacing the earlier Quicksand headings): the layer's `--rd-font-data` token, which held Quicksand, now points to Quicksand, so every former Quicksand role (headings, labels, figures, chips, tabs, menus of the price list, buttons) is Quicksand; headings use `--rd-heading-weight` 400 and buttons / FAQ questions `--rd-ui-weight` 500, the live weights. Faces that slipped through from the theme or the browser are mapped too: Montserrat (price table headers), Arial ("Load More", tab and form buttons), the Elementor kit's primary face (Quicksand), the desktop menu and footer copyright (Quicksand on the live site, `MainNav` / `Footer`), and the homepage hero's "Book Now" (Roboto, now only loaded for `?original`). Checked over every visible text element, control and placeholder on all pages at 1440 and 390: Quicksand only. The homepage keeps its original type (Quicksand), its FAQ cards included.

Tabular figures everywhere numbers line up. Justified text keeps the original alignment only where it runs the full width of a section on wide screens; text in columns (beside a photo, in tabs, 250-450px wide) and all text on phones is left-aligned, because narrow justified lines open wide gaps and split words (owner feedback 2026-11-02). Which line of a heading pair leads comes from the original CSS (`scripts/migration/heading-roles.mjs`).

## Space

Scale (px): 4, 8, 12, 16, 24, 32, 48, 64, 96. Section padding `min(original, 96px)` desktop, `min(original, 56px)` at ≤767px; paddings over 300px (room reserved for an overlapping card) and the hero keep their value. Full-width text keeps the section width so it lines up with the grids and photos around it (owner request 2026-11-02, instead of a narrow reading column).

## Shape

One radius: `--rd-r` 4px for buttons, chips, tabs, cards, images in content, the jump-nav and the back-to-top button. Borders 1px `--rd-line`; tables open with a 2px ink rule. No shadows except the floating jump-nav (`--rd-shadow-float`). Exception chosen by the owner (2026-11-03): the FAQ cards and the FAQ photo collage use `--rd-r-card` 12px, the cards a soft shadow (`--rd-shadow-card`, stronger when open: `--rd-shadow-card-open`) and a hover border `--rd-line-strong`.

Z-index: jump-nav and back-to-top 20, floating WhatsApp/booking 30 (existing), header menu panel 40 (existing).

## Motion

| Token | Value | Use |
|---|---|---|
| `--rd-ease` | `cubic-bezier(0.25, 1, 0.5, 1)` | every transition |
| `--rd-t-hover` | 140ms | hover colour, row tint, press |
| `--rd-t-swap` | 0ms | tabs, FAQ answers and price categories (instant) |

No entrance animations: Elementor's fadeInUp is switched off and content starts visible.

## Components

- **Facts bar** (`Facts.tsx`, `pages` in `src/data/facts.json`): ink strip directly under the hero, 4 figures with uppercase labels.
- **Spec row** (`sites` in `src/data/facts.json`): ice strip after a dive site's intro, across the section width; level as text, figures in Quicksand 600 navy. Only facts stated in that site's own text; sites with fewer than two get none.
- **Tabs**: 4px segmented buttons; inactive white with hairline, active navy. A bar with a single tab is hidden. Scrolls sideways when it does not fit.
- **Price list** (`src/components/elementor/priceList.ts`, the accordion of price tables on /pricing/): one category at a time under its own heading (Quicksand 400 28px navy), the first (room rates) by default, with a category menu, one entry per category (2px ink rule, hairline rows, chosen one navy), sticky beside the list on screens 1025px and up, a row of 4px buttons that scrolls sideways above it on tablets and phones. No "All prices" entry (owner request 2026-11-03); a chosen category is in the URL hash (`/pricing/#dive-prices`), so links can open a category. Room rates read as rows (room name left, price right in navy, hairlines) instead of navy boxes; the price tables open with a 2px ink rule, uppercase Quicksand labels, prices right-aligned in navy. Without JavaScript and with `?original` it stays the accordion. (Owner request 2026-11-03: the FAQ index + panel did not suit the price section.)
- **FAQ** (all screen sizes; owner reference 2026-11-03): each question is a white card (1px hairline, 12px radius, soft shadow, 12px apart), question in Quicksand 500 17px with a plain navy plus/minus; the answer opens inside the card (one at a time, as on the original; click or Enter toggles). Beside the questions (below them on phones) a collage of three photos with 12px corners: the section's original photo tall on the right, two more photos of the same page stacked on the left (3 : 2), chosen by `src/components/elementor/faqPhotos.ts` (the nearest real photos before the FAQ, no banners or icons, never the same photo twice). With fewer photos on the page the collage has two or one. The original photo stands still there (no parallax). `?original` shows the original single photo and accordion. (Replaces the index + panel of 2026-11-02.) The homepage FAQ (`src/components/home/FAQ.tsx`, Accordion variant "cards") has the same cards and collage (FAQ photo tall, the pool and the manta stacked), on the ice band, with the heading in Quicksand 600 and no "FAQ" label; `?original` keeps it as on the live site.
- The small "FAQ" label above the FAQ heading is hidden. (History: the first Logbook pass showed every answer open in two columns; on 2026-11-02 the owner asked for toggles and chose an index + answer panel; on 2026-11-03 the owner replaced it with the question cards and photo collage.)
- **Overlay card** (course pages: a white card laid over the hero with `position: absolute` in the original): on screens up to 1024px it joins the flow under the hero and the next section drops the fixed room it kept (`rd-overlay-card` / `rd-after-overlay`, read from the page CSS in `ElementorPage.tsx`); the denser Logbook card left an empty band of 200-550px there.
- **Restaurant menu tabs** (/restaurant/): the fourteen categories wrap onto two rows as 4px segmented buttons (in one row "Dessert" ran past the screen edge, on the live site too).
- **Chips**: short fact lists ("Types of dives") as 4px outlined navy tags. A chip list that Elementor split over several list widgets (two or three per widget, sometimes a one-item list after them; every chip list on the site) is one aligned grid: every list in the run gets the same column width, sized from its longest chip (`--rd-chip-len`, set in `ElementorNode.tsx`), 8px between all rows; columns that do not fit fall back to one chip per row.
- **Card grids** (two or more child containers with a photo, heading, text and button side by side): rows of a table under a 2px ink rule; photo 180px, text, button on the right; hover tints the row. A single photo + text block keeps its original two-column layout (fixed 2026-11-03: treating those as rows squeezed the text into the 180px photo column on 25 sections of 13 pages).
- **Buttons** (`.theme-btn`): Quicksand 600, 4px. Fill navy, hover navy-deep. Outline: white with navy border, hover ice. Focus 2px navy ring. Press 1px.
- **Jump-nav and back to top**: as before, square 4px. The jump-nav hides once the footer comes into view. On phones it runs flush along the top edge, full width (no text showing above it), and the back-to-top button only appears while the visitor scrolls up, so the text beside the WhatsApp and booking buttons stays free while reading.

## Rules

- No new copy and no invented numbers; facts come from the page's own text (owner list of content errors: `docs/HANDOFF.md`).
- No eyebrow labels above headings, no em-dashes in new UI text, no decorative dots, no gradients beyond the existing footer.
- Every value comes from `tokens.css`.
