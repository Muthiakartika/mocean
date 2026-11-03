# Mocean design system: Logbook (inner pages)

Single source of truth for the redesign layer of the 55 inner pages (Elementor content rendered by `src/components/elementor/`).
Direction "A. Logbook", chosen 2026-11-02 from three options (https://claude.ai/artifact/Y93HUFETEJ3HVAJm5hLDH3, private).
Code: `src/styles/redesign/tokens.css` (tokens), `src/styles/redesign/inner-pages.css` (the layer), `src/components/elementor/Facts.tsx` + `src/data/facts.json` (facts bars), `src/components/elementor/PageNav.tsx` (jump-nav, back to top).

The homepage is not part of this layer. The original design stays reachable with `?original` in the URL (sets `<html data-design="original">`, which switches the whole layer and the facts bars off); the layout comparison scripts use it.

## Theses

**Visual.** A dive log: the numbers a diver plans with come before the prose. Light and technical: white pages, an ice-blue band colour, ink text, navy #111F90 as the only accent. Headings and figures in Jost 600, running text in Quicksand 500 at 17px, flush with the section edges, uppercase Jost labels for data. Sharp 4px corners everywhere, 1px hairlines, tables and rows instead of floating cards. Each dive site shows a spec row (depth, water, currents, wildlife, level) taken from its own text; pages with numbers in their copy get a facts bar under the hero; card grids read as rows; FAQs are compact accordions.

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
| Section heading (the larger line of each Elementor heading pair) | Jost | page size, capped 40px desktop / 30px mobile; 1.1; tracking -0.01em | 600 | page colour (navy or ink) |
| Elementor heading widget on phones | Jost | page size, capped 30px; the page title in the hero 40px; line height 1.15 | page | page colour |
| Deck (the smaller line) | Quicksand | 19px / 1.4 (17px mobile) | 500 | at 80% opacity |
| Body | Quicksand | 17px / 1.65; full-width text runs flush with the section, justified where the original was (left on phones), with hyphenation; text in columns is left-aligned without hyphenation | 500 | body |
| Figure (facts) | Jost | 28px / 1, units 15px | 600 | navy (white on ink) |
| Label | Jost | 12px uppercase, tracking 0.08em | 500 | meta |
| FAQ question (accordion) | Jost | 19px / 1.3 | 600 | ink |
| FAQ index row (wide screens) | Jost | 17px / 1.3 | 500, open 600 | ink, open white on navy |
| FAQ panel question | Jost | 26px / 1.2 | 600 | navy |
| Chip, tab, button | Jost | 14-16px / 1 | 500-600 | navy / white |

Tabular figures everywhere numbers line up. Justified text keeps the original alignment only where it runs the full width of a section on wide screens; text in columns (beside a photo, in tabs, 250-450px wide) and all text on phones is left-aligned, because narrow justified lines open wide gaps and split words (owner feedback 2026-11-02). Which line of a heading pair leads comes from the original CSS (`scripts/migration/heading-roles.mjs`).

## Space

Scale (px): 4, 8, 12, 16, 24, 32, 48, 64, 96. Section padding `min(original, 96px)` desktop, `min(original, 56px)` at ≤767px; paddings over 300px (room reserved for an overlapping card) and the hero keep their value. Full-width text keeps the section width so it lines up with the grids and photos around it (owner request 2026-11-02, instead of a narrow reading column).

## Shape

One radius: `--rd-r` 4px for buttons, chips, tabs, cards, images in content, the jump-nav and the back-to-top button. Borders 1px `--rd-line`; tables open with a 2px ink rule. No shadows except the floating jump-nav (`--rd-shadow-float`).

Z-index: jump-nav and back-to-top 20, floating WhatsApp/booking 30 (existing), header menu panel 40 (existing).

## Motion

| Token | Value | Use |
|---|---|---|
| `--rd-ease` | `cubic-bezier(0.25, 1, 0.5, 1)` | every transition |
| `--rd-t-hover` | 140ms | hover colour, row tint, press |
| `--rd-t-swap` | 0ms | tabs and FAQ (instant) |

No entrance animations: Elementor's fadeInUp is switched off and content starts visible.

## Components

- **Facts bar** (`Facts.tsx`, `pages` in `src/data/facts.json`): ink strip directly under the hero, 4 figures with uppercase labels.
- **Spec row** (`sites` in `src/data/facts.json`): ice strip after a dive site's intro, across the section width; level as text, figures in Jost 600 navy. Only facts stated in that site's own text; sites with fewer than two get none.
- **Tabs**: 4px segmented buttons; inactive white with hairline, active navy. A bar with a single tab is hidden. Scrolls sideways when it does not fit.
- **FAQ, wide screens (1025px and up)**: index + panel (`src/components/elementor/faqPanel.ts`). The questions form an index under a 2px ink rule (Jost 500 17px rows, hairlines, chevron; the open one navy with white text, hover white with navy text). The chosen answer appears in a white panel beside it (1px hairline, 4px radius, 32px padding): question in Jost 600 26px navy, answer at 18px / 1.7, then a "Next question" link. One question is always open (the first by default); clicking the open one leaves it open, ↑/↓ move through the index. The panel replaces the original photo. The shorter column stays in view while the other scrolls (for long answers such as the room rates on /pricing/). After a question is picked far down a long answer, the page scrolls back to the start of the new one. The panel shows a copy of the whole answer, so price cards and tables keep their original layout.
- **FAQ, tablet and phone, and without JavaScript**: an accordion as on the original (one answer open at a time, click or Enter toggles), next to the original photo where there is room. Opens under a 2px ink rule, items separated by hairlines, questions in Jost 600; a 4px square marker with plus/minus, outlined when closed and navy when open.
- The small "FAQ" label above the FAQ heading is hidden. (The first Logbook pass showed every answer open in two columns; on 2026-11-02 the owner asked for toggles, then chose the index + panel from three options.)
- **Chips**: short fact lists ("Types of dives") as 4px outlined navy tags.
- **Card grids** (child containers with a photo, heading, text and button): rows of a table under a 2px ink rule; photo 180px, text, button on the right; hover tints the row.
- **Buttons** (`.theme-btn`): Jost 600, 4px. Fill navy, hover navy-deep. Outline: white with navy border, hover ice. Focus 2px navy ring. Press 1px.
- **Jump-nav and back to top**: as before, square 4px. The jump-nav hides once the footer comes into view. On phones it runs flush along the top edge, full width (no text showing above it), and the back-to-top button only appears while the visitor scrolls up, so the text beside the WhatsApp and booking buttons stays free while reading.

## Rules

- No new copy and no invented numbers; facts come from the page's own text (owner list of content errors: `docs/HANDOFF.md`).
- No eyebrow labels above headings, no em-dashes in new UI text, no decorative dots, no gradients beyond the existing footer.
- Every value comes from `tokens.css`.
